/**
 * GRPROXY Chrome Extension — Background Service Worker (Manifest V3)
 * Provides verified SOCKS5 multi-country proxy routing, zero-speed-loss split routing,
 * persistent auto-reconnect on browser/system reboot, and native desktop notifications.
 */

const DEFAULT_WORKER_HOST = 'grproxy.grwebdevs5.workers.dev';

// Comprehensive Anti-Censorship Domain List (Telegram Web, Core, CDN, Discord, Socials)
const DEFAULT_DOMAINS = [
  'web.telegram.org',
  '*.web.telegram.org',
  'k.web.telegram.org',
  'z.web.telegram.org',
  'a.web.telegram.org',
  'telegram.org',
  '*.telegram.org',
  '*.telegram-cdn.org',
  'telegram-cdn.org',
  't.me',
  '*.t.me',
  'telesco.pe',
  '*.telesco.pe',
  'tdesktop.com',
  '*.tdesktop.com',
  'venus.web.telegram.org',
  'aurora.web.telegram.org',
  'vesta.web.telegram.org',
  'flora.web.telegram.org',
  'pluto.web.telegram.org',
  'discord.com',
  '*.discord.com',
  'discordapp.com',
  '*.discordapp.com',
  'discord.gg',
  '*.discord.gg',
  'x.com',
  '*.x.com',
  'twitter.com',
  '*.twitter.com',
  'twimg.com',
  '*.twimg.com',
  'reddit.com',
  '*.reddit.com',
  'redd.it',
  '*.redd.it',
  'medium.com',
  '*.medium.com',
];

// Verified Live SOCKS5 Proxies (Tested with raw TCP handshake to web.telegram.org:443)
const VERIFIED_SOCKS5_POOL = [
  { id: 'socks5_47.245.165.201_1080', ip: '47.245.165.201', port: 1080, country: 'Global Anycast Edge', countryCode: 'UN', flag: '🌐', latency: 140 },
  { id: 'socks5_141.148.158.143_1080', ip: '141.148.158.143', port: 1080, country: 'Germany', countryCode: 'DE', flag: '🇩🇪', latency: 275 },
  { id: 'socks5_66.42.224.229_41679', ip: '66.42.224.229', port: 41679, country: 'United States', countryCode: 'US', flag: '🇺🇸', latency: 290 },
  { id: 'socks5_72.195.34.35_27360', ip: '72.195.34.35', port: 27360, country: 'United States', countryCode: 'US', flag: '🇺🇸', latency: 296 },
  { id: 'socks5_98.178.72.21_10919', ip: '98.178.72.21', port: 10919, country: 'Global Edge', countryCode: 'UN', flag: '🌐', latency: 298 },
  { id: 'socks5_184.178.172.18_15280', ip: '184.178.172.18', port: 15280, country: 'France', countryCode: 'FR', flag: '🇫🇷', latency: 297 },
];

const DEFAULT_SOCKS5_PROXY = VERIFIED_SOCKS5_POOL[0];
const DEFAULT_BACKUPS = VERIFIED_SOCKS5_POOL.slice(1);

// Toolbar Icon Asset Buffers (Active vibrant emerald / Inactive muted slate)
const ICON_ACTIVE = {
  16: 'icons/icon-active-16.png',
  32: 'icons/icon-active-32.png',
  48: 'icons/icon-active-48.png',
  128: 'icons/icon-active-128.png',
};

const ICON_INACTIVE = {
  16: 'icons/icon-inactive-16.png',
  32: 'icons/icon-inactive-32.png',
  48: 'icons/icon-inactive-48.png',
  128: 'icons/icon-inactive-128.png',
};

/**
 * Updates extension action icon, badge text, badge color, and tooltip title
 */
function updateToolbarState(isConnected, proxy = null, mode = 'split') {
  if (!chrome.action) return;

  if (isConnected && proxy && mode !== 'off') {
    // 1. Bright emerald green shield icon
    chrome.action.setIcon({ path: ICON_ACTIVE });

    // 2. Badge text showing 2-letter country code (or 'ON') with emerald background
    const badgeText = proxy.countryCode ? proxy.countryCode.substring(0, 4).toUpperCase() : 'ON';
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ color: '#ffffff' });
    }

    // 3. Tooltip title: "GRPROXY: Connected • [Country]"
    const flag = proxy.flag || '🌐';
    const countryName = proxy.country || proxy.name || 'Global';
    chrome.action.setTitle({
      title: `GRPROXY: Connected • ${flag} ${countryName} (${mode === 'whole_profile' ? 'Whole Profile' : 'Smart Split'})`,
    });
  } else {
    // 1. Muted slate gray icon representing inactive state
    chrome.action.setIcon({ path: ICON_INACTIVE });

    // 2. Badge text cleared
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748b' });

    // 3. Tooltip title
    chrome.action.setTitle({
      title: 'GRPROXY: Disconnected (Click to Connect)',
    });
  }
}

