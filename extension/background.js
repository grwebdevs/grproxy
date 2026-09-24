/**
 * GRPROXY Chrome Extension — Background Service Worker (Manifest V3)
 * High-Speed Anti-Censorship Edge Network Engine with Zero-Slowdown Split Routing,
 * Multi-Tier Verified SOCKS5 Fallback, and Persistent Auto-Reconnect.
 */

const DEFAULT_WORKER_HOST = 'grproxy.grwebdevs5.workers.dev';

// Targeted Anti-Censorship Domain List (Telegram Web, Core, CDN, Discord, Socials)
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

// Verified Ultra-Fast SOCKS5 Proxies (Confirmed with Live TLS Transfer to web.telegram.org:443)
const VERIFIED_SOCKS5_POOL = [
  { id: 'socks5_185.87.255.47_1080', ip: '185.87.255.47', port: 1080, country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'London (Fastest 762ms)', latency: 762 },
  { id: 'socks5_185.87.255.54_1080', ip: '185.87.255.54', port: 1080, country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'London Hub (793ms)', latency: 793 },
  { id: 'socks5_141.148.158.143_1080', ip: '141.148.158.143', port: 1080, country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Phoenix Core', latency: 1824 },
  { id: 'socks5_184.170.245.148_4145', ip: '184.170.245.148', port: 4145, country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Atlanta Edge', latency: 2027 },
  { id: 'socks5_192.243.115.26_1080', ip: '192.243.115.26', port: 1080, country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Los Angeles Hub', latency: 3878 },
];

const DEFAULT_SOCKS5_PROXY = VERIFIED_SOCKS5_POOL[0];
const DEFAULT_BACKUPS = VERIFIED_SOCKS5_POOL.slice(1);

// Toolbar Icon Asset Paths
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
    chrome.action.setIcon({ path: ICON_ACTIVE });
    const badgeText = proxy.countryCode ? proxy.countryCode.substring(0, 4).toUpperCase() : 'ON';
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ color: '#ffffff' });
    }
    const flag = proxy.flag || '🌐';
    const countryName = proxy.country || proxy.name || 'Fast Edge';
    chrome.action.setTitle({
      title: `GRPROXY: Connected • ${flag} ${countryName} (${mode === 'whole_profile' ? 'Whole Profile' : 'Smart Split'})`,
    });
  } else {
    chrome.action.setIcon({ path: ICON_INACTIVE });
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
    chrome.action.setTitle({
      title: 'GRPROXY: Disconnected (Click to Connect)',
    });
  }
}

/**
 * Builds resilient, ultra-fast PAC script.
 * Pure SOCKS5 fallback chain with verified responsive nodes.
 * High-bandwidth streaming (YouTube 4K, Netflix, Downloads) always stays DIRECT for 0% speed loss.
 * ZERO synchronous DNS blocking (removes dnsResolve which causes browser hangs).
 */
function buildPacScript(mode, proxy, backupProxies = [], customDomains = []) {
  const p = proxy || DEFAULT_SOCKS5_PROXY;

  const cleanBackups = (backupProxies && backupProxies.length > 0 ? backupProxies : DEFAULT_BACKUPS)
    .filter((b) => b && b.ip && b.port && b.ip !== p.ip)
    .slice(0, 4)
    .map((b) => `SOCKS5 ${b.ip}:${b.port}`);

  const proxyChain = [
    `SOCKS5 ${p.ip}:${p.port}`,
    ...cleanBackups,
    'DIRECT',
  ].join('; ');

  // Common high-bandwidth streaming & intranet bypass (Instant microsecond string matching, ZERO DNS delay)
  const commonBypass = `
  // 1. Direct Intranet & Localhost (Pure string matching - No blocking dnsResolve)
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      shExpMatch(host, "localhost") ||
      shExpMatch(host, "127.*") ||
      shExpMatch(host, "10.*") ||
      shExpMatch(host, "192.168.*") ||
      shExpMatch(host, "172.16.*") ||
      shExpMatch(host, "172.17.*") ||
      shExpMatch(host, "172.18.*") ||
      shExpMatch(host, "172.19.*") ||
      shExpMatch(host, "172.2*") ||
      shExpMatch(host, "172.3*")) {
    return "DIRECT";
  }

  // 2. High-Bandwidth Media, CDN & Regional Direct Bypass (Guarantees 100% native fiber speed)
  if (shExpMatch(host, "*.googlevideo.com") ||
      shExpMatch(host, "*.youtube.com") ||
      shExpMatch(host, "*.ytimg.com") ||
      shExpMatch(host, "*.netflix.com") ||
      shExpMatch(host, "*.nflxvideo.net") ||
      shExpMatch(host, "*.speedtest.net") ||
      shExpMatch(host, "*.fast.com") ||
      shExpMatch(host, "*.steamcontent.com") ||
      shExpMatch(host, "*.steampowered.com") ||
      shExpMatch(host, "*.cloudflare.com") ||
      shExpMatch(host, "*.workers.dev") ||
      shExpMatch(host, "*.pk") ||
      shExpMatch(host, "*.gov.pk") ||
      shExpMatch(host, "*.edu.pk") ||
      shExpMatch(host, "*.com.pk") ||
      shExpMatch(host, "*.net.pk") ||
      shExpMatch(host, "*.org.pk")) {
    return "DIRECT";
  }
  `;

  // Mode 1: Whole Chrome Profile
  if (mode === 'whole_profile' || mode === 'global') {
    return `// GRPROXY Whole Profile PAC - Active Node: ${p.country || 'Edge'} (${p.ip}:${p.port})
function FindProxyForURL(url, host) {
${commonBypass}
  // Route all other web profile traffic through verified SOCKS5 chain
  return "${proxyChain}";
}
`;
  }

  // Mode 2: Smart Split-Routing / Added Links Only (Default)
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

  return `// GRPROXY Smart Split-Routing PAC - Active Node: ${p.country || 'Edge'} (${p.ip}:${p.port})
function FindProxyForURL(url, host) {
${commonBypass}
  // 3. Blocked Services Acceleration (Telegram Web & Added Links ONLY)
  if (${domainCondition}) {
    return "${proxyChain}";
  }

  // 4. Default: DIRECT at full native fiber line speed (0% speed loss)
  return "DIRECT";
}
`;
}

/**
 * Fires a desktop notification informing the user of the active proxy protection
 */
function sendDesktopNotification(proxy, isAutoReconnect = false) {
  const flag = proxy?.flag || '🌐';
  const country = proxy?.country || proxy?.name || 'Fast Edge';
  const title = isAutoReconnect ? 'GRPROXY Auto-Reconnected ⚡' : 'GRPROXY Connected ⚡';
  const message = `${flag} ${country} • Zero Slowdown Protection Active`;

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
          true
        );
      } else {
        updateToolbarState(false, null, 'off');
      }
    }
  );
}

// 1. Persistent auto-reconnect on browser startup
chrome.runtime.onStartup.addListener(() => {
  restoreConnectionIfActive();
});

// 2. Extension install / update initialization
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

// 3. Keyboard Shortcut Handler (Alt+Shift+P)
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
                      message: `Routed "${host}" via high-speed SOCKS5 proxy`,
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
    return true;
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
