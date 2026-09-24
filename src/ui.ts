import { ProxyItem, EdgeNode, PoolStats } from './types';

export function renderDashboardHtml(
  activePool: ProxyItem[],
  edgeNodes: EdgeNode[],
  stats: PoolStats,
  workerHost: string
): string {
  const serializedPool = JSON.stringify(activePool);
  const serializedNodes = JSON.stringify(edgeNodes);

  // Group countries for server-side initial rendering
  const countryCounts: Record<string, { count: number; flag: string }> = {};
  for (const p of activePool) {
    const c = p.country || 'Global Edge';
    if (!countryCounts[c]) {
      countryCounts[c] = { count: 0, flag: p.flag || '🌐' };
    }
    countryCounts[c].count++;
  }
  const countryList = Object.entries(countryCounts).sort((a, b) => b[1].count - a[1].count);

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GRPROXY — High-Speed Anti-Censorship & Telegram Proxy Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
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
            },
            darkBg: '#090d16',
            cardBg: '#111827',
            cardBorder: '#1f2937',
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #090d16; color: #f3f4f6; }
    .glass-card { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glow-green { box-shadow: 0 0 25px -5px rgba(16, 185, 129, 0.3); }
    .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #090d16; }
    ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #374151; }
  </style>
</head>
<body class="min-h-screen font-sans antialiased text-gray-200 selection:bg-brand-500 selection:text-black">

  <!-- Toast Notification Container -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform transition-all duration-300 translate-y-20 opacity-0 bg-gray-900 border border-brand-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 pointer-events-none">
    <span id="toastIcon" class="text-brand-400 text-xl">✓</span>
    <span id="toastMsg" class="font-medium text-sm">Action succeeded</span>
  </div>

  <!-- QR Code Modal -->
  <div id="qrModal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="glass-card rounded-2xl max-w-sm w-full p-6 text-center border border-gray-700 shadow-2xl relative">
      <button onclick="closeQrModal()" class="absolute top-4 right-4 text-gray-400 hover:text-white text-lg">✕</button>
      <h3 id="qrTitle" class="text-lg font-bold text-white mb-2">Scan with Phone</h3>
      <p id="qrDesc" class="text-xs text-gray-400 mb-4">Open camera on your mobile phone to import directly</p>
      <div id="qrcode" class="bg-white p-4 rounded-xl inline-block shadow-inner mb-4"></div>
      <div class="flex space-x-2">
        <button id="qrCopyBtn" class="flex-1 bg-brand-500 hover:bg-brand-600 text-gray-950 font-bold py-2.5 px-4 rounded-xl text-xs transition">
          Copy Link
        </button>
        <button onclick="closeQrModal()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- Navigation Bar -->
  <header class="border-b border-gray-800/80 sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-500 flex items-center justify-center font-mono font-extrabold text-gray-950 text-xl shadow-lg shadow-brand-500/20">
          GR
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-xl font-bold tracking-tight text-white font-mono">GRPROXY</h1>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/30">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5 pulse-dot"></span>
              EDGE ONLINE
            </span>
          </div>
          <p class="text-xs text-gray-400">Cloudflare Anti-Censorship & Telegram Relay Engine</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2 sm:space-x-3">
        <button onclick="switchTab('guide')" class="bg-gray-800/80 hover:bg-gray-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-1.5 shadow">
          <span>📖 Connection Guide</span>
        </button>
        <button onclick="triggerScrape()" id="scrapeBtn" class="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-semibold py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-2 shadow">
          <span id="scrapeSpinner" class="hidden animate-spin">🔄</span>
          <span>⚡ Scrape & Prune</span>
        </button>
        <button onclick="copySubscription()" class="bg-brand-500 hover:bg-brand-400 text-gray-950 font-bold text-xs py-2 px-3 sm:px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-brand-500/20">
          <span>📱 App Sub Link</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- Metrics Overview -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="glass-card p-5 rounded-2xl border border-gray-800">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Active Telegram Proxies</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-baseline space-x-2">
          <span id="activeCount">${stats.totalAlive}</span>
          <span class="text-xs font-normal text-brand-400">100+ Live</span>
        </div>
        <div class="mt-2 text-xs text-gray-500">Auto-tested via raw TCP sockets</div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-gray-800">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Dead Proxies Pruned</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
          ${stats.deadPruned}
        </div>
        <div class="mt-2 text-xs text-gray-500">Cleaned from memory pool</div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-gray-800">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Average Response Ping</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
          ${stats.avgLatency} <span class="text-sm font-sans text-gray-400 font-normal">ms</span>
        </div>
        <div class="mt-2 text-xs text-gray-500">Low-latency priority routes</div>
      </div>

      <div class="glass-card p-5 rounded-2xl border border-gray-800">
        <div class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Available Countries</div>
        <div class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
          ${countryList.length} <span class="text-sm font-sans text-gray-400 font-normal">Regions</span>
        </div>
        <div class="mt-2 text-xs text-gray-500 truncate">🇦🇪 🇩🇪 🇸🇬 🇬🇧 🇺🇸 🇳🇱 🇫🇮</div>
      </div>
    </div>

    <!-- Quick Instruction Banner -->
    <div class="bg-gradient-to-r from-brand-950/40 via-gray-900 to-cyan-950/40 border border-brand-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="text-lg">💡</span>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider">Fastest Way to Connect in Pakistan (Zero Phone Slowdown):</h2>
        </div>
        <p class="text-xs text-gray-400 leading-relaxed max-w-3xl">
          Tap any <strong class="text-brand-300">"1-Tap Add to TG"</strong> button below. Telegram will open and ask to save. Add 2–3 proxies, then in Telegram go to <strong class="text-brand-300">Settings &gt; Data and Storage &gt; Proxy Settings &gt; Auto-switch proxy</strong>.
        </p>
      </div>
      <div class="flex items-center space-x-2 shrink-0">
        <button onclick="switchTab('guide')" class="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-2.5 px-3 rounded-xl transition">
          📖 Full Step-by-Step Guide
        </button>
        <button onclick="addTopBundle()" class="bg-brand-500 hover:bg-brand-400 text-gray-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow-md">
          <span>⚡ Add Fastest Bundle</span>
        </button>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="flex border-b border-gray-800 space-x-4 sm:space-x-8 overflow-x-auto pb-1">
      <button onclick="switchTab('telegram')" id="tabBtnTg" class="pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0">
        <span>✈️ Telegram Proxies (100+ MTProto &amp; SOCKS5)</span>
        <span class="bg-brand-500/10 text-brand-400 text-xs px-2 py-0.5 rounded-full border border-brand-500/20">${activePool.length}</span>
      </button>
      <button onclick="switchTab('edge')" id="tabBtnEdge" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition flex items-center space-x-2 shrink-0">
        <span>⚡ High-Speed Country Nodes (For GRPROXY App)</span>
        <span class="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-500/20">${edgeNodes.length}</span>
      </button>
      <button onclick="switchTab('guide')" id="tabBtnGuide" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition flex items-center space-x-2 shrink-0">
        <span>📖 Setup &amp; Connection Guide</span>
      </button>
    </div>

    <!-- TAB 1: TELEGRAM PROXIES -->
    <div id="tabTelegram" class="space-y-4">

      <!-- Filter & Search Controls (With Country Filter) -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <!-- Protocol Pills -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <button onclick="filterProtocol('all')" class="proto-filter bg-brand-500 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs transition" data-proto="all">All Protocols</button>
          <button onclick="filterProtocol('mtproto')" class="proto-filter bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition" data-proto="mtproto">MTProto (Fake-TLS)</button>
          <button onclick="filterProtocol('socks5')" class="proto-filter bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition" data-proto="socks5">SOCKS5</button>
        </div>

        <!-- Filter Dropdowns & Search -->
        <div class="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <!-- Countries Filter Dropdown -->
          <select id="countryFilter" onchange="applyFilters()" class="bg-gray-900 border border-gray-800 text-xs rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-brand-500">
            <option value="all">🌍 All Countries (${activePool.length})</option>
            ${countryList.map(([country, info]) => `
              <option value="${country}">${info.flag} ${country} (${info.count})</option>
            `).join('')}
          </select>

          <!-- Ping Filter -->
          <select id="pingFilter" onchange="applyFilters()" class="bg-gray-900 border border-gray-800 text-xs rounded-xl px-3 py-2 text-gray-300 focus:outline-none focus:border-brand-500">
            <option value="all">⚡ All Latencies</option>
            <option value="100">&lt; 100ms (Ultra Fast)</option>
            <option value="200">&lt; 200ms (Fast)</option>
            <option value="400">&lt; 400ms (Normal)</option>
          </select>

          <!-- Search Bar -->
          <input type="text" id="searchInput" oninput="applyFilters()" placeholder="Search IP, Port, Country..." class="col-span-2 sm:col-span-1 bg-gray-900 border border-gray-800 text-xs rounded-xl px-4 py-2 sm:w-56 focus:outline-none focus:border-brand-500 text-gray-200 placeholder-gray-500">
        </div>
      </div>

      <!-- Active Filter Status -->
      <div id="filterStatus" class="text-xs text-gray-400 flex items-center justify-between">
        <span>Showing <strong id="visibleCount" class="text-white">${activePool.length}</strong> active verified proxies</span>
        <button onclick="resetFilters()" class="text-xs text-brand-400 hover:underline">Reset Filters</button>
      </div>

      <!-- Proxy Grid -->
      <div id="proxyContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Injected via JavaScript -->
      </div>
    </div>

    <!-- TAB 2: HIGH-SPEED COUNTRY NODES -->
    <div id="tabEdge" class="space-y-6 hidden">
      <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-2">
        <h3 class="text-base font-bold text-white">⚡ Cloudflare Global Anycast Edge Nodes</h3>
        <p class="text-xs text-gray-400 leading-relaxed">
          These nodes connect directly into Cloudflare's ultra-high-speed CDN edge with TLS 1.3 encryption. Use these in your upcoming <strong>GRPROXY Android App</strong> or in Sing-Box / NekoBox with Per-App Split Tunneling for unlimited 4K video streaming and voice calls.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${edgeNodes.map((node) => `
          <div class="glass-card p-5 rounded-2xl border border-gray-800 hover:border-cyan-500/40 transition duration-300 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-2xl">${node.flag}</span>
                <div>
                  <h4 class="text-sm font-bold text-white">${node.name}</h4>
                  <span class="text-xs text-gray-400 font-mono">${node.city}, ${node.countryCode}</span>
                </div>
              </div>
              <span class="px-2 py-1 rounded-md text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ~${node.pingEstimate} ms
              </span>
            </div>

            <div class="bg-gray-950/80 p-3 rounded-xl border border-gray-800 font-mono text-xs space-y-1">
              <div class="text-gray-400 flex justify-between">
                <span>Clean IP:</span>
                <span class="text-gray-200">${node.cleanIp}</span>
              </div>
              <div class="text-gray-400 flex justify-between">
                <span>Port / TLS:</span>
                <span class="text-brand-400">443 / TLS 1.3</span>
              </div>
              <div class="text-gray-400 flex justify-between">
                <span>Routing:</span>
                <span class="text-cyan-400">VLESS-WebSocket</span>
              </div>
            </div>

            <div class="flex space-x-2 pt-1">
              <button onclick="copyToClipboard('${node.vlessLink}', 'VLESS URL copied!')" class="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition border border-gray-700">
                📋 Copy Link
              </button>
              <button onclick="showQrModal('${node.vlessLink}', '${node.name}')" class="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold py-2 px-3 rounded-xl text-xs transition">
                📱 QR Code
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- TAB 3: STEP-BY-STEP CONNECTION GUIDE -->
    <div id="tabGuide" class="space-y-6 hidden">
      <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-2">
        <h3 class="text-lg font-bold text-white flex items-center space-x-2">
          <span>📖 Complete Connection Guide</span>
          <span class="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs px-2.5 py-0.5 rounded-full font-mono">Mobile &amp; PC</span>
        </h3>
        <p class="text-xs text-gray-400 leading-relaxed">
          Learn how to connect to GRPROXY on Mobile, Desktop, and via Per-App Split Tunneling without slowing down other apps on your device.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

        <!-- GUIDE 1: TELEGRAM MOBILE -->
        <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">📱</span>
            <div>
              <h4 class="text-base font-bold text-white">Telegram on Mobile (Android &amp; iPhone)</h4>
              <p class="text-xs text-brand-400">Recommended • No Extra Apps Needed • Zero Phone Slowdown</p>
            </div>
          </div>
          <ol class="space-y-3 text-xs text-gray-300 list-decimal list-inside leading-relaxed border-t border-gray-800 pt-3">
            <li>Open this GRPROXY website on your phone browser.</li>
            <li>In the <strong>Telegram Proxies</strong> tab, pick 2 or 3 proxies with low ping (e.g. 🇦🇪 UAE or 🇩🇪 Germany).</li>
            <li>Tap the green <strong class="text-brand-400">"✈️ 1-Tap Add to TG"</strong> button.</li>
            <li>Your Telegram app will open immediately. Tap <strong class="text-white">"Enable Proxy"</strong> in the bottom popup.</li>
            <li>Inside Telegram, go to <strong class="text-white">Settings &gt; Data and Storage &gt; Proxy Settings</strong>.</li>
            <li>Turn on <strong class="text-brand-400">"Auto-switch proxy"</strong> toggle.</li>
            <li class="text-emerald-400"><strong>Done!</strong> Telegram will automatically rotate between your active proxies. Your JazzCash, Easypaisa, banking apps, and YouTube run at full native 4G/5G speeds!</li>
          </ol>
        </div>

        <!-- GUIDE 2: TELEGRAM DESKTOP -->
        <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">💻</span>
            <div>
              <h4 class="text-base font-bold text-white">Telegram Desktop (Windows &amp; Mac)</h4>
              <p class="text-xs text-cyan-400">1-Click Import or Manual Connection</p>
            </div>
          </div>
          <div class="space-y-3 text-xs text-gray-300 leading-relaxed border-t border-gray-800 pt-3">
            <p><strong class="text-white">Method A (1-Click):</strong> Click any <strong class="text-brand-400">"1-Tap Add to TG"</strong> button on this screen. Your browser will ask <em>"Open Telegram Desktop?"</em> — click <strong>Open</strong>, then click <strong>Enable Proxy</strong>.</p>
            <p><strong class="text-white">Method B (Manual Entry in Telegram Desktop):</strong></p>
            <ol class="space-y-1.5 list-decimal list-inside pl-1 text-gray-400">
              <li>Open Telegram Desktop &gt; <strong>Settings</strong> &gt; <strong>Advanced</strong>.</li>
              <li>Under <em>Data and storage</em>, click <strong>Connection type</strong> (default is TCP).</li>
              <li>Select <strong>Use custom proxy</strong> &gt; click <strong>Add proxy</strong>.</li>
              <li>Choose <strong>MTPROTO</strong> (or SOCKS5).</li>
              <li>Copy the <strong>IP</strong>, <strong>Port</strong>, and <strong>Secret</strong> from any card on this page into the fields.</li>
              <li>Click <strong>Save</strong>. Telegram will show a blue checkmark 🟢 <em>Connected</em>.</li>
            </ol>
          </div>
        </div>

        <!-- GUIDE 3: PER-APP SPLIT TUNNELING -->
        <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">⚡</span>
            <div>
              <h4 class="text-base font-bold text-white">High-Speed Split Tunneling (Android)</h4>
              <p class="text-xs text-amber-400">Full 4K Speed for Telegram Calls/Videos • Zero Slowdown</p>
            </div>
          </div>
          <ol class="space-y-2.5 text-xs text-gray-300 list-decimal list-inside leading-relaxed border-t border-gray-800 pt-3">
            <li>Tap the <strong class="text-brand-400">"📱 App Sub Link"</strong> button at the top of this page to copy:
              <div class="bg-gray-950 p-2 rounded-lg font-mono text-[11px] text-brand-300 break-all my-1.5 select-all">
                ${workerHost ? `https://${workerHost}/sub` : 'https://grproxy.grwebdevs5.workers.dev/sub'}
              </div>
            </li>
            <li>In your Android client (NekoBox, Sing-Box, or upcoming GRPROXY App), tap <strong>Add Profile / Subscription</strong> and paste this link.</li>
            <li>Go to App Settings &gt; <strong>Routing / Split Tunneling</strong>.</li>
            <li>Turn on <strong>Per-App Proxy</strong> and check <strong class="text-white">Telegram</strong> (and any game). Leave all other apps unchecked.</li>
            <li>Connect to the 🇦🇪 <strong>UAE (Dubai)</strong> or 🇩🇪 <strong>Germany</strong> node.</li>
            <li class="text-emerald-400"><strong>Result:</strong> Only Telegram is accelerated through Cloudflare’s CDN. All other apps bypass the tunnel at full native 4G speed!</li>
          </ol>
        </div>

        <!-- GUIDE 4: PC BROWSER ONLY PROXY -->
        <div class="glass-card p-6 rounded-2xl border border-gray-800 space-y-4">
          <div class="flex items-center space-x-3">
            <span class="text-3xl">🌐</span>
            <div>
              <h4 class="text-base font-bold text-white">Browser Proxy (Firefox / Chrome on PC)</h4>
              <p class="text-xs text-purple-400">Proxy only your web browser without affecting games or PC</p>
            </div>
          </div>
          <div class="space-y-2.5 text-xs text-gray-300 leading-relaxed border-t border-gray-800 pt-3">
            <p><strong class="text-white">Firefox (Native SOCKS5):</strong></p>
            <ol class="space-y-1 list-decimal list-inside pl-1 text-gray-400">
              <li>Open Firefox &gt; <strong>Settings</strong> &gt; search <strong>Network Settings</strong> &gt; click <strong>Settings</strong>.</li>
              <li>Select <strong>Manual proxy configuration</strong>.</li>
              <li>Enter any SOCKS5 proxy IP and Port into <strong>SOCKS Host</strong>.</li>
              <li>Check <strong>SOCKS v5</strong> and check <strong>Proxy DNS when using SOCKS v5</strong>. Click OK.</li>
            </ol>
            <p class="pt-2"><strong class="text-white">Chrome / Edge:</strong> Install the free extension <em>Proxy SwitchyOmega</em> to switch any tab to SOCKS5 with one click.</p>
          </div>
        </div>

      </div>
    </div>

  </main>

  <!-- Client-side State & Logic -->
  <script>
    const POOL_DATA = ${serializedPool};
    const EDGE_DATA = ${serializedNodes};
    let currentProto = 'all';
    let qrInstance = null;

    function renderProxies(list) {
      const container = document.getElementById('proxyContainer');
      const countEl = document.getElementById('visibleCount');
      if (countEl) countEl.innerText = list.length;

      if (list.length === 0) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-gray-500 text-sm">No proxies match the selected filters. Try choosing "All Countries" or resetting filters.</div>';
        return;
      }

      container.innerHTML = list.map(p => {
        const pingClass = p.latency < 100 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : (p.latency < 250 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20');

        const protoBadge = p.protocol === 'mtproto'
          ? '<span class="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold">MTProto</span>'
          : '<span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">SOCKS5</span>';

        return \`
          <div class="glass-card p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition duration-200 flex flex-col justify-between space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-2.5">
                <span class="text-2xl">\${p.flag || '🌐'}</span>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <span class="font-bold text-white text-xs font-mono">\${p.ip}:\${p.port}</span>
                  </div>
                  <div class="text-[11px] text-gray-400">\${p.country || 'Global'}</div>
                </div>
              </div>
              <div class="flex items-center space-x-1.5">
                \${protoBadge}
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border \${pingClass}">\${p.latency}ms</span>
              </div>
            </div>

            <div class="bg-gray-950/70 p-2.5 rounded-xl border border-gray-800/80 text-[11px] font-mono text-gray-400 truncate">
              \${p.secret ? \`<span class="text-gray-500">Secret:</span> <span class="text-gray-300">\${p.secret}</span>\` : (p.username ? \`<span class="text-gray-500">Auth:</span> \${p.username}:***\` : '<span class="text-gray-500">No auth required</span>')}
            </div>

            <div class="flex items-center space-x-2 pt-1">
              <a href="\${p.tgLink}" class="flex-1 bg-brand-500 hover:bg-brand-400 text-gray-950 font-bold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center space-x-1 shadow-sm">
                <span>✈️ 1-Tap Add to TG</span>
              </a>
              <button onclick="showQrModal('\${p.tgLink}', '\${p.country} Proxy')" class="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl text-xs border border-gray-700 transition" title="Show QR Code">
                📱
              </button>
              <button onclick="copyToClipboard('\${p.tgLink}', 'Telegram link copied!')" class="bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-xl text-xs border border-gray-700 transition" title="Copy Raw Link">
                📋
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

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
          if (!matchIp && !matchPort && !matchCountry) return false;
        }
        return true;
      });

      renderProxies(filtered);
    }

    function filterProtocol(proto) {
      currentProto = proto;
      document.querySelectorAll('.proto-filter').forEach(btn => {
        if (btn.dataset.proto === proto) {
          btn.className = 'proto-filter bg-brand-500 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs transition';
        } else {
          btn.className = 'proto-filter bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition';
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
          ? 'proto-filter bg-brand-500 text-gray-950 font-bold px-3 py-1.5 rounded-lg text-xs transition'
          : 'proto-filter bg-gray-800 text-gray-300 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition';
      });
      applyFilters();
    }

    function switchTab(tab) {
      const tabTg = document.getElementById('tabTelegram');
      const tabEdge = document.getElementById('tabEdge');
      const tabGuide = document.getElementById('tabGuide');
      const btnTg = document.getElementById('tabBtnTg');
      const btnEdge = document.getElementById('tabBtnEdge');
      const btnGuide = document.getElementById('tabBtnGuide');

      // Hide all
      tabTg.classList.add('hidden');
      tabEdge.classList.add('hidden');
      tabGuide.classList.add('hidden');

      // Reset button styles
      btnTg.className = 'pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition flex items-center space-x-2 shrink-0';
      btnEdge.className = 'pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition flex items-center space-x-2 shrink-0';
      btnGuide.className = 'pb-3 text-sm font-semibold border-b-2 border-transparent text-gray-400 hover:text-gray-200 transition flex items-center space-x-2 shrink-0';

      if (tab === 'telegram') {
        tabTg.classList.remove('hidden');
        btnTg.className = 'pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'edge') {
        tabEdge.classList.remove('hidden');
        btnEdge.className = 'pb-3 text-sm font-bold border-b-2 border-cyan-500 text-cyan-400 transition flex items-center space-x-2 shrink-0';
      } else if (tab === 'guide') {
        tabGuide.classList.remove('hidden');
        btnGuide.className = 'pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0';
      }
    }

    function showQrModal(text, title) {
      document.getElementById('qrTitle').innerText = title || 'Scan with Camera';
      document.getElementById('qrModal').classList.remove('hidden');
      const qrContainer = document.getElementById('qrcode');
      qrContainer.innerHTML = '';
      qrInstance = new QRCode(qrContainer, {
        text: text,
        width: 190,
        height: 190,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      document.getElementById('qrCopyBtn').onclick = () => copyToClipboard(text, 'Link copied!');
    }

    function closeQrModal() {
      document.getElementById('qrModal').classList.add('hidden');
    }

    function addTopBundle() {
      const top3 = POOL_DATA.slice(0, 3);
      if (top3.length > 0) {
        window.open(top3[0].tgLink, '_blank');
        showToast('Opened 1st Proxy in Telegram! Tap again for others.');
      }
    }

    function copySubscription() {
      const subUrl = window.location.origin + '/sub';
      copyToClipboard(subUrl, 'Android App Subscription link copied to clipboard!');
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
      showToast('Initiating proxy scraping and TCP socket tests...');

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

    // Initialize
    renderProxies(POOL_DATA);
  </script>
</body>
</html>`;
}