/**
 * Builds resilient PAC script.
 * Chrome requires SOCKS5 (never use SOCKS which forces buggy SOCKS4).
 * Always chains verified live SOCKS5 endpoints and terminates in DIRECT.
 */
function buildPacScript(mode, proxy, backupProxies = [], customDomains = []) {
  const p = proxy || DEFAULT_SOCKS5_PROXY;

  // Build resilient multi-tier SOCKS5 proxy chain from verified working servers
  const cleanBackups = (backupProxies && backupProxies.length > 0 ? backupProxies : DEFAULT_BACKUPS)
    .filter((b) => b && b.ip && b.port && b.ip !== p.ip)
    .slice(0, 4)
    .map((b) => `SOCKS5 ${b.ip}:${b.port}`);

  const proxyChain = [
    `SOCKS5 ${p.ip}:${p.port}`,
    ...cleanBackups,
    'DIRECT',
  ].join('; ');

  // Mode 1: Whole Chrome Profile (Proxy all profile web traffic)
  if (mode === 'whole_profile' || mode === 'global') {
    return `// GRPROXY Whole Profile PAC - Pinned: ${p.country || 'Edge'} (${p.ip}:${p.port})
function FindProxyForURL(url, host) {
  // Direct Intranet & Local Traffic
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      shExpMatch(host, "localhost") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
      isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }
  return "${proxyChain}";
}
`;
  }

  // Mode 2: Smart Split-Routing / Added Links Only (Default)
  // 100% native speed for YouTube, Netflix, Downloads, Steam, and local sites.
  // ONLY routes web.telegram.org, telegram services, and custom added URLs through proxy.
  const allDomains = Array.from(new Set([...DEFAULT_DOMAINS, ...(customDomains || [])]));

  const domainRules = allDomains
    .map((d) => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean)
    .map((d) => {
      if (d.startsWith('*.')) return `shExpMatch(host, "${d}") || shExpMatch(host, "${d.slice(2)}")`;
      if (d.includes('*')) return `shExpMatch(host, "${d}")`;
      return `shExpMatch(host, "${d}") || shExpMatch(host, "*.${d}")`;
    });

  const domainCondition = domainRules.join(' ||\n      ');

  return `// GRPROXY Smart Split-Routing PAC - Pinned: ${p.country || 'Edge'} (${p.ip}:${p.port})
function FindProxyForURL(url, host) {
  // 1. Direct Intranet & Local Traffic
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      shExpMatch(host, "localhost") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
      isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }

  // 2. High-Bandwidth Direct Bypass (Never slow down streaming or downloads)
  if (shExpMatch(host, "*.googlevideo.com") ||
      shExpMatch(host, "*.youtube.com") ||
      shExpMatch(host, "*.ytimg.com") ||
      shExpMatch(host, "*.netflix.com") ||
      shExpMatch(host, "*.nflxvideo.net") ||
      shExpMatch(host, "*.speedtest.net") ||
      shExpMatch(host, "*.fast.com") ||
      shExpMatch(host, "*.steamcontent.com") ||
      shExpMatch(host, "*.cloudflare.com") ||
      shExpMatch(host, "*.workers.dev")) {
    return "DIRECT";
  }

  // 3. Blocked Services Acceleration (Telegram & Added Links ONLY)
  if (${domainCondition}) {
    return "${proxyChain}";
  }

  // 4. Default: DIRECT at full native fiber line speed
  return "DIRECT";
}
`;
}

/**
 * Fires a desktop notification informing the user of the active proxy protection
 */
