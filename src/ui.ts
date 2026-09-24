import { ProxyItem, EdgeNode, PoolStats, FailoverState } from './types';

export function renderDashboardHtml(
  activePool: ProxyItem[],
  edgeNodes: EdgeNode[],
  stats: PoolStats,
  workerHost: string,
  pinnedProxy: FailoverState
): string {
  const serializedPool = JSON.stringify(activePool);
  const serializedNodes = JSON.stringify(edgeNodes);
  const serializedPinned = JSON.stringify(pinnedProxy);

  // Group countries for server-side filter options
  const countryCounts: Record<string, { count: number; flag: string }> = {};
  for (const p of activePool) {
    const c = p.country || 'Global Edge';
    if (!countryCounts[c]) {
      countryCounts[c] = { count: 0, flag: p.flag || '🌐' };
    }
    countryCounts[c].count++;
  }
  const countryList = Object.entries(countryCounts).sort((a, b) => b[1].count - a[1].count);

  // Group edge nodes by continent
  const continentCounts: Record<string, number> = {};
  for (const n of edgeNodes) {
    const cont = n.continent || 'Global';
    continentCounts[cont] = (continentCounts[cont] || 0) + 1;
  }

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GRPROXY — Ultra-Fast Anti-Censorship, Telegram & Cloudflare Edge Network</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              50: '#ecfdf5',
              400: '#34d399',
              500: '#10b981',
              600: '#059669',
              700: '#047857',
            },
            darkBg: '#07090e',
            cardBg: '#0d1424',
            cardBorder: '#1e293b',
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #07090e; color: #f1f5f9; }
    .glass-card { background: rgba(13, 20, 36, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.07); }
    .glass-card:hover { border-color: rgba(16, 185, 129, 0.3); }
    .glow-green { box-shadow: 0 0 30px -5px rgba(16, 185, 129, 0.25); }
    .glow-cyan { box-shadow: 0 0 30px -5px rgba(6, 182, 212, 0.25); }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #07090e; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
    .secret-text { word-break: break-all; }
  </style>
