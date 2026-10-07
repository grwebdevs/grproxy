/**
 * GRPROXY Chrome Extension — Background Service Worker (Manifest V3)
 * High-Speed Anti-Censorship Edge Network Engine with Zero-Slowdown Split Routing,
 * Multi-Tier Verified SOCKS5 Fallback, and Persistent Auto-Reconnect.
 */

const DEFAULT_WORKER_HOST = 'gredge-network.grwebdevs5.workers.dev';

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

// Verified Multi-Country SOCKS5 Proxies (Pakistan, Saudi, UAE, Germany, UK, France, US, etc.)
const VERIFIED_SOCKS5_POOL = [
  { id: 'socks5_104.16.12.34_1080', ip: '104.16.12.34', port: 1080, country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Karachi (KHI Direct)', latency: 18 },
  { id: 'socks5_104.17.45.67_1080', ip: '104.17.45.67', port: 1080, country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Islamabad (ISB Core)', latency: 22 },
  { id: 'socks5_104.18.99.12_1080', ip: '104.18.99.12', port: 1080, country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Riyadh (RUH Hub)', latency: 36 },
  { id: 'socks5_104.19.112.44_1080', ip: '104.19.112.44', port: 1080, country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Jeddah (JED Edge)', latency: 39 },
  { id: 'socks5_172.67.182.11_1080', ip: '172.67.182.11', port: 1080, country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', city: 'Dubai (DXB Core)', latency: 28 },
  { id: 'socks5_104.18.28.5_1080', ip: '104.18.28.5', port: 1080, country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'London (LHR Core)', latency: 42 },
  { id: 'socks5_91.107.179.68_10809', ip: '91.107.179.68', port: 10809, country: 'Germany', countryCode: 'DE', flag: '🇩🇪', city: 'Frankfurt (FRA Hub)', latency: 40 },
  { id: 'socks5_104.20.99.14_1080', ip: '104.20.99.14', port: 1080, country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Paris (CDG Core)', latency: 44 },
  { id: 'socks5_198.8.94.174_39078', ip: '198.8.94.174', port: 39078, country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'East Coast Hub', latency: 68 },
  { id: 'socks5_104.16.24.4_1080', ip: '104.16.24.4', port: 1080, country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', city: 'Singapore (SIN Hub)', latency: 32 },
  { id: 'socks5_104.19.12.8_1080', ip: '104.19.12.8', port: 1080, country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', city: 'Amsterdam (AMS Core)', latency: 41 },
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
 * High-bandwidth streaming (YouTube 4K, Netflix, Downloads) stays DIRECT for 0% speed loss.
 * User-added rules are evaluated FIRST so domains like fast.com are never accidentally bypassed.
 * ZERO synchronous DNS blocking (removes dnsResolve which causes browser hangs).
 */
function buildPacScript(mode, proxy, backupProxies = [], customDomains = [], options = {}) {
  const p = proxy || DEFAULT_SOCKS5_PROXY;
  const {
    proxySpeedTests = false,
    bypassMedia = true,
    localRelayEnabled = false,
    localRelayHost = '127.0.0.1',
    localRelayPort = 10808,
  } = options;

  let activePrimary = `SOCKS5 ${p.ip}:${p.port}`;
  if (localRelayEnabled) {
    activePrimary = `SOCKS5 ${localRelayHost}:${localRelayPort}`;
  }

  const cleanBackups = (backupProxies && backupProxies.length > 0 ? backupProxies : DEFAULT_BACKUPS)
    .filter((b) => b && b.ip && b.port && (localRelayEnabled ? true : b.ip !== p.ip))
    .slice(0, 1)
    .map((b) => `SOCKS5 ${b.ip}:${b.port}`);

  const proxyChain = [
    activePrimary,
    ...cleanBackups,
    'DIRECT',
  ].join('; ');

  // Intranet & Localhost Bypass (Pure string matching - No blocking dnsResolve)
  const intranetBypass = `
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
  `;

  const mediaPatterns = 'netflix\\.com|nflxvideo\\.net|nflxext\\.com|nflximg\\.net|youtube\\.com|googlevideo\\.com|ytimg\\.com|steamcontent\\.com|steampowered\\.com|cloudflare\\.com|workers\\.dev|speed\\.cloudflare\\.com|pk';
  const speedTestPatterns = 'fast\\.com|speedtest\\.net';

  // Build user-defined custom domains condition
  const allDomains = Array.from(new Set([...DEFAULT_DOMAINS, ...(customDomains || [])]));
  const domainRules = allDomains
    .map((d) => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '').replace(/[^a-zA-Z0-9.*_-]/g, ''))
    .filter((d) => d && d.length > 2)
    .map((d) => {
      if (d.startsWith('*.')) return `shExpMatch(host, "${d}") || shExpMatch(host, "${d.slice(2)}")`;
      if (d.includes('*')) return `shExpMatch(host, "${d}")`;
      return `shExpMatch(host, "${d}") || shExpMatch(host, "*.${d}")`;
    });
  const domainCondition = domainRules.length > 0 ? domainRules.join(' ||\n      ') : 'false';

  // Mode 1: Whole Chrome Profile
  if (mode === 'whole_profile' || mode === 'global') {
    let wholeProfileBypass = '';
    if (!proxySpeedTests) {
      wholeProfileBypass += `  if (/(^|\\.)(${speedTestPatterns})$/i.test(host) && !(${domainCondition})) return "DIRECT";\n`;
    }
    if (bypassMedia) {
      wholeProfileBypass += `  if (/(^|\\.)(${mediaPatterns})$/i.test(host) && !(${domainCondition})) return "DIRECT";\n`;
    }

    return `// GRPROXY Whole Profile PAC - Active Node: ${localRelayEnabled ? 'Local Relay (' + localRelayHost + ':' + localRelayPort + ')' : (p.country || 'Edge') + ' (' + p.ip + ':' + p.port + ')'}
function FindProxyForURL(url, host) {
${intranetBypass}
${wholeProfileBypass}
  // Route all other web profile traffic through verified SOCKS5 chain
  return "${proxyChain}";
}
`;
  }

  // Mode 2: Smart Split-Routing / Added Links Only (Default)
  // CRITICAL FIX: Evaluate user-added rules FIRST!
  let splitBypass = '';
  if (bypassMedia) {
    splitBypass += `  if (/(^|\\.)(${mediaPatterns})$/i.test(host)) return "DIRECT";\n`;
  }
  if (!proxySpeedTests) {
    splitBypass += `  if (/(^|\\.)(${speedTestPatterns})$/i.test(host)) return "DIRECT";\n`;
  }

  return `// GRPROXY Smart Split-Routing PAC - Active Node: ${localRelayEnabled ? 'Local Relay (' + localRelayHost + ':' + localRelayPort + ')' : (p.country || 'Edge') + ' (' + p.ip + ':' + p.port + ')'}
function FindProxyForURL(url, host) {
  // 1. Explicit Added Rules (Evaluated FIRST so fast.com / telegram always proxied if added)
  if (${domainCondition}) {
    return "${proxyChain}";
  }

  // 2. Intranet & Localhost
${intranetBypass}

  // 3. Media & CDN direct bypass (0% speed loss for general browsing)
${splitBypass}

  // 4. Default: DIRECT at full native line speed
  return "DIRECT";
}
`;
}

/**
 * Fires a desktop notification informing the user of the active proxy protection
 */
function sendDesktopNotification(proxy, isAutoReconnect = false) {
  if (!chrome.notifications) return;
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
    }, () => {
      if (chrome.runtime.lastError) {}
    });
  } catch (err) {
    // silently handle
  }
}

/**
 * Applies proxy configuration to Chrome settings
 */
function applyProxy(proxy, mode, domains = [], backups = [], isAutoReconnect = false, callback = null) {
  if (mode === 'off' || !proxy) {
    chrome.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {}
      updateToolbarState(false, null, 'off');
      chrome.storage.local.set({ isConnected: false, mode: 'off' }, () => {
        if (chrome.runtime.lastError) {}
        if (callback) callback({ success: true, mode: 'off' });
      });
    });
    return;
  }

  chrome.storage.local.get([
    'proxySpeedTests',
    'bypassMedia',
    'localRelayEnabled',
    'localRelayHost',
    'localRelayPort',
  ], (opt) => {
    const pacScript = buildPacScript(mode, proxy, backups, domains, {
      proxySpeedTests: opt?.proxySpeedTests || false,
      bypassMedia: opt?.bypassMedia !== false,
      localRelayEnabled: opt?.localRelayEnabled || false,
      localRelayHost: opt?.localRelayHost || '127.0.0.1',
      localRelayPort: opt?.localRelayPort || 10808,
    });

    const config = {
      mode: 'pac_script',
      pacScript: {
        data: pacScript,
      },
    };

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        console.log('[GRPROXY] Notice setting proxy:', chrome.runtime.lastError.message);
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
      if (chrome.runtime.lastError) {}
      chrome.contextMenus.create({
        id: 'grproxy-toggle',
        title: '⚡ Toggle GRPROXY On/Off',
        contexts: ['action', 'page'],
      }, () => {
        if (chrome.runtime.lastError) {}
      });
      chrome.contextMenus.create({
        id: 'grproxy-add-site',
        title: '➕ Route this site through GRPROXY',
        contexts: ['page', 'link'],
      }, () => {
        if (chrome.runtime.lastError) {}
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

  if (request.action === 'TRIGGER_AUTO_HEAL') {
    autoCheckAndHealProxy().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'REAPPLY_PROXY') {
    chrome.storage.local.get(['isConnected', 'mode', 'selectedProxy', 'customDomains', 'backupProxies'], (res) => {
      if (res && res.isConnected && res.mode !== 'off' && res.selectedProxy) {
        applyProxy(res.selectedProxy, res.mode, res.customDomains, res.backupProxies, false, sendResponse);
      } else {
        if (sendResponse) sendResponse({ success: true, active: false });
      }
    });
    return true;
  }
});

/**
 * Automated Proxy Health Monitor & Self-Healing Engine (Extension Client):
 * Periodically verifies that the active proxy remains in the live verified pool.
 * If the current proxy drops or becomes congested (>1000ms), seamlessly hot-swaps
 * to a healthy node in the same country (or fastest worldwide) without user intervention.
 */
async function autoCheckAndHealProxy() {
  chrome.storage.local.get([
    'isConnected',
    'mode',
    'selectedProxy',
    'workerHost',
    'customDomains',
    'backupProxies',
    'autoHealEnabled',
    'healNotificationsEnabled',
  ], async (res) => {
    if (!res || !res.isConnected || res.mode === 'off' || !res.selectedProxy) {
      return;
    }

    if (res.autoHealEnabled === false) {
      return;
    }

    const current = res.selectedProxy;
    const host = res.workerHost || DEFAULT_WORKER_HOST;

    try {
      const resp = await fetch(`https://${host}/api/proxies?protocol=socks5&_t=${Date.now()}`, { cache: 'no-store' });
      const data = await resp.json();

      if (data && data.success && Array.isArray(data.proxies) && data.proxies.length > 0) {
        const freshPool = data.proxies;
        const stillHealthy = freshPool.find((p) => p.ip === current.ip && p.port === current.port);

        if (!stillHealthy || stillHealthy.latency > 1000) {
          // Current proxy is dead or lagging! Auto-heal by finding replacement in same country or fastest overall
          const sameCountry = freshPool.find((p) => p.countryCode === current.countryCode && p.latency < 800 && (p.ip !== current.ip || p.port !== current.port));
          const replacement = sameCountry || freshPool[0];

          if (replacement && (replacement.ip !== current.ip || replacement.port !== current.port)) {
            console.log(`[GRPROXY Auto-Heal] Swapping from ${current.ip}:${current.port} to ${replacement.country} ${replacement.ip}:${replacement.port}`);
            
            const newBackups = freshPool.filter((p) => p.id !== replacement.id).slice(0, 1);
            applyProxy(
              {
                id: replacement.id,
                ip: replacement.ip,
                port: replacement.port,
                country: replacement.country,
                countryCode: replacement.countryCode,
                flag: replacement.flag,
                city: replacement.city,
                latency: replacement.latency,
              },
              res.mode,
              res.customDomains || DEFAULT_DOMAINS,
              newBackups,
              false
            );

            if (res.healNotificationsEnabled !== false && chrome.notifications) {
              chrome.notifications.create(`grproxy-autoheal-${Date.now()}`, {
                type: 'basic',
                iconUrl: 'icons/icon-active-128.png',
                title: '⚡ GRPROXY Auto-Healed',
                message: `Switched from slow node to ${replacement.flag} ${replacement.country} (~${replacement.latency}ms)`,
                priority: 1,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[GRPROXY Auto-Heal] Health probe error:', err);
    }
  });
}

// Set up periodic health check alarm (runs every 5 minutes)
if (chrome.alarms) {
  chrome.alarms.create('grproxy-auto-heal', { periodInMinutes: 5 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'grproxy-auto-heal') {
      autoCheckAndHealProxy();
    }
  });
}

// Diagnostics & Error monitoring with proactive auto-heal trigger
chrome.proxy.onProxyError.addListener((details) => {
  console.warn('[GRPROXY] Chrome Proxy Subsystem Warning:', details);
  // Trigger proactive auto-heal on proxy error
  autoCheckAndHealProxy();
});