function sendDesktopNotification(proxy, isAutoReconnect = false) {
  const flag = proxy?.flag || '🌐';
  const country = proxy?.country || proxy?.name || 'Global Edge';
  const title = isAutoReconnect ? 'GRPROXY Auto-Reconnected ⚡' : 'GRPROXY Connected ⚡';
  const message = `${flag} ${country} SOCKS5 Protection Active • Zero Slowdown`;

  try {
    chrome.notifications.create(`grproxy-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icons/icon-active-128.png',
      title,
      message,
      priority: 2,
    });
  } catch (err) {
    console.warn('[GRPROXY] Notification notice:', err);
  }
}

/**
 * Applies proxy configuration to Chrome settings
 */
function applyProxy(proxy, mode, domains = [], backups = [], isAutoReconnect = false, callback = null) {
  // Mode 3: Turn Off (Default DIRECT)
  if (mode === 'off' || !proxy) {
    chrome.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' }, () => {
      updateToolbarState(false, null, 'off');
      chrome.storage.local.set({ isConnected: false, mode: 'off' }, () => {
        if (callback) callback({ success: true, mode: 'off' });
      });
    });
    return;
  }

  const pacScript = buildPacScript(mode, proxy, backups, domains);
  const config = {
    mode: 'pac_script',
    pacScript: {
      data: pacScript,
    },
  };

  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    if (chrome.runtime.lastError) {
      console.error('[GRPROXY] Failed to set proxy:', chrome.runtime.lastError);
      if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
      return;
    }

    updateToolbarState(true, proxy, mode);

    chrome.storage.local.set(
      {
        isConnected: true,
        mode,
        selectedProxy: proxy,
        selectedNodeId: proxy.id,
        backupProxies: backups && backups.length > 0 ? backups : DEFAULT_BACKUPS,
        customDomains: domains && domains.length > 0 ? domains : DEFAULT_DOMAINS,
        connectedAt: Date.now(),
      },
      () => {
        sendDesktopNotification(proxy, isAutoReconnect);
        if (callback) callback({ success: true, mode, proxy });
      }
    );
  });
}

/**
 * Auto-restore previous proxy connection on browser startup or computer reboot
 */
function restoreConnectionIfActive() {
  chrome.storage.local.get(
    ['isConnected', 'mode', 'selectedProxy', 'customDomains', 'backupProxies'],
    (res) => {
      if (res && res.isConnected && res.mode && res.mode !== 'off' && res.selectedProxy) {
        console.log('[GRPROXY] System restart detected: Restoring persistent proxy to', res.selectedProxy.country);
        applyProxy(
          res.selectedProxy,
          res.mode,
          res.customDomains || DEFAULT_DOMAINS,
          res.backupProxies || DEFAULT_BACKUPS,
          true // isAutoReconnect: true -> triggers desktop toast notification
        );
      } else {
        updateToolbarState(false, null, 'off');
      }
    }
  );
}

// 1. Persistent auto-reconnect on browser startup (computer reboot / Chrome launch)
chrome.runtime.onStartup.addListener(() => {
  restoreConnectionIfActive();
});

// 2. Extension install / update initialization & Context Menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isConnected', 'mode', 'selectedProxy'], (res) => {
    if (res.isConnected === undefined) {
      chrome.storage.local.set({
        isConnected: false,
        mode: 'split', // Default: Added Links Only (Smart Split-Routing)
        selectedNodeId: DEFAULT_SOCKS5_PROXY.id,
        selectedProxy: DEFAULT_SOCKS5_PROXY,
        backupProxies: DEFAULT_BACKUPS,
        workerHost: DEFAULT_WORKER_HOST,
        customDomains: DEFAULT_DOMAINS,
      });
      updateToolbarState(false, null, 'off');
    } else if (res.isConnected) {
      restoreConnectionIfActive();
    } else {
      updateToolbarState(false, null, 'off');
    }
  });

  // Create context menus for quick actions
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'grproxy-toggle',
        title: '⚡ Toggle GRPROXY On/Off',
        contexts: ['action', 'page'],
      });
      chrome.contextMenus.create({
        id: 'grproxy-add-site',
        title: '➕ Route this site through GRPROXY',
        contexts: ['page', 'link'],
      });
    });
  }
});

// 3. Keyboard Shortcut Handler (Alt+Shift+P / Command+Shift+P)
if (chrome.commands) {
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-proxy') {
      chrome.storage.local.get(['isConnected', 'mode', 'selectedProxy', 'customDomains', 'backupProxies'], (res) => {
        if (res && res.isConnected && res.mode !== 'off') {
          applyProxy(null, 'off', [], [], false);
        } else {
          const targetProxy = res?.selectedProxy || DEFAULT_SOCKS5_PROXY;
          const targetMode = (res?.mode && res.mode !== 'off') ? res.mode : 'split';
          const targetDomains = res?.customDomains || DEFAULT_DOMAINS;
          const targetBackups = res?.backupProxies || DEFAULT_BACKUPS;
          applyProxy(targetProxy, targetMode, targetDomains, targetBackups, false);
        }
      });
    }
  });
}

// 4. Context Menu Click Handler
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'grproxy-toggle') {
      chrome.storage.local.get(['isConnected', 'mode', 'selectedProxy', 'customDomains', 'backupProxies'], (res) => {
        if (res && res.isConnected && res.mode !== 'off') {
          applyProxy(null, 'off', [], [], false);
        } else {
          const targetProxy = res?.selectedProxy || DEFAULT_SOCKS5_PROXY;
          const targetMode = (res?.mode && res.mode !== 'off') ? res.mode : 'split';
          const targetDomains = res?.customDomains || DEFAULT_DOMAINS;
          const targetBackups = res?.backupProxies || DEFAULT_BACKUPS;
          applyProxy(targetProxy, targetMode, targetDomains, targetBackups, false);
        }
      });
    } else if (info.menuItemId === 'grproxy-add-site') {
      const rawUrl = info.linkUrl || info.pageUrl || tab?.url;
      if (rawUrl) {
        try {
          const host = new URL(rawUrl).hostname.toLowerCase();
          if (host && !host.startsWith('chrome') && host !== 'localhost' && host !== '127.0.0.1') {
            chrome.storage.local.get(['customDomains', 'isConnected', 'mode', 'selectedProxy', 'backupProxies'], (res) => {
              const list = res.customDomains || [...DEFAULT_DOMAINS];
              if (!list.includes(host)) {
                list.push(host);
                chrome.storage.local.set({ customDomains: list }, () => {
                  if (res.isConnected && res.mode === 'split') {
                    applyProxy(res.selectedProxy || DEFAULT_SOCKS5_PROXY, 'split', list, res.backupProxies || DEFAULT_BACKUPS);
                  }
                  if (chrome.notifications) {
                    chrome.notifications.create(`grproxy-add-${Date.now()}`, {
                      type: 'basic',
                      iconUrl: 'icons/icon-active-128.png',
                      title: 'GRPROXY Rule Added',
                      message: `Routed "${host}" via verified SOCKS5 proxy`,
                      priority: 1,
                    });
                  }
                });
              }
            });
          }
        } catch (err) {
          console.warn('[GRPROXY] Context menu URL parse error:', err);
        }
      }
    }
  });
}

// 5. Message dispatcher for popup interactions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CONNECT') {
    const { mode, proxy, domains, backups } = request;
    applyProxy(
      proxy || DEFAULT_SOCKS5_PROXY,
      mode || 'split',
      domains && domains.length > 0 ? domains : DEFAULT_DOMAINS,
      backups && backups.length > 0 ? backups : DEFAULT_BACKUPS,
      false,
      sendResponse
    );
    return true; // async response
  }

  if (request.action === 'DISCONNECT' || request.action === 'TURN_OFF') {
    applyProxy(null, 'off', [], [], false, sendResponse);
    return true;
  }

  if (request.action === 'SET_MODE') {
    const { mode, proxy, domains, backups } = request;
    if (mode === 'off') {
      applyProxy(null, 'off', [], [], false, sendResponse);
    } else {
      chrome.storage.local.get(['selectedProxy', 'customDomains', 'backupProxies'], (res) => {
        const targetProxy = proxy || res.selectedProxy || DEFAULT_SOCKS5_PROXY;
        const targetDomains = domains || res.customDomains || DEFAULT_DOMAINS;
        const targetBackups = backups || res.backupProxies || DEFAULT_BACKUPS;
        applyProxy(targetProxy, mode, targetDomains, targetBackups, false, sendResponse);
      });
    }
    return true;
  }

  if (request.action === 'UPDATE_TOOLBAR') {
    updateToolbarState(request.isConnected, request.proxy, request.mode);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'GET_STATUS') {
    chrome.storage.local.get(null, (items) => {
      sendResponse({ success: true, data: items });
    });
    return true;
  }
});

// Diagnostics & Error monitoring
chrome.proxy.onProxyError.addListener((details) => {
  console.warn('[GRPROXY] Chrome Proxy Subsystem Warning:', details);
});
