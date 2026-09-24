import { ProxyItem, EdgeNode, PoolStats, FailoverState } from './types';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderSingleProxyCardHtml(p: ProxyItem): string {
  const pingClass =
    p.latency < 80
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : p.latency < 160
      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

  const protoBadge =
    p.protocol === 'mtproto'
      ? '<span class="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono">MTProto</span>'
      : '<span class="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono">SOCKS5</span>';

  const secretOrAuth =
    p.protocol === 'mtproto'
      ? `<div class="mt-2 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span class="font-semibold text-slate-300">SECRET KEY:</span>
            <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] font-bold hover:underline" data-copy="${escapeHtml(p.secret || '')}">📋 Copy Secret</button>
          </div>
          <div class="font-mono text-[11px] text-emerald-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 break-all select-all font-bold">
            ${escapeHtml(p.secret || 'none')}
          </div>
        </div>`
      : `<div class="mt-2 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span class="font-semibold text-slate-300">AUTHENTICATION:</span>
            <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] font-bold hover:underline" data-copy="${escapeHtml((p.username || '') + ':' + (p.password || ''))}">📋 Copy Auth</button>
          </div>
          <div class="font-mono text-[11px] text-cyan-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 select-all">
            ${p.username ? `User: <b>${escapeHtml(p.username)}</b> | Pass: <b>${escapeHtml(p.password || '')}</b>` : 'No Auth Required (Open Direct SOCKS5)'}
          </div>
        </div>`;

  return `
    <div class="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition duration-200 flex flex-col justify-between space-y-3.5 bg-slate-900/70 shadow-lg" data-card-id="${escapeHtml(p.id)}">
      <!-- Header Row -->
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-3xl">${p.flag || '🌐'}</span>
          <div>
            <h4 class="font-bold text-white text-sm font-mono tracking-tight">${escapeHtml(p.country || 'Global Edge')}</h4>
            <div class="text-xs text-slate-400 font-mono mt-0.5">${escapeHtml(p.ip)}:${p.port}</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          ${protoBadge}
          <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border ${pingClass}">${p.latency}ms</span>
        </div>
      </div>

      <!-- Prominent Credentials Box -->
      <div class="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
        <div class="flex justify-between items-center text-slate-400">
          <span>Server / Host:</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-white select-all font-bold">${escapeHtml(p.ip)}</span>
            <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] px-1 font-bold hover:underline" data-copy="${escapeHtml(p.ip)}">copy</button>
          </div>
        </div>

        <div class="flex justify-between items-center text-slate-400">
          <span>Port:</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-brand-400 select-all font-bold">${p.port}</span>
            <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] px-1 font-bold hover:underline" data-copy="${p.port}">copy</button>
          </div>
        </div>

        ${secretOrAuth}
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2 pt-1">
        <a href="${escapeHtml(p.tgLink)}" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs text-center transition flex items-center justify-center space-x-1.5 shadow-md shadow-brand-500/20">
          <span>✈️ 1-Tap Connect</span>
        </a>
        <button class="open-modal-btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" data-id="${escapeHtml(p.id)}" title="Inspect Full Connection Parameters">
          ⚙️
        </button>
        <button class="qr-btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" data-qr="${escapeHtml(p.tgLink)}" data-title="${escapeHtml(p.country)} Proxy" title="Show QR Code">
          📱
        </button>
        <button class="copy-btn bg-slate-800 hover:bg-slate-700 text-brand-400 p-2.5 rounded-xl text-xs border border-slate-700 transition font-bold" data-copy="Server: ${escapeHtml(p.ip)}\nPort: ${p.port}\nProtocol: ${p.protocol}\nSecret: ${escapeHtml(p.secret || '')}\nLink: ${escapeHtml(p.tgLink)}" title="Copy All Connection Details">
          📋
        </button>
      </div>
    </div>
  `;
}

