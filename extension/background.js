/**
 * GRPROXY Chrome Extension — Background Service Worker (Manifest V3)
 * Controls browser-level proxy settings with zero speed loss split-routing
 */

const DEFAULT_WORKER_HOST = 'grproxy.grwebdevs5.workers.dev';
const DEFAULT_DOMAINS = [
  '*.telegram.org',
  'web.telegram.org',
  '*.t.me',
  '*.telesco.pe',
  '*.tdesktop.com',
  '*.discord.com',
  '*.discordapp.com',
  '*.discord.gg',
  '*.x.com',
  '*.twitter.com',
  '*.twimg.com',
  '*.reddit.com',
  '*.redd.it',
  '*.medium.com',
];

// Initialize default storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isConnected', 'mode', 'selectedNodeId', 'customDomains'], (res) => {
    if (res.isConnected === undefined) {
      chrome.storage.local.set({
        isConnected: false,
        mode: 'booster', // 'booster' (Split-Routing) or 'global' (All traffic)
        selectedNodeId: 'ae-dxb',
        workerHost: DEFAULT_WORKER_HOST,
        customDomains: DEFAULT_DOMAINS,
      });
    }
  });
});

/**
 * Builds dynamic PAC script string based on mode and target node
 */
function buildPacScript(mode, cleanIp, domains, workerHost) {
  // If mode is global: routes all external web traffic through proxy
  if (mode === 'global') {
    return `
      function FindProxyForURL(url, host) {
        if (isPlainHostName(host) ||
            shExpMatch(host, "*.local") ||
            shExpMatch(host, "localhost") ||
            isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
            isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
            isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
            isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
          return "DIRECT";
        }
        return "HTTPS ${workerHost}:443; SOCKS5 ${cleanIp}:443; DIRECT";
      }
    `;
  }

  // Speed Booster Mode (Smart Split-Routing):
  // 100% native speed for YouTube, Netflix, Downloads, Steam, and local sites.
  // ONLY routes blocked/censored domains through the Cloudflare Anycast node.
  const domainConditions = domains
    .map((d) => `shExpMatch(host, "${d}")`)
    .join(' ||\n          ');

  return `
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

      // 3. Blocked Services Acceleration (Telegram, Discord, X, etc.)
      if (${domainConditions}) {
        return "HTTPS ${workerHost}:443; SOCKS5 ${cleanIp}:443; DIRECT";
      }

      // 4. Default: DIRECT at full native fiber line speed
      return "DIRECT";
    }
  `;
}

/**
 * Message listener for actions from popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CONNECT') {
    const { mode, cleanIp, domains, workerHost } = request;
    const host = workerHost || DEFAULT_WORKER_HOST;
    const domainList = domains && domains.length > 0 ? domains : DEFAULT_DOMAINS;
    const pacScript = buildPacScript(mode, cleanIp, domainList, host);

    const config = {
      mode: 'pac_script',
      pacScript: {
        data: pacScript,
      },
    };

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to set proxy:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }

      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

      chrome.storage.local.set({
        isConnected: true,
        mode,
        selectedCleanIp: cleanIp,
        connectedAt: Date.now(),
      });

      sendResponse({ success: true });
    });

    return true; // async sendResponse
  }

  if (request.action === 'DISCONNECT') {
    chrome.proxy.settings.set({ value: { mode: 'system' }, scope: 'regular' }, () => {
      chrome.action.setBadgeText({ text: '' });
      chrome.storage.local.set({ isConnected: false });
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'GET_STATUS') {
    chrome.storage.local.get(null, (items) => {
      sendResponse({ success: true, data: items });
    });
    return true;
  }
});

// Log any proxy warnings for diagnostics
chrome.proxy.onProxyError.addListener((details) => {
  console.warn('GRPROXY Proxy Error:', details);
});