</head>
<body class="min-h-screen font-sans antialiased text-slate-200 selection:bg-brand-500 selection:text-black">

  <!-- Toast Notification Container -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-20 opacity-0 bg-slate-900 border border-brand-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 pointer-events-none">
    <span id="toastIcon" class="text-brand-400 text-xl font-bold">✓</span>
    <span id="toastMsg" class="font-medium text-xs">Action succeeded</span>
  </div>

  <!-- QR Code Modal -->
  <div id="qrModal" class="fixed inset-0 z-50 hidden bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card rounded-3xl max-w-sm w-full p-6 text-center border border-slate-700 shadow-2xl relative">
      <button onclick="closeQrModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>
      <h3 id="qrTitle" class="text-lg font-bold text-white mb-2 font-mono">Scan with Phone</h3>
      <p id="qrDesc" class="text-xs text-slate-400 mb-4">Point your mobile camera to import directly into your proxy client</p>
      <div id="qrcode" class="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4"></div>
      <div class="flex space-x-2">
        <button id="qrCopyBtn" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition">
          Copy Link
        </button>
        <button onclick="closeQrModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Credential Inspector Modal -->
  <div id="credModal" class="fixed inset-0 z-50 hidden bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card rounded-3xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl relative space-y-4">
      <button onclick="closeCredModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">✕</button>
      <div class="flex items-center space-x-3">
        <span id="credFlag" class="text-3xl">🌐</span>
        <div>
          <h3 id="credTitle" class="text-base font-bold text-white font-mono">Proxy Credentials Inspector</h3>
          <p id="credSubtitle" class="text-xs text-slate-400">Exact connection details for manual setup in any app</p>
        </div>
      </div>

      <div class="space-y-3 font-mono text-xs">
        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase">Host / Server IP</span>
            <span id="credIp" class="text-white font-bold select-all"></span>
          </div>
          <button onclick="copyElementText('credIp', 'IP Address copied!')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">Copy</button>
        </div>

        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase">Port</span>
            <span id="credPort" class="text-brand-400 font-bold select-all"></span>
          </div>
          <button onclick="copyElementText('credPort', 'Port copied!')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">Copy</button>
        </div>

        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase">Protocol</span>
            <span id="credProtocol" class="text-cyan-400 font-bold uppercase select-all"></span>
          </div>
          <span id="credProtocolBadge" class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Active</span>
        </div>

        <!-- Secret for MTProto -->
        <div id="credSecretBlock" class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-[10px] uppercase">MTProto Secret Key</span>
            <button onclick="copyElementText('credSecret', 'Secret copied!')" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg">Copy Secret</button>
          </div>
          <div id="credSecret" class="text-slate-300 break-all select-all text-[11px] bg-black/40 p-2 rounded-lg border border-slate-900"></div>
        </div>

        <!-- Username/Password for SOCKS5 -->
        <div id="credAuthBlock" class="hidden bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">Username</span>
              <span id="credUser" class="text-white select-all">none</span>
            </div>
            <button onclick="copyElementText('credUser', 'Username copied!')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">Copy</button>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <span class="text-slate-400 block text-[10px] uppercase">Password</span>
              <span id="credPass" class="text-white select-all">none</span>
            </div>
            <button onclick="copyElementText('credPass', 'Password copied!')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700">Copy</button>
          </div>
        </div>

        <!-- Terminal Command Snippet -->
        <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-[10px] uppercase">cURL Command</span>
            <button onclick="copyElementText('credCurl', 'cURL command copied!')" class="text-brand-400 text-[11px] hover:underline">Copy</button>
          </div>
          <div id="credCurl" class="text-slate-400 text-[11px] truncate select-all"></div>
        </div>
      </div>

      <div class="flex space-x-2 pt-2">
        <a id="credTgBtn" href="#" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs text-center transition flex items-center justify-center space-x-1.5">
          <span>✈️ 1-Tap Add to Telegram</span>
        </a>
        <button onclick="closeCredModal()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Navigation Bar -->
  <header class="border-b border-slate-800/80 sticky top-0 z-40 bg-[#07090e]/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center space-x-3.5">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-500 via-emerald-400 to-cyan-400 flex items-center justify-center font-mono font-extrabold text-slate-950 text-xl shadow-lg shadow-brand-500/20">
          GR
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-xl font-bold tracking-tight text-white font-mono">GRPROXY</h1>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5 pulse-dot"></span>
              100+ COUNTRIES EDGE
            </span>
          </div>
          <p class="text-xs text-slate-400">Zero-Slowdown Anti-Censorship & Telegram Anycast Hub</p>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        <button onclick="switchTab('extension')" class="hidden sm:flex bg-gradient-to-r from-cyan-600/30 to-brand-600/30 hover:from-cyan-600/40 hover:to-brand-600/40 text-cyan-300 border border-cyan-500/40 text-xs font-bold py-2 px-3 sm:px-4 rounded-xl transition items-center space-x-1.5 shadow">
          <span>🧩 Chrome Extension</span>
        </button>
        <button onclick="switchTab('failover')" class="bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-1.5 shadow">
          <span>🔄 Auto-Failover</span>
        </button>
        <button onclick="triggerScrape()" id="scrapeBtn" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-2 shadow">
          <span id="scrapeSpinner" class="hidden animate-spin">🔄</span>
          <span>⚡ Scrape &amp; Prune</span>
        </button>
        <button onclick="copySubscription()" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-brand-500/20">
          <span>📱 App Sub Link</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- Metrics Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-card p-5 rounded-3xl border border-slate-800/80">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Active Telegram Proxies</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-baseline space-x-2">
          <span id="activeCount">${stats.totalAlive}</span>
          <span class="text-xs font-normal text-brand-400">100+ Live</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">Auto-tested via raw TCP sockets</div>
      </div>

      <div class="glass-card p-5 rounded-3xl border border-slate-800/80">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Cloudflare Edge Countries</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
          ${edgeNodes.length} <span class="text-sm font-sans text-slate-400 font-normal">Regions</span>
        </div>
        <div class="mt-2 text-xs text-slate-500 truncate">100+ Global Anycast Locations</div>
      </div>

      <div class="glass-card p-5 rounded-3xl border border-slate-800/80">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Auto-Pinned Failover Route</div>
        <div class="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono truncate flex items-center space-x-1.5">
          <span>${pinnedProxy.flag}</span>
          <span class="truncate">${pinnedProxy.country}</span>
        </div>
        <div class="mt-2 text-xs text-slate-500 flex items-center space-x-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot"></span>
          <span>Pinned • Zero churn until lag</span>
        </div>
      </div>

      <div class="glass-card p-5 rounded-3xl border border-slate-800/80">
        <div class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Average Global Ping</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
          ${stats.avgLatency || 45} <span class="text-sm font-sans text-slate-400 font-normal">ms</span>
        </div>
        <div class="mt-2 text-xs text-slate-500">Ultra-fast edge response</div>
      </div>
    </div>

    <!-- ZERO-SLOWDOWN SPEED BOOSTER BANNER -->
    <div class="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-brand-500/25 rounded-3xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 glow-green">
      <div class="space-y-1.5 max-w-4xl">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🚀</span>
          <h2 class="text-sm font-extrabold text-white uppercase tracking-wider">
            Why GRPROXY Increases Your Internet Speed (Zero Speed Loss Engine):
          </h2>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Traditional VPNs force 100% of your device's traffic through a remote server bottleneck, killing YouTube 4K streaming, downloads, and gaming. 
          <strong class="text-brand-400 font-semibold">GRPROXY Smart Split-Routing</strong> only routes blocked services (Telegram, Discord, restricted endpoints) through Cloudflare's ultra-low latency Anycast network, while letting your local YouTube, Netflix, Steam, and banking apps run <strong class="text-cyan-300 font-semibold">DIRECT at full native fiber line speed (up to 1 Gbps)</strong>!
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5 shrink-0">
        <button onclick="switchTab('extension')" class="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-2.5 px-3.5 rounded-xl transition flex items-center space-x-1.5 shadow">
          <span>🧩 Chrome Extension</span>
        </button>
        <button onclick="launchAutoTg()" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-brand-500/25">
          <span>⚡ Auto-Rotate in TG</span>
        </button>
      </div>
    </div>

    <!-- MAIN NAVIGATION TABS -->
    <div class="flex border-b border-slate-800 space-x-3 sm:space-x-6 overflow-x-auto pb-1">
      <button onclick="switchTab('telegram')" id="tabBtnTg" class="pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0">
        <span>✈️ Telegram Proxies (Full Credentials)</span>
        <span class="bg-brand-500/10 text-brand-400 text-xs px-2 py-0.5 rounded-full border border-brand-500/20">${activePool.length}</span>
      </button>
      <button onclick="switchTab('failover')" id="tabBtnFailover" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>🔄 Auto-Rotating Failover</span>
        <span class="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/20">Smart Pin</span>
      </button>
      <button onclick="switchTab('edge')" id="tabBtnEdge" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>⚡ 100+ Cloudflare Edge Countries</span>
        <span class="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-500/20">${edgeNodes.length}</span>
      </button>
      <button onclick="switchTab('extension')" id="tabBtnExt" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>🧩 Chrome Extension</span>
        <span class="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">New V3</span>
      </button>
      <button onclick="switchTab('guide')" id="tabBtnGuide" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>📖 Setup Guides</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- TAB 1: TELEGRAM PROXIES WITH CREDENTIALS   -->
    <!-- ========================================== -->
    <div id="tabTelegram" class="space-y-4">

      <!-- Filter & Search Controls -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Protocol Pills -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button onclick="filterProtocol('all')" class="proto-filter bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition" data-proto="all">All Protocols</button>
          <button onclick="filterProtocol('mtproto')" class="proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-proto="mtproto">MTProto (Fake-TLS)</button>
          <button onclick="filterProtocol('socks5')" class="proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-proto="socks5">SOCKS5</button>
        </div>

        <!-- Filter Dropdowns & Search -->
        <div class="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <!-- Countries Filter Dropdown -->
          <select id="countryFilter" onchange="applyFilters()" class="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-500">
            <option value="all">🌍 All Countries (${activePool.length})</option>
            ${countryList.map(([country, info]) => `
              <option value="${country}">${info.flag} ${country} (${info.count})</option>
            `).join('')}
          </select>

          <!-- Ping Filter -->
          <select id="pingFilter" onchange="applyFilters()" class="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-500">
            <option value="all">⚡ All Latencies</option>
            <option value="80">&lt; 80ms (Ultra Fast)</option>
            <option value="150">&lt; 150ms (Fast)</option>
            <option value="300">&lt; 300ms (Normal)</option>
          </select>

          <!-- Search Bar -->
          <input type="text" id="searchInput" oninput="applyFilters()" placeholder="Search IP, Port, Secret, Country..." class="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2 sm:w-60 focus:outline-none focus:border-brand-500 text-slate-200 placeholder-slate-500">
        </div>
      </div>

      <!-- Active Filter Status -->
      <div id="filterStatus" class="text-xs text-slate-400 flex items-center justify-between">
        <span>Showing <strong id="visibleCount" class="text-white font-mono">${activePool.length}</strong> active verified proxies with credentials</span>
        <button onclick="resetFilters()" class="text-xs text-brand-400 hover:underline">Reset Filters</button>
      </div>

      <!-- Proxy Grid (Rendered via JS with Full Credential Blocks) -->
      <div id="proxyContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 2: AUTO-ROTATING SMART FAILOVER        -->
    <!-- ========================================== -->
    <div id="tabFailover" class="space-y-6 hidden">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">🔄</span>
              <h3 class="text-lg font-bold text-white font-mono">Intelligent Auto-Failover Proxy Engine</h3>
            </div>
            <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Solves the problem of dropped connections and constant reconnect loops. Traffic stays pinned to the fastest verified proxy until it lags or fails, and then hot-swaps to the next healthy proxy automatically.
            </p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <button onclick="forceFailoverRotate()" class="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow">
              <span>⚡ Force Hot-Swap Now</span>
            </button>
            <button onclick="launchAutoTg()" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow">
              <span>✈️ Launch in Telegram</span>
            </button>
          </div>
        </div>

        <!-- Current Pinned Proxy Hero Display -->
        <div class="bg-slate-950/70 p-6 rounded-2xl border border-slate-800/90 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-2">
            <div class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Current Pinned Node</div>
            <div class="flex items-center space-x-3">
              <span class="text-4xl" id="pinnedFlag">${pinnedProxy.flag}</span>
              <div>
                <h4 id="pinnedCountry" class="text-base font-bold text-white font-mono">${pinnedProxy.country}</h4>
                <span id="pinnedProto" class="text-xs uppercase px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-bold">${pinnedProxy.protocol}</span>
              </div>
            </div>
            <div class="pt-2 text-xs text-slate-400">
              Pinned since: <span id="pinnedSince" class="text-slate-200 font-mono">Active</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Connection Endpoint</div>
            <div class="font-mono text-sm text-slate-200 space-y-1">
              <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span class="text-slate-400 text-xs">Host:</span>
                <span id="pinnedIp" class="text-white font-bold select-all">${pinnedProxy.ip}</span>
                <button onclick="copyElementText('pinnedIp', 'Host copied!')" class="text-brand-400 hover:underline text-xs">Copy</button>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span class="text-slate-400 text-xs">Port:</span>
                <span id="pinnedPort" class="text-brand-400 font-bold select-all">${pinnedProxy.port}</span>
                <button onclick="copyElementText('pinnedPort', 'Port copied!')" class="text-brand-400 hover:underline text-xs">Copy</button>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Health &amp; Telemetry</div>
            <div class="space-y-1 font-mono text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Response Ping:</span>
                <span id="pinnedPing" class="text-emerald-400 font-bold">${pinnedProxy.latency} ms</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Failovers Recorded:</span>
                <span id="pinnedCount" class="text-cyan-400 font-bold">#${pinnedProxy.failoverCount}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Status:</span>
                <span class="text-brand-400 font-bold flex items-center space-x-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-400 pulse-dot"></span>
                  <span>Health Verified</span>
                </span>
              </div>
            </div>
            <div class="pt-2">
              <button onclick="copyToClipboard('${workerHost ? `https://${workerHost}/rotate/tg` : 'https://grproxy.grwebdevs5.workers.dev/rotate/tg'}', 'Auto-rotating TG link copied!')" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-xl border border-slate-700 font-semibold transition">
                📋 Copy Auto-Rotating TG Link
              </button>
            </div>
          </div>
        </div>

        <!-- Universal Auto-Config PAC URL -->
        <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
          <div class="flex items-center space-x-2">
            <span class="text-lg">🌐</span>
            <h4 class="text-sm font-bold text-white uppercase tracking-wider">Universal Browser / System PAC URL (Zero Setup Automation)</h4>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">
            Paste this URL into your Windows, macOS, or Browser network settings under <strong>"Automatic Proxy Configuration"</strong>. The browser will automatically retrieve the active healthy proxy and only accelerate blocked websites while leaving YouTube 4K directly at full speed:
          </p>
          <div class="flex items-center space-x-2">
            <input type="text" readonly value="${workerHost ? `https://${workerHost}/pac` : 'https://grproxy.grwebdevs5.workers.dev/pac'}" id="pacInput" class="flex-1 bg-slate-950 border border-slate-800 text-brand-300 font-mono text-xs p-3 rounded-xl select-all focus:outline-none focus:border-brand-500">
            <button onclick="copyElementValue('pacInput', 'PAC URL copied to clipboard!')" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl transition shrink-0">
              Copy PAC URL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 3: 100+ CLOUDFLARE EDGE COUNTRIES      -->
    <!-- ========================================== -->
    <div id="tabEdge" class="space-y-6 hidden">
      <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-white flex items-center space-x-2">
              <span>⚡ Cloudflare Global Anycast Edge Network</span>
              <span class="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-mono">${edgeNodes.length} Locations</span>
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed mt-1">
              Direct connection into Cloudflare's ultra-high-speed Anycast edge across 100+ countries with TLS 1.3 encryption.
            </p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <button onclick="copySubscription()" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center space-x-1 shadow">
              <span>📱 Copy Sing-Box Sub</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Edge Search & Continent Filter -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0" id="continentPills">
          <button onclick="filterContinent('all')" class="cont-filter bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition" data-cont="all">All (${edgeNodes.length})</button>
          <button onclick="filterContinent('Middle East')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="Middle East">Middle East</button>
          <button onclick="filterContinent('Asia')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="Asia">Asia</button>
          <button onclick="filterContinent('Europe')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="Europe">Europe</button>
          <button onclick="filterContinent('North America')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="North America">Americas</button>
          <button onclick="filterContinent('Africa')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="Africa">Africa</button>
          <button onclick="filterContinent('Oceania')" class="cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition" data-cont="Oceania">Oceania</button>
        </div>

        <input type="text" id="edgeSearch" oninput="applyEdgeFilter()" placeholder="Search country, city, clean IP..." class="bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2 sm:w-64 focus:outline-none focus:border-cyan-500 text-slate-200 placeholder-slate-500">
      </div>

      <!-- Edge Grid -->
      <div id="edgeContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 4: CHROME EXTENSION SHOWCASE           -->
    <!-- ========================================== -->
    <div id="tabExtension" class="space-y-6 hidden">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 glow-cyan">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2">
              <span class="text-3xl">🧩</span>
              <h3 class="text-xl font-bold text-white font-mono">GRPROXY Chrome Extension (Manifest V3)</h3>
            </div>
            <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
              The world's first speed-boosting proxy extension. Runs directly in Chrome, Edge, Brave, and Opera. Gives you 100+ Cloudflare edge countries and intelligent split-routing.
            </p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <a href="https://github.com/grwebdevs/grproxy/tree/main/extension" target="_blank" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20">
              <span>📥 Download Extension Code</span>
            </a>
          </div>
        </div>

        <!-- Extension Key Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">⚡</div>
            <h4 class="text-sm font-bold text-white">Smart Speed Booster</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Never slows down your browsing. High-bandwidth media (YouTube 4K, Netflix, Twitch) bypasses directly, while blocked sites are accelerated over Cloudflare Anycast edge.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">🌍</div>
            <h4 class="text-sm font-bold text-white">100+ Global Edge Locations</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Hop between 100+ countries with 1-click. Live ping indicator chooses the lowest latency Anycast routing automatically.
            </p>
          </div>

          <div class="bg-slate-950/70 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">🔒</div>
            <h4 class="text-sm font-bold text-white">Native Manifest V3 &amp; Zero Churn</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Uses Chrome's native <code class="text-cyan-300 font-mono">chrome.proxy</code> API. Built-in auto-failover ensures zero dropped calls or reconnect loops.
            </p>
          </div>
        </div>

        <!-- How to install in 3 steps -->
        <div class="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 class="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span>🛠️ How to Install in 60 Seconds:</span>
          </h4>
          <ol class="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              Locate the extension folder on your machine at:
              <div class="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 my-1.5 select-all border border-slate-800">
                d:\\GR WEB DEVS\\Cloudflare workers TOOLS BUILDS\\New ideas\\grproxy\\extension
              </div>
            </li>
            <li>In Google Chrome or Microsoft Edge, navigate to <code class="text-white font-mono bg-slate-900 px-2 py-0.5 rounded">chrome://extensions</code> in your URL bar.</li>
            <li>Enable the <strong class="text-brand-400">"Developer mode"</strong> toggle in the top-right corner.</li>
            <li>Click the <strong class="text-cyan-400">"Load unpacked"</strong> button in the top-left and select the <code class="text-white font-mono">grproxy/extension</code> directory.</li>
            <li>The <strong>GRPROXY</strong> icon will appear in your Chrome toolbar. Click it, select your desired country or "Speed Booster Mode", and click Connect!</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 5: STEP-BY-STEP CONNECTION GUIDES      -->
    <!-- ========================================== -->
    <div id="tabGuide" class="space-y-6 hidden">
      <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
        <h3 class="text-lg font-bold text-white flex items-center space-x-2 font-mono">
          <span>📖 Complete Connection &amp; Setup Guide</span>
        </h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Detailed instructions for Mobile, Desktop, Chrome Extension, and Browser PAC.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- GUIDE 1: TELEGRAM MOBILE -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">📱</span>
            <div>
              <h4 class="text-base font-bold text-white">Telegram on Mobile (Android &amp; iPhone)</h4>
              <p class="text-xs text-brand-400">Zero Phone Slowdown • No Extra Apps Needed</p>
            </div>
          </div>
          <ol class="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed border-t border-slate-800 pt-3">
            <li>Open this GRPROXY website on your phone browser.</li>
            <li>In the <strong>Telegram Proxies</strong> tab, pick 2 or 3 proxies with low ping (e.g. 🇦🇪 UAE, 🇵🇰 Pakistan, or 🇩🇪 Germany).</li>
            <li>Tap the green <strong class="text-brand-400">"✈️ 1-Tap Add to TG"</strong> button.</li>
            <li>Your Telegram app opens instantly. Tap <strong class="text-white">"Enable Proxy"</strong> in the bottom dialog.</li>
            <li>In Telegram, navigate to <strong class="text-white">Settings &gt; Data and Storage &gt; Proxy Settings</strong>.</li>
            <li>Toggle ON <strong class="text-brand-400">"Auto-switch proxy"</strong>.</li>
            <li class="text-emerald-400"><strong>Done!</strong> Telegram rotates between your active proxies seamlessly. All your other apps (banking, YouTube, WhatsApp) bypass the proxy at 100% native speed!</li>
          </ol>
        </div>

        <!-- GUIDE 2: TELEGRAM DESKTOP -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">💻</span>
            <div>
              <h4 class="text-base font-bold text-white">Telegram Desktop (Windows &amp; Mac)</h4>
              <p class="text-xs text-cyan-400">1-Click Import or Manual Credentials Entry</p>
            </div>
          </div>
          <div class="space-y-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
            <p><strong class="text-white">Method A (1-Click):</strong> Click any <strong class="text-brand-400">"1-Tap Add to TG"</strong> button. When browser prompts <em>"Open Telegram Desktop?"</em>, click <strong>Open</strong>, then click <strong>Enable Proxy</strong>.</p>
            <p><strong class="text-white">Method B (Manual Entry with Credentials):</strong></p>
            <ol class="space-y-1.5 list-decimal list-inside pl-1 text-slate-400">
              <li>Open Telegram Desktop &gt; <strong>Settings</strong> &gt; <strong>Advanced</strong>.</li>
              <li>Under <em>Data and storage</em>, click <strong>Connection type</strong>.</li>
              <li>Select <strong>Use custom proxy</strong> &gt; click <strong>Add proxy</strong>.</li>
              <li>Choose <strong>MTPROTO</strong> (or SOCKS5).</li>
              <li>Click <strong>"⚙️ Inspect"</strong> on any card on this page to copy the IP, Port, and Secret into Telegram.</li>
              <li>Click <strong>Save</strong>. Telegram immediately connects!</li>
            </ol>
          </div>
        </div>

        <!-- GUIDE 3: CHROME EXTENSION -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">🧩</span>
            <div>
              <h4 class="text-base font-bold text-white">GRPROXY Chrome Extension</h4>
              <p class="text-xs text-emerald-400">Speed Booster Mode • 100+ Countries</p>
            </div>
          </div>
          <ol class="space-y-2.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed border-t border-slate-800 pt-3">
            <li>Load the unpacked extension from <code class="text-cyan-300 font-mono">grproxy/extension</code> in <code class="text-white font-mono">chrome://extensions</code>.</li>
            <li>Pin the GRPROXY icon to your browser bar.</li>
            <li>Select <strong>"Speed Booster (Split-Routing)"</strong> mode.</li>
            <li>Choose your preferred Cloudflare edge country from 100+ options.</li>
            <li>Click <strong>Connect</strong>. Telegram Web, Discord, and blocked sites connect instantly while your local streaming remains at full 4K speed!</li>
          </ol>
        </div>

        <!-- GUIDE 4: SYSTEM PAC SCRIPT -->
        <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">🌐</span>
            <div>
              <h4 class="text-base font-bold text-white">Windows / Mac System PAC (Auto Proxy)</h4>
              <p class="text-xs text-purple-400">Automatic Proxy Configuration URL</p>
            </div>
          </div>
          <div class="space-y-2.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
            <ol class="space-y-1.5 list-decimal list-inside pl-1 text-slate-400">
              <li>In Windows, open <strong>Settings &gt; Network &amp; internet &gt; Proxy</strong>.</li>
              <li>Under <strong>Automatic proxy setup</strong>, turn ON <strong>"Use setup script"</strong>.</li>
              <li>Paste the PAC URL: <code class="text-brand-300 font-mono">${workerHost ? `https://${workerHost}/pac` : 'https://grproxy.grwebdevs5.workers.dev/pac'}</code>.</li>
              <li>Click <strong>Save</strong>.</li>
              <li>Your computer will automatically route blocked services through the healthiest proxy while keeping all heavy bandwidth local!</li>
            </ol>
          </div>
        </div>

      </div>
    </div>

  </main>

  <!-- Client-side State & Logic -->
  <script>
    const POOL_DATA = ${serializedPool};
    const EDGE_DATA = ${serializedNodes};
    const PINNED_DATA = ${serializedPinned};
    let currentProto = 'all';
    let currentContinent = 'all';
    let qrInstance = null;

    // Render Proxies with Explicit Credentials
    function renderProxies(list) {
      const container = document.getElementById('proxyContainer');
      const countEl = document.getElementById('visibleCount');
      if (countEl) countEl.innerText = list.length;

      if (list.length === 0) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-slate-500 text-sm">No proxies match the selected filters. Try choosing "All Countries" or resetting filters.</div>';
        return;
      }

      container.innerHTML = list.map(p => {
        const pingClass = p.latency < 80 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : (p.latency < 160 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20');

        const protoBadge = p.protocol === 'mtproto'
          ? '<span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold">MTProto</span>'
          : '<span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">SOCKS5</span>';

        return \`
          <div class="glass-card p-5 rounded-3xl border border-slate-800/80 hover:border-slate-700 transition duration-200 flex flex-col justify-between space-y-3.5">
            <!-- Header Row -->
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-3xl">\${p.flag || '🌐'}</span>
                <div>
                  <h4 class="font-bold text-white text-xs font-mono">\${p.country || 'Global'}</h4>
                  <div class="text-[11px] text-slate-400 font-mono">\${p.ip}:\${p.port}</div>
                </div>
              </div>
              <div class="flex items-center space-x-1.5">
                \${protoBadge}
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border \${pingClass}">\${p.latency}ms</span>
              </div>
            </div>

            <!-- Prominent Credentials Box -->
            <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 font-mono text-xs space-y-2">
              <div class="flex justify-between items-center text-slate-400">
                <span>IP / Host:</span>
                <div class="flex items-center space-x-1">
                  <span class="text-slate-200 select-all font-bold">\${p.ip}</span>
                  <button onclick="copyToClipboard('\${p.ip}', 'IP copied!')" class="text-brand-400 text-[10px] hover:underline px-1">copy</button>
                </div>
              </div>

              <div class="flex justify-between items-center text-slate-400">
                <span>Port:</span>
                <div class="flex items-center space-x-1">
                  <span class="text-brand-400 select-all font-bold">\${p.port}</span>
                  <button onclick="copyToClipboard('\${p.port}', 'Port copied!')" class="text-brand-400 text-[10px] hover:underline px-1">copy</button>
                </div>
              </div>

              \${p.protocol === 'mtproto' ? \`
                <div class="space-y-1 pt-1 border-t border-slate-900">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[10px] uppercase">Secret Key:</span>
                    <button onclick="copyToClipboard('\${p.secret}', 'Secret copied!')" class="text-brand-400 text-[10px] font-bold hover:underline">📋 Copy Secret</button>
                  </div>
                  <div class="text-slate-400 text-[10px] truncate select-all bg-slate-900/60 p-1.5 rounded border border-slate-900 font-mono">
                    \${p.secret || 'default'}
                  </div>
                </div>
              \` : \`
                <div class="space-y-1 pt-1 border-t border-slate-900">
                  <div class="flex justify-between items-center">
                    <span class="text-slate-400 text-[10px] uppercase">Auth:</span>
                    <button onclick="copyToClipboard('\${p.username || ''}:\${p.password || ''}', 'Auth credentials copied!')" class="text-brand-400 text-[10px] font-bold hover:underline">📋 Copy Auth</button>
                  </div>
                  <div class="text-slate-400 text-[10px] truncate select-all bg-slate-900/60 p-1.5 rounded border border-slate-900 font-mono">
                    \${p.username ? \`User: \${p.username} | Pass: \${p.password}\` : 'No Authentication Required'}
                  </div>
                </div>
              \`}
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-2 pt-1">
              <a href="\${p.tgLink}" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs text-center transition flex items-center justify-center space-x-1 shadow-sm">
                <span>✈️ 1-Tap Add to TG</span>
              </a>
              <button onclick="openCredModal('\${p.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" title="Inspect Full Credentials & Commands">
                ⚙️
              </button>
              <button onclick="showQrModal('\${p.tgLink}', '\${p.country} Proxy')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" title="Show QR Code">
                📱
              </button>
              <button onclick="copyToClipboard('\${p.tgLink}', 'Telegram link copied!')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" title="Copy Raw Link">
                📋
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    // Render 100+ Cloudflare Edge Nodes
    function renderEdgeNodes(nodes) {
      const container = document.getElementById('edgeContainer');
      if (!container) return;

      if (nodes.length === 0) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-slate-500 text-sm">No edge nodes match search query.</div>';
        return;
      }

      container.innerHTML = nodes.map(node => \`
        <div class="glass-card p-5 rounded-3xl border border-slate-800/80 hover:border-cyan-500/40 transition duration-300 space-y-3.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-3xl">\${node.flag}</span>
              <div>
                <h4 class="text-xs font-bold text-white font-mono">\${node.name}</h4>
                <span class="text-[11px] text-slate-400 font-mono">\${node.city} • \${node.continent}</span>
              </div>
            </div>
            <span class="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ~\${node.pingEstimate} ms
            </span>
          </div>

          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 font-mono text-xs space-y-1.5">
            <div class="text-slate-400 flex justify-between items-center">
              <span>Clean Anycast IP:</span>
              <div class="flex items-center space-x-1">
                <span class="text-slate-200 font-bold">\${node.cleanIp}</span>
                <button onclick="copyToClipboard('\${node.cleanIp}', 'Clean IP copied!')" class="text-cyan-400 text-[10px] hover:underline">copy</button>
              </div>
            </div>
            <div class="text-slate-400 flex justify-between">
              <span>Port / Security:</span>
              <span class="text-brand-400">443 / TLS 1.3</span>
            </div>
            <div class="text-slate-400 flex justify-between">
              <span>Protocol:</span>
              <span class="text-cyan-400 font-bold">VLESS-WebSocket</span>
            </div>
          </div>

          <div class="flex space-x-2 pt-1">
            <button onclick="copyToClipboard('\${node.vlessLink}', 'VLESS URL copied!')" class="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition border border-slate-700 flex items-center justify-center space-x-1">
              <span>📋 Copy Link</span>
            </button>
            <button onclick="showQrModal('\${node.vlessLink}', '\${node.name}')" class="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold py-2.5 px-3 rounded-xl text-xs transition">
              📱 QR
            </button>
          </div>
        </div>
      \`).join('');
    }

    // Filter Logic for Telegram Proxies
    function applyFilters() {
      const search = document.getElementById('searchInput').value.toLowerCase().trim();
      const maxPing = document.getElementById('pingFilter').value;
      const country = document.getElementById('countryFilter').value;

      const filtered = POOL_DATA.filter(item => {
        if (currentProto !== 'all' && item.protocol !== currentProto) return false;
        if (country !== 'all' && item.country !== country) return false;
        if (maxPing !== 'all' && item.latency > parseInt(maxPing, 10)) return false;
        if (search) {
          const matchIp = item.ip.toLowerCase().includes(search);
          const matchPort = item.port.toString().includes(search);
          const matchCountry = item.country.toLowerCase().includes(search);
          const matchSecret = item.secret ? item.secret.toLowerCase().includes(search) : false;
          if (!matchIp && !matchPort && !matchCountry && !matchSecret) return false;
        }
        return true;
      });

      renderProxies(filtered);
    }

    function filterProtocol(proto) {
      currentProto = proto;
      document.querySelectorAll('.proto-filter').forEach(btn => {
        if (btn.dataset.proto === proto) {
          btn.className = 'proto-filter bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition';
        } else {
          btn.className = 'proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition';
        }
      });
      applyFilters();
    }

    function resetFilters() {
      currentProto = 'all';
      document.getElementById('searchInput').value = '';
      document.getElementById('countryFilter').value = 'all';
      document.getElementById('pingFilter').value = 'all';
      document.querySelectorAll('.proto-filter').forEach(btn => {
        btn.className = btn.dataset.proto === 'all'
          ? 'proto-filter bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition'
          : 'proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition';
      });
      applyFilters();
    }

    // Filter Logic for Edge Nodes
    function applyEdgeFilter() {
      const search = document.getElementById('edgeSearch').value.toLowerCase().trim();
      const filtered = EDGE_DATA.filter(node => {
        if (currentContinent !== 'all' && node.continent !== currentContinent) return false;
        if (search) {
          const matchCountry = node.country.toLowerCase().includes(search);
          const matchCity = node.city.toLowerCase().includes(search);
          const matchIp = node.cleanIp.toLowerCase().includes(search);
          if (!matchCountry && !matchCity && !matchIp) return false;
        }
        return true;
      });
      renderEdgeNodes(filtered);
    }

    function filterContinent(cont) {
      currentContinent = cont;
      document.querySelectorAll('.cont-filter').forEach(btn => {
        if (btn.dataset.cont === cont) {
          btn.className = 'cont-filter bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition';
        } else {
          btn.className = 'cont-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs transition';
        }
      });
      applyEdgeFilter();
    }

    // Tab Navigation
    function switchTab(tab) {
      const tabTg = document.getElementById('tabTelegram');
      const tabFailover = document.getElementById('tabFailover');
      const tabEdge = document.getElementById('tabEdge');
      const tabExt = document.getElementById('tabExtension');
      const tabGuide = document.getElementById('tabGuide');

      const btnTg = document.getElementById('tabBtnTg');
      const btnFailover = document.getElementById('tabBtnFailover');
      const btnEdge = document.getElementById('tabBtnEdge');
      const btnExt = document.getElementById('tabBtnExt');
      const btnGuide = document.getElementById('tabBtnGuide');

      // Hide all
      [tabTg, tabFailover, tabEdge, tabExt, tabGuide].forEach(el => el && el.classList.add('hidden'));

      // Inactive tab styles
      const inactiveClass = 'pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0';
      [btnTg, btnFailover, btnEdge, btnExt, btnGuide].forEach(el => el && (el.className = inactiveClass));

      if (tab === 'telegram') {
        tabTg.classList.remove('hidden');
        btnTg.className = 'pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'failover') {
        tabFailover.classList.remove('hidden');
        btnFailover.className = 'pb-3 text-sm font-bold border-b-2 border-amber-500 text-amber-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'edge') {
        tabEdge.classList.remove('hidden');
        btnEdge.className = 'pb-3 text-sm font-bold border-b-2 border-cyan-500 text-cyan-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'extension') {
        tabExt.classList.remove('hidden');
        btnExt.className = 'pb-3 text-sm font-bold border-b-2 border-emerald-500 text-emerald-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'guide') {
        tabGuide.classList.remove('hidden');
        btnGuide.className = 'pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0';
      }
    }

    // Modal Handlers
    function showQrModal(text, title) {
      document.getElementById('qrTitle').innerText = title || 'Scan with Camera';
      document.getElementById('qrModal').classList.remove('hidden');
      const qrContainer = document.getElementById('qrcode');
      qrContainer.innerHTML = '';
      qrInstance = new QRCode(qrContainer, {
        text: text,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      document.getElementById('qrCopyBtn').onclick = () => copyToClipboard(text, 'Link copied!');
    }

    function closeQrModal() {
      document.getElementById('qrModal').classList.add('hidden');
    }

    function openCredModal(proxyId) {
      const p = POOL_DATA.find(item => item.id === proxyId);
      if (!p) return;

      document.getElementById('credFlag').innerText = p.flag || '🌐';
      document.getElementById('credTitle').innerText = \`\${p.country} \${p.protocol.toUpperCase()} Node\`;
      document.getElementById('credIp').innerText = p.ip;
      document.getElementById('credPort').innerText = p.port;
      document.getElementById('credProtocol').innerText = p.protocol;

      const secretBlock = document.getElementById('credSecretBlock');
      const authBlock = document.getElementById('credAuthBlock');

      if (p.protocol === 'mtproto') {
        secretBlock.classList.remove('hidden');
        authBlock.classList.add('hidden');
        document.getElementById('credSecret').innerText = p.secret || 'none';
        document.getElementById('credCurl').innerText = \`# Telegram MTProto Proxy: \${p.ip}:\${p.port}\`;
      } else {
        secretBlock.classList.add('hidden');
        authBlock.classList.remove('hidden');
        document.getElementById('credUser').innerText = p.username || 'none';
        document.getElementById('credPass').innerText = p.password || 'none';
        document.getElementById('credCurl').innerText = \`curl -x socks5://\${p.ip}:\${p.port} https://api.ipify.org\`;
      }

      document.getElementById('credTgBtn').href = p.tgLink;
      document.getElementById('credModal').classList.remove('hidden');
    }

    function closeCredModal() {
      document.getElementById('credModal').classList.add('hidden');
    }

    // Auto-Failover Actions
    async function forceFailoverRotate() {
      showToast('Contacting failover engine to hot-swap to next healthy proxy...');
      try {
        const resp = await fetch('/api/rotate?force=true');
        const data = await resp.json();
        if (data.success && data.pinned) {
          showToast(\`Hot-swapped! New pinned proxy: \${data.pinned.country} (\${data.pinned.ip})\`);
          setTimeout(() => window.location.reload(), 1200);
        }
      } catch (err) {
        showToast('Failover request failed.');
      }
    }

    function launchAutoTg() {
      window.location.href = '/rotate/tg';
    }

    function copySubscription() {
      const subUrl = window.location.origin + '/sub';
      copyToClipboard(subUrl, 'Sing-Box & V2Ray Universal Subscription copied!');
    }

    function copyElementText(elId, msg) {
      const el = document.getElementById(elId);
      if (el) {
        copyToClipboard(el.innerText.trim(), msg);
      }
    }

    function copyElementValue(elId, msg) {
      const el = document.getElementById(elId);
      if (el) {
        copyToClipboard(el.value.trim(), msg);
      }
    }

    function copyToClipboard(text, msg) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(msg || 'Copied to clipboard!');
      });
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = message;
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
      }, 3000);
    }

    async function triggerScrape() {
      const btn = document.getElementById('scrapeBtn');
      const spinner = document.getElementById('scrapeSpinner');
      spinner.classList.remove('hidden');
      btn.disabled = true;
      showToast('Scraping proxies and testing raw TCP sockets in background...');

      try {
        const resp = await fetch('/api/scrape', { method: 'POST' });
        const data = await resp.json();
        showToast(\`Scrape completed! Alive: \${data.aliveCount}, Pruned: \${data.prunedCount}\`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast('Scrape request failed.');
      } finally {
        spinner.classList.add('hidden');
        btn.disabled = false;
      }
    }

    // Initialize UI
    renderProxies(POOL_DATA);
    renderEdgeNodes(EDGE_DATA);
  </script>
</body>
</html>`;
}