export function renderSingleEdgeCardHtml(node: EdgeNode): string {
  return `
    <div class="glass-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition duration-300 space-y-3.5 bg-slate-900/70 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-3xl">${node.flag}</span>
          <div>
            <h4 class="text-xs font-bold text-white font-mono">${escapeHtml(node.name)}</h4>
            <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(node.city)} • ${escapeHtml(node.continent)}</span>
          </div>
        </div>
        <span class="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          ~${node.pingEstimate} ms
        </span>
      </div>

      <div class="bg-slate-950/90 p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5">
        <div class="text-slate-400 flex justify-between items-center">
          <span>Clean Anycast IP:</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-200 font-bold">${escapeHtml(node.cleanIp)}</span>
            <button class="copy-btn text-cyan-400 text-[10px] hover:underline" data-copy="${escapeHtml(node.cleanIp)}">copy</button>
          </div>
        </div>
        <div class="text-slate-400 flex justify-between">
          <span>Port / Encryption:</span>
          <span class="text-brand-400">443 / TLS 1.3 Anycast</span>
        </div>
        <div class="text-slate-400 flex justify-between">
          <span>Relay Protocol:</span>
          <span class="text-cyan-400 font-bold">VLESS-WebSocket</span>
        </div>
      </div>

      <div class="flex space-x-2 pt-1">
        <button class="copy-btn flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition border border-slate-700 flex items-center justify-center space-x-1" data-copy="${escapeHtml(node.vlessLink)}">
          <span>📋 Copy Node URL</span>
        </button>
        <button class="qr-btn bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold py-2 px-3 rounded-xl text-xs transition" data-qr="${escapeHtml(node.vlessLink)}" data-title="${escapeHtml(node.name)}">
          📱 QR
        </button>
      </div>
    </div>
  `;
}

export function renderDashboardHtml(
  activePool: ProxyItem[],
  edgeNodes: EdgeNode[],
  stats: PoolStats,
  workerHost: string,
  pinnedProxy: FailoverState
): string {
  const safePoolJson = JSON.stringify(activePool);
  const safeEdgeJson = JSON.stringify(edgeNodes);

  // Initial SSR rendered cards
  const initialProxyCards = activePool.slice(0, 60).map(renderSingleProxyCardHtml).join('');
  const initialEdgeCards = edgeNodes.slice(0, 30).map(renderSingleEdgeCardHtml).join('');

  // Group countries for dropdown
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
  <title>GRPROXY — High-Speed Anti-Censorship Edge Network & Telegram Proxy Ecosystem</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              300: '#6ee7b7',
              400: '#34d399',
              500: '#10b981',
              600: '#059669',
            },
            cyan: {
              400: '#22d3ee',
              500: '#06b6d4',
            }
          }
        }
      }
    };
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #080c14; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }
    .pulse-dot {
      animation: pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.9); }
    }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col antialiased selection:bg-brand-500 selection:text-black">

  <!-- Top Navigation Bar -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 p-[1px] shadow-lg shadow-brand-500/20">
          <div class="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
            <span class="text-brand-400 font-bold text-sm tracking-wider font-mono">GR</span>
          </div>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-base font-extrabold text-white tracking-wide">GRPROXY</h1>
            <span class="bg-brand-500/10 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded border border-brand-500/20 font-mono">v1.1.0</span>
          </div>
          <p class="text-[11px] text-slate-400">Zero-Slowdown Anti-Censorship Proxy Network</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <a href="#tabExtension" onclick="switchTab('extension')" class="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition">
          <span>🧩 Chrome Extension</span>
        </a>
        <a href="#tabApk" onclick="switchTab('apk')" class="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition">
          <span>📱 Android APK</span>
        </a>
        <button id="scrapeBtn" onclick="triggerScrape()" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-1.5 px-3 rounded-xl transition flex items-center space-x-1.5">
          <span id="scrapeSpinner" class="hidden animate-spin">⚡</span>
          <span>🔄 Scrape Fresh Proxies</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- Hero / Live Telemetry Banner -->
    <div class="glass-card p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center space-x-2 bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full text-xs font-bold text-brand-400 font-mono">
            <span class="w-2 h-2 rounded-full bg-brand-400 pulse-dot"></span>
            <span>Cloudflare Anycast Verified • 100+ Countries</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight">
            High-Speed Anti-Censorship Proxy Network
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Unblock Telegram, Discord, and browsing in restricted regions without whole-device slowdowns. Verified MTProto, high-speed SOCKS5, and Cloudflare Anycast edge endpoints with complete credentials.
          </p>
        </div>

        <!-- Telemetry Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 text-center">
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Active Proxies</span>
            <span class="text-lg font-bold text-brand-400 font-mono">${stats.totalAlive || activePool.length}</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 text-center">
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Avg Latency</span>
            <span class="text-lg font-bold text-cyan-400 font-mono">${stats.avgLatency || 140}ms</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 text-center">
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Edge Countries</span>
            <span class="text-lg font-bold text-purple-400 font-mono">${edgeNodes.length}</span>
          </div>
          <div class="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90 text-center">
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Dead Pruned</span>
            <span class="text-lg font-bold text-amber-400 font-mono">${stats.deadPruned || 165}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center space-x-2 border-b border-slate-800 overflow-x-auto pb-1" id="tabNav">
      <button onclick="switchTab('telegram')" id="tabBtnTg" class="pb-3 text-sm font-bold border-b-2 border-brand-500 text-brand-400 transition flex items-center space-x-2 shrink-0">
        <span>✈️ Telegram Proxies (${activePool.length})</span>
      </button>
      <button onclick="switchTab('edge')" id="tabBtnEdge" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>🌍 100+ Cloudflare Edge Locations (${edgeNodes.length})</span>
      </button>
      <button onclick="switchTab('extension')" id="tabBtnExt" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>🧩 Chrome Extension</span>
      </button>
      <button onclick="switchTab('apk')" id="tabBtnApk" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>📱 Android APK</span>
      </button>
      <button onclick="switchTab('failover')" id="tabBtnFailover" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>🔄 Auto-Failover Route</span>
      </button>
      <button onclick="switchTab('guide')" id="tabBtnGuide" class="pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0">
        <span>📖 Setup Guides</span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- TAB 1: TELEGRAM PROXIES                    -->
    <!-- ========================================== -->
    <div id="tabTelegram" class="space-y-6">

      <!-- Featured Auto-Pinned Route Banner -->
      <div class="glass-card p-5 rounded-2xl border border-brand-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div class="flex items-center space-x-3.5">
          <span class="text-4xl">${pinnedProxy.flag}</span>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-bold text-brand-400 font-mono uppercase tracking-wider">Auto-Pinned Healthy Route</span>
              <span class="w-2 h-2 rounded-full bg-brand-400 pulse-dot"></span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono font-bold uppercase">${pinnedProxy.protocol}</span>
            </div>
            <div class="text-sm font-bold text-white font-mono mt-0.5 flex items-center space-x-2">
              <span>${pinnedProxy.country}</span>
              <span class="text-slate-400 font-normal">&bull;</span>
              <span class="text-brand-300 font-bold select-all">${pinnedProxy.ip}:${pinnedProxy.port}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-mono truncate max-w-xl mt-0.5">
              ${pinnedProxy.protocol === 'mtproto' ? `Secret: <span class="text-slate-300 select-all font-bold">${escapeHtml(pinnedProxy.secret || 'default')}</span>` : `Auth: <span class="text-slate-300 select-all">Open Direct SOCKS5</span>`}
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
          ${pinnedProxy.protocol === 'mtproto' ? `
            <button class="copy-btn flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-brand-400 border border-brand-500/30 font-mono font-bold text-xs py-2.5 px-3.5 rounded-xl transition" data-copy="${escapeHtml(pinnedProxy.secret || '')}">
              📋 Copy Secret
            </button>
          ` : `
            <button class="copy-btn flex-1 sm:flex-initial bg-slate-800 hover:bg-slate-700 text-brand-400 border border-brand-500/30 font-mono font-bold text-xs py-2.5 px-3.5 rounded-xl transition" data-copy="${escapeHtml(pinnedProxy.ip)}:${pinnedProxy.port}">
              📋 Copy Address
            </button>
          `}
          <a href="${escapeHtml(pinnedProxy.tgLink)}" class="flex-1 sm:flex-initial bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition text-center shadow-lg shadow-brand-500/20">
            ✈️ 1-Tap Connect
          </a>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <!-- Protocol Pills -->
        <div class="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0" id="protoFilters">
          <button onclick="filterProtocol('all')" class="proto-filter bg-brand-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition" data-proto="all">All (${activePool.length})</button>
          <button onclick="filterProtocol('mtproto')" class="proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition" data-proto="mtproto">MTProto</button>
          <button onclick="filterProtocol('socks5')" class="proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition" data-proto="socks5">SOCKS5</button>
        </div>

        <div class="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <!-- Country Filter Dropdown -->
          <select id="countryFilter" onchange="applyFilters()" class="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
            <option value="all">🌐 All Countries (${countryList.length})</option>
            ${countryList.map(([c, data]) => `<option value="${escapeHtml(c)}">${data.flag} ${escapeHtml(c)} (${data.count})</option>`).join('')}
          </select>

          <!-- Ping Filter -->
          <select id="pingFilter" onchange="applyFilters()" class="bg-slate-900 border border-slate-800 text-xs rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
            <option value="all">⚡ Any Latency</option>
            <option value="100">&lt; 100 ms (Fastest)</option>
            <option value="250">&lt; 250 ms (Good)</option>
            <option value="500">&lt; 500 ms (Usable)</option>
          </select>

          <!-- Search Bar -->
          <input type="text" id="searchInput" oninput="applyFilters()" placeholder="Search IP, Port, Secret, Country..." class="col-span-2 sm:col-span-1 bg-slate-900 border border-slate-800 text-xs rounded-xl px-4 py-2 sm:w-60 focus:outline-none focus:border-brand-500 text-slate-200 placeholder-slate-500">
        </div>
      </div>

      <!-- Active Filter Status -->
      <div id="filterStatus" class="text-xs text-slate-400 flex items-center justify-between">
        <span>Showing <strong id="visibleCount" class="text-white font-mono">${activePool.length}</strong> verified proxies with prominent credentials</span>
        <button onclick="resetFilters()" class="text-xs text-brand-400 hover:underline">Reset Filters</button>
      </div>

      <!-- Proxies Grid -->
      <div id="proxyContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${initialProxyCards}
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 2: 100+ CLOUDFLARE EDGE LOCATIONS      -->
    <!-- ========================================== -->
    <div id="tabEdge" class="space-y-6 hidden">
      <div class="glass-card p-6 rounded-3xl border border-slate-800 space-y-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-white flex items-center space-x-2">
              <span>🌍 Cloudflare Global Anycast Edge Network</span>
              <span class="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-mono">${edgeNodes.length} Locations</span>
            </h3>
            <p class="text-xs text-slate-400 leading-relaxed mt-1">
              Direct connection into Cloudflare's Anycast edge across 100+ countries with Clean IPs and TLS 1.3 encryption.
            </p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <button onclick="copySubscription()" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center space-x-1 shadow">
              <span>📱 Copy Sing-Box / V2Ray Sub</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Continent Filter & Search -->
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
        ${initialEdgeCards}
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 3: CHROME EXTENSION SHOWCASE           -->
    <!-- ========================================== -->
    <div id="tabExtension" class="space-y-6 hidden">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2">
              <span class="text-3xl">🧩</span>
              <h3 class="text-xl font-bold text-white font-mono">GRPROXY Chrome Extension (Manifest V3)</h3>
            </div>
            <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Ultra-fast zero-slowdown anti-censorship extension with 100+ Cloudflare edge countries, multi-tier verified SOCKS5 fallback, and persistent auto-reconnect on PC reboot.
            </p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <a href="https://github.com/grwebdevs/grproxy/tree/main/extension" target="_blank" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-brand-500/20">
              <span>📥 Extension GitHub Repo</span>
            </a>
          </div>
        </div>

        <!-- 3 Modes Explanation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">⚡</div>
            <h4 class="text-sm font-bold text-white">Mode 1: Added Links (Smart Split)</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Default mode. ONLY accelerates <code class="text-brand-300">web.telegram.org</code> and custom added URLs. YouTube 4K, downloads, and banking remain at 100% native speed!
            </p>
          </div>

          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">🌐</div>
            <h4 class="text-sm font-bold text-white">Mode 2: Whole Chrome Profile</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Routes all browser web traffic in the active Chrome profile through the verified SOCKS5 proxy chain.
            </p>
          </div>

          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">⚪</div>
            <h4 class="text-sm font-bold text-white">Mode 3: Turn Off</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Disables proxy and restores direct system connection immediately.
            </p>
          </div>
        </div>

        <!-- How to Install in 60s -->
        <div class="bg-slate-950/90 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 class="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <span>🛠️ How to Load in Chrome / Edge / Brave:</span>
          </h4>
          <ol class="space-y-3 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              Locate the extension directory on your machine:
              <div class="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan-300 my-1.5 select-all border border-slate-800">
                d:\\GR WEB DEVS\\Cloudflare workers TOOLS BUILDS\\New ideas\\grproxy\\extension
              </div>
            </li>
            <li>In Google Chrome, navigate to <code class="text-white font-mono bg-slate-900 px-2 py-0.5 rounded">chrome://extensions</code> in your address bar.</li>
            <li>Enable the <strong class="text-brand-400">"Developer mode"</strong> switch in the top right corner.</li>
            <li>Click the <strong class="text-cyan-400">"Load unpacked"</strong> button in the top left.</li>
            <li>Select the <code class="text-white font-mono">grproxy/extension</code> directory.</li>
            <li>The <strong>GRPROXY</strong> shield icon appears in your toolbar. Click it, select your desired mode, and click Connect!</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 4: ANDROID APK DOWNLOAD                -->
    <!-- ========================================== -->
    <div id="tabApk" class="space-y-6 hidden">
      <div class="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800/80 pb-6">
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2">
              <span class="text-3xl">📱</span>
              <h3 class="text-xl font-bold text-white font-mono">GRPROXY Android Mobile Client</h3>
            </div>
            <p class="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Native Android application featuring Per-App Split Tunneling, Cloudflare edge node synchronization, and zero-speed-loss bypass for Pakistani banking & media apps.
            </p>
          </div>
          <div class="flex items-center space-x-3 shrink-0">
            <a href="https://github.com/grwebdevs/grproxy/releases" target="_blank" class="bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-brand-500/20">
              <span>📥 Download APK (Releases)</span>
            </a>
            <a href="https://github.com/grwebdevs/grproxy/actions" target="_blank" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2.5 px-3 rounded-xl transition">
              <span>Build Artifacts</span>
            </a>
          </div>
        </div>

        <!-- Android App Highlights -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">⚡</div>
            <h4 class="text-sm font-bold text-white">Per-App Split Tunneling</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Only checked apps (Telegram, Discord) route through GRPROXY. Banking apps (JazzCash, Easypaisa, HBL) and YouTube run at full native 4G/5G speeds without VPN lag.
            </p>
          </div>

          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">🌐</div>
            <h4 class="text-sm font-bold text-white">Live Cloudflare Sync</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Automatically queries <code class="text-cyan-300 font-mono">/api/nodes</code> on launch to grab the freshest 100+ Anycast edge locations and lowest ping routes.
            </p>
          </div>

          <div class="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div class="text-2xl">🛡️</div>
            <h4 class="text-sm font-bold text-white">1-Tap Connection</h4>
            <p class="text-xs text-slate-400 leading-relaxed">
              Large interactive power button activates protection in 200 milliseconds with automatic reconnect on network handovers (Wi-Fi &lt;&gt; Mobile Data).
            </p>
          </div>
        </div>

        <!-- QR Scan to Download on Phone -->
        <div class="bg-slate-950/90 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="space-y-2">
            <h4 class="text-sm font-bold text-white uppercase tracking-wider">Install on Android in 2 Minutes:</h4>
            <ol class="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
              <li>Scan the QR code with your mobile camera or open <a href="https://github.com/grwebdevs/grproxy/releases" target="_blank" class="text-brand-400 underline">GitHub Releases</a> on your phone.</li>
              <li>Tap <code class="text-cyan-300 font-mono">app-debug.apk</code> or <code class="text-cyan-300 font-mono">app-release.apk</code> to download.</li>
              <li>Open the downloaded APK and tap <strong>Install</strong> (allow "Install Unknown Apps" if prompted).</li>
              <li>Open GRPROXY on your phone and tap <strong>Connect</strong>!</li>
            </ol>
          </div>
          <div class="flex flex-col items-center p-3 bg-white rounded-2xl shadow-xl shrink-0">
            <div id="apkQrcode"></div>
            <span class="text-[10px] text-black font-bold font-mono mt-1">Scan to Download APK</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 5: AUTO-FAILOVER ROUTE & PAC           -->
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

        <!-- Universal PAC URL -->
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
            <button class="copy-btn bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-3 px-4 rounded-xl transition shrink-0" data-copy="${workerHost ? `https://${workerHost}/pac` : 'https://grproxy.grwebdevs5.workers.dev/pac'}">
              Copy PAC URL
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- TAB 6: COMPLETE SETUP GUIDES               -->
    <!-- ========================================== -->
    <div id="tabGuide" class="space-y-6 hidden">
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
            <li>In the <strong>Telegram Proxies</strong> tab, pick 2 or 3 proxies with low ping (e.g. 🇩🇪 Germany or 🌐 Global Edge).</li>
            <li>Tap the green <strong class="text-brand-400">"✈️ 1-Tap Connect"</strong> button.</li>
            <li>Your Telegram app opens instantly. Tap <strong class="text-white">"Enable Proxy"</strong> in the bottom dialog.</li>
            <li>In Telegram, navigate to <strong class="text-white">Settings &gt; Data and Storage &gt; Proxy Settings</strong>.</li>
            <li>Toggle ON <strong class="text-brand-400">"Auto-switch proxy"</strong>.</li>
            <li class="text-emerald-400"><strong>Done!</strong> Telegram rotates between your active proxies seamlessly. All your other apps bypass the proxy at 100% native speed!</li>
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
            <p><strong class="text-white">Method A (1-Click):</strong> Click any <strong class="text-brand-400">"✈️ 1-Tap Connect"</strong> button. When browser prompts <em>"Open Telegram Desktop?"</em>, click <strong>Open</strong>, then click <strong>Enable Proxy</strong>.</p>
            <p><strong class="text-white">Method B (Manual Entry with Credentials):</strong></p>
            <ol class="space-y-1.5 list-decimal list-inside pl-1 text-slate-400">
              <li>Open Telegram Desktop &gt; <strong>Settings</strong> &gt; <strong>Advanced</strong>.</li>
              <li>Under <em>Data and storage</em>, click <strong>Connection type</strong>.</li>
              <li>Select <strong>Use custom proxy</strong> &gt; click <strong>Add proxy</strong>.</li>
              <li>Choose <strong>MTPROTO</strong> (or SOCKS5).</li>
              <li>Copy the IP, Port, and Secret from any card on this page and paste into Telegram.</li>
              <li>Click <strong>Save</strong>. Telegram connects immediately!</li>
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
            <li>Select <strong>"Added Links Only (Smart Split)"</strong> mode.</li>
            <li>Choose your preferred country or Anycast Edge node.</li>
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

  <!-- Inspect Credentials Modal -->
  <div id="credModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center space-x-3">
          <span class="text-3xl" id="credFlag">🌐</span>
          <div>
            <h3 class="font-bold text-white text-base font-mono" id="credTitle">Proxy Connection Credentials</h3>
            <span class="text-xs text-slate-400" id="credSubtitle">Detailed parameters for Telegram and custom clients</span>
          </div>
        </div>
        <button onclick="closeCredModal()" class="text-slate-400 hover:text-white text-xl p-1">✕</button>
      </div>

      <div class="space-y-3 font-mono text-xs">
        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span class="text-slate-400">Server / IP:</span>
          <div class="flex items-center space-x-2">
            <span class="text-white font-bold select-all" id="credIp"></span>
            <button class="copy-btn text-brand-400 hover:underline text-xs" id="credCopyIp">Copy</button>
          </div>
        </div>
        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span class="text-slate-400">Port:</span>
          <div class="flex items-center space-x-2">
            <span class="text-brand-400 font-bold select-all" id="credPort"></span>
            <button class="copy-btn text-brand-400 hover:underline text-xs" id="credCopyPort">Copy</button>
          </div>
        </div>
        <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span class="text-slate-400">Protocol:</span>
          <span class="text-cyan-400 font-bold uppercase" id="credProtocol"></span>
        </div>
        <div id="credSecretBlock" class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
          <div class="flex justify-between items-center text-slate-400">
            <span>Secret Key (Obfuscated TLS):</span>
            <button class="copy-btn text-brand-400 hover:underline text-xs" id="credCopySecret">Copy Secret</button>
          </div>
          <div class="text-brand-300 break-all select-all font-bold text-[11px]" id="credSecret"></div>
        </div>
      </div>

      <div class="flex space-x-3 pt-2">
        <a href="#" id="credTgBtn" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs text-center transition">
          ✈️ Open Directly in Telegram
        </a>
        <button onclick="closeCredModal()" class="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition border border-slate-700">
          Close
        </button>
      </div>
    </div>
  </div>

  <!-- QR Code Modal -->
  <div id="qrModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 text-center shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="font-bold text-white text-sm" id="qrTitle">Scan with Camera</h3>
        <button onclick="closeQrModal()" class="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      <div class="flex justify-center p-4 bg-white rounded-2xl mx-auto w-fit shadow-inner">
        <div id="qrcode"></div>
      </div>
      <p class="text-xs text-slate-400">Scan using your phone's camera to import this proxy instantly.</p>
      <button id="qrCopyBtn" class="w-full bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition">
        Copy Link
      </button>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-6 right-6 z-50 transform translate-y-20 opacity-0 transition duration-300 bg-slate-900 border border-brand-500/40 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-semibold">
    <span class="text-brand-400">✓</span>
    <span id="toastMsg">Notification</span>
  </div>

  <!-- Footer -->
  <footer class="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
    <div>GRPROXY &bull; Built with Cloudflare Workers, KV, and Anycast Edge Infrastructure</div>
    <div class="space-x-4">
      <a href="/sub" class="text-brand-400 hover:underline">Universal Sub (/sub)</a>
      <a href="/pac" class="text-brand-400 hover:underline">PAC Script (/pac)</a>
      <a href="/api/proxies" class="text-brand-400 hover:underline">Proxies API (/api/proxies)</a>
      <a href="/api/nodes" class="text-brand-400 hover:underline">100+ Edge Nodes (/api/nodes)</a>
    </div>
  </footer>

  <!-- Client-side State & Logic -->
  <script>
    const POOL_DATA = ${safePoolJson};
    const EDGE_DATA = ${safeEdgeJson};
    let currentProto = 'all';
    let currentContinent = 'all';
    let qrInstance = null;

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
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
          : (p.latency < 160 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30');

        const protoBadge = p.protocol === 'mtproto'
          ? '<span class="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono">MTProto</span>'
          : '<span class="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold uppercase font-mono">SOCKS5</span>';

        const secretOrAuth = p.protocol === 'mtproto'
          ? \`<div class="mt-2 pt-2 border-t border-slate-800/80">
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span class="font-semibold text-slate-300">SECRET KEY:</span>
                <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] font-bold hover:underline" data-copy="\${escapeText(p.secret || '')}">📋 Copy Secret</button>
              </div>
              <div class="font-mono text-[11px] text-emerald-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 break-all select-all font-bold">
                \${escapeText(p.secret || 'none')}
              </div>
            </div>\`
          : \`<div class="mt-2 pt-2 border-t border-slate-800/80">
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span class="font-semibold text-slate-300">AUTHENTICATION:</span>
                <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] font-bold hover:underline" data-copy="\${escapeText((p.username || '') + ':' + (p.password || ''))}">📋 Copy Auth</button>
              </div>
              <div class="font-mono text-[11px] text-cyan-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 select-all">
                \${p.username ? 'User: <b>' + escapeText(p.username) + '</b> | Pass: <b>' + escapeText(p.password || '') + '</b>' : 'No Auth Required (Open Direct SOCKS5)'}
              </div>
            </div>\`;

        return \`
          <div class="glass-card p-5 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition duration-200 flex flex-col justify-between space-y-3.5 bg-slate-900/70 shadow-lg">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <span class="text-3xl">\${p.flag || '🌐'}</span>
                <div>
                  <h4 class="font-bold text-white text-sm font-mono tracking-tight">\${escapeText(p.country || 'Global Edge')}</h4>
                  <div class="text-xs text-slate-400 font-mono mt-0.5">\${escapeText(p.ip)}:\${p.port}</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                \${protoBadge}
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded border \${pingClass}">\${p.latency}ms</span>
              </div>
            </div>

            <div class="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
              <div class="flex justify-between items-center text-slate-400">
                <span>Server / Host:</span>
                <div class="flex items-center space-x-1.5">
                  <span class="text-white select-all font-bold">\${escapeText(p.ip)}</span>
                  <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] px-1 font-bold hover:underline" data-copy="\${escapeText(p.ip)}">copy</button>
                </div>
              </div>

              <div class="flex justify-between items-center text-slate-400">
                <span>Port:</span>
                <div class="flex items-center space-x-1.5">
                  <span class="text-brand-400 select-all font-bold">\${p.port}</span>
                  <button class="copy-btn text-brand-400 hover:text-brand-300 text-[10px] px-1 font-bold hover:underline" data-copy="\${p.port}">copy</button>
                </div>
              </div>

              \${secretOrAuth}
            </div>

            <div class="flex items-center space-x-2 pt-1">
              <a href="\${escapeText(p.tgLink)}" class="flex-1 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs text-center transition flex items-center justify-center space-x-1.5 shadow-md shadow-brand-500/20">
                <span>✈️ 1-Tap Connect</span>
              </a>
              <button class="open-modal-btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" data-id="\${escapeText(p.id)}" title="Inspect Full Parameters">
                ⚙️
              </button>
              <button class="qr-btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl text-xs border border-slate-700 transition" data-qr="\${escapeText(p.tgLink)}" data-title="\${escapeText(p.country)} Proxy" title="Show QR Code">
                📱
              </button>
              <button class="copy-btn bg-slate-800 hover:bg-slate-700 text-brand-400 p-2.5 rounded-xl text-xs border border-slate-700 transition font-bold" data-copy="Server: \${escapeText(p.ip)}\\nPort: \${p.port}\\nProtocol: \${p.protocol}\\nSecret: \${escapeText(p.secret || '')}\\nLink: \${escapeText(p.tgLink)}" title="Copy All Details">
                📋
              </button>
            </div>
          </div>
        \`;
      }).join('');

      bindEventHandlers();
    }

    function escapeText(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function filterProtocol(proto) {
      currentProto = proto;
      document.querySelectorAll('.proto-filter').forEach(btn => {
        if (btn.dataset.proto === proto) {
          btn.className = 'proto-filter bg-brand-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition';
        } else {
          btn.className = 'proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition';
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
          ? 'proto-filter bg-brand-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition'
          : 'proto-filter bg-slate-800 text-slate-300 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl text-xs transition';
      });
      applyFilters();
    }

    // Filter Logic for 100+ Cloudflare Edge Nodes
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

    function renderEdgeNodes(nodes) {
      const container = document.getElementById('edgeContainer');
      if (!container) return;

      if (nodes.length === 0) {
        container.innerHTML = '<div class="col-span-full py-16 text-center text-slate-500 text-sm">No edge nodes match search query.</div>';
        return;
      }

      container.innerHTML = nodes.map(node => \`
        <div class="glass-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition duration-300 space-y-3.5 bg-slate-900/70 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <span class="text-3xl">\${node.flag}</span>
              <div>
                <h4 class="text-xs font-bold text-white font-mono">\${escapeText(node.name)}</h4>
                <span class="text-[11px] text-slate-400 font-mono">\${escapeText(node.city)} • \${escapeText(node.continent)}</span>
              </div>
            </div>
            <span class="px-2 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ~\${node.pingEstimate} ms
            </span>
          </div>

          <div class="bg-slate-950/90 p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5">
            <div class="text-slate-400 flex justify-between items-center">
              <span>Clean Anycast IP:</span>
              <div class="flex items-center space-x-1.5">
                <span class="text-slate-200 font-bold">\${escapeText(node.cleanIp)}</span>
                <button class="copy-btn text-cyan-400 text-[10px] hover:underline" data-copy="\${escapeText(node.cleanIp)}">copy</button>
              </div>
            </div>
            <div class="text-slate-400 flex justify-between">
              <span>Port / Encryption:</span>
              <span class="text-brand-400">443 / TLS 1.3 Anycast</span>
            </div>
            <div class="text-slate-400 flex justify-between">
              <span>Relay Protocol:</span>
              <span class="text-cyan-400 font-bold">VLESS-WebSocket</span>
            </div>
          </div>

          <div class="flex space-x-2 pt-1">
            <button class="copy-btn flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-3 rounded-xl text-xs transition border border-slate-700 flex items-center justify-center space-x-1" data-copy="\${escapeText(node.vlessLink)}">
              <span>📋 Copy Node URL</span>
            </button>
            <button class="qr-btn bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold py-2 px-3 rounded-xl text-xs transition" data-qr="\${escapeText(node.vlessLink)}" data-title="\${escapeText(node.name)}">
              📱 QR
            </button>
          </div>
        </div>
      \`).join('');

      bindEventHandlers();
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
      const tabs = {
        telegram: { el: document.getElementById('tabTelegram'), btn: document.getElementById('tabBtnTg'), active: 'border-brand-500 text-brand-400' },
        edge: { el: document.getElementById('tabEdge'), btn: document.getElementById('tabBtnEdge'), active: 'border-cyan-500 text-cyan-400' },
        extension: { el: document.getElementById('tabExtension'), btn: document.getElementById('tabBtnExt'), active: 'border-emerald-500 text-emerald-400' },
        apk: { el: document.getElementById('tabApk'), btn: document.getElementById('tabBtnApk'), active: 'border-cyan-500 text-cyan-400' },
        failover: { el: document.getElementById('tabFailover'), btn: document.getElementById('tabBtnFailover'), active: 'border-amber-500 text-amber-400' },
        guide: { el: document.getElementById('tabGuide'), btn: document.getElementById('tabBtnGuide'), active: 'border-brand-500 text-brand-400' },
      };

      const inactiveClass = 'pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-2 shrink-0';

      for (const [key, t] of Object.entries(tabs)) {
        if (t.el) t.el.classList.add('hidden');
        if (t.btn) t.btn.className = inactiveClass;
      }

      if (tabs[tab]) {
        if (tabs[tab].el) tabs[tab].el.classList.remove('hidden');
        if (tabs[tab].btn) tabs[tab].btn.className = \`pb-3 text-sm font-bold border-b-2 \${tabs[tab].active} transition flex items-center space-x-2 shrink-0\`;
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
      document.getElementById('qrCopyBtn').onclick = () => copyText(text, 'Link copied!');
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

      document.getElementById('credCopyIp').onclick = () => copyText(p.ip, 'IP copied!');
      document.getElementById('credCopyPort').onclick = () => copyText(p.port.toString(), 'Port copied!');

      const secretBlock = document.getElementById('credSecretBlock');
      if (p.protocol === 'mtproto') {
        secretBlock.classList.remove('hidden');
        document.getElementById('credSecret').innerText = p.secret || 'none';
        document.getElementById('credCopySecret').onclick = () => copyText(p.secret || '', 'Secret copied!');
      } else {
        secretBlock.classList.add('hidden');
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
      copyText(subUrl, 'Sing-Box & V2Ray Universal Subscription copied!');
    }

    function copyText(text, msg) {
      if (!navigator.clipboard) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(msg || 'Copied!');
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        showToast(msg || 'Copied to clipboard! ✓');
      }).catch(() => {
        showToast('Copy failed.');
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
        showToast(\`Scrape complete! Alive: \${data.aliveCount}, Pruned: \${data.prunedCount}\`);
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        showToast('Scrape request failed.');
      } finally {
        spinner.classList.add('hidden');
        btn.disabled = false;
      }
    }

    // Event Delegation for Copy, Modal, and QR Buttons (Never breaks with special chars)
    function bindEventHandlers() {
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const text = btn.getAttribute('data-copy');
          if (text) copyText(text, 'Copied! ✓');
        };
      });

      document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          if (id) openCredModal(id);
        };
      });

      document.querySelectorAll('.qr-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const link = btn.getAttribute('data-qr');
          const title = btn.getAttribute('data-title');
          if (link) showQrModal(link, title);
        };
      });
    }

    // Generate QR code for APK download
    if (document.getElementById('apkQrcode')) {
      new QRCode(document.getElementById('apkQrcode'), {
        text: 'https://github.com/grwebdevs/grproxy/releases',
        width: 140,
        height: 140,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // Initialize event listeners
    bindEventHandlers();
  </script>
</body>
</html>`;
}
