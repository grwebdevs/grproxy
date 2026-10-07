/**
 * GRPROXY Chrome Extension — Minimalist Popup Controller (Manifest V3)
 * High-Speed Anti-Censorship Edge Network with Zero-Slowdown Split Routing
 */

// Top Curated Multi-Country Locations (Verified Cloudflare Edge & Clean SOCKS5)
const INITIAL_LOCATIONS = [
  { id: 'socks5_104.16.12.34_1080', name: 'Pakistan (Karachi Direct)', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Karachi (KHI Direct)', continent: 'Asia', ip: '104.16.12.34', port: 1080, pingEstimate: 18, protocol: 'socks5' },
  { id: 'socks5_104.17.45.67_1080', name: 'Pakistan (Islamabad Hub)', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Islamabad (ISB Core)', continent: 'Asia', ip: '104.17.45.67', port: 1080, pingEstimate: 22, protocol: 'socks5' },
  { id: 'socks5_104.18.99.12_1080', name: 'Saudi Arabia (Riyadh)', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Riyadh (RUH Hub)', continent: 'Middle East', ip: '104.18.99.12', port: 1080, pingEstimate: 36, protocol: 'socks5' },
  { id: 'socks5_104.19.112.44_1080', name: 'Saudi Arabia (Jeddah)', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Jeddah (JED Edge)', continent: 'Middle East', ip: '104.19.112.44', port: 1080, pingEstimate: 39, protocol: 'socks5' },
  { id: 'socks5_172.67.182.11_1080', name: 'UAE (Dubai Anycast)', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', city: 'Dubai (DXB Core)', continent: 'Middle East', ip: '172.67.182.11', port: 1080, pingEstimate: 28, protocol: 'socks5' },
  { id: 'socks5_104.18.28.5_1080', name: 'United Kingdom (London)', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'London (LHR Core)', continent: 'Europe', ip: '104.18.28.5', port: 1080, pingEstimate: 42, protocol: 'socks5' },
  { id: 'socks5_91.107.179.68_10809', name: 'Germany (Frankfurt Core)', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', city: 'Frankfurt (FRA Hub)', continent: 'Europe', ip: '91.107.179.68', port: 10809, pingEstimate: 40, protocol: 'socks5' },
  { id: 'socks5_104.20.99.14_1080', name: 'France (Paris Anycast)', country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Paris (CDG Core)', continent: 'Europe', ip: '104.20.99.14', port: 1080, pingEstimate: 44, protocol: 'socks5' },
  { id: 'socks5_198.8.94.174_39078', name: 'United States (East Coast)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'East Coast Hub', continent: 'North America', ip: '198.8.94.174', port: 39078, pingEstimate: 68, protocol: 'socks5' },
  { id: 'socks5_104.16.24.4_1080', name: 'Singapore (Asia Hub)', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', city: 'Singapore (SIN Hub)', continent: 'Asia', ip: '104.16.24.4', port: 1080, pingEstimate: 32, protocol: 'socks5' },
  { id: 'socks5_104.22.90.15_1080', name: 'Taiwan (Taipei Hub)', country: 'Taiwan', countryCode: 'TW', flag: '🇹🇼', city: 'Taipei (TPE Core)', continent: 'Asia', ip: '104.22.90.15', port: 1080, pingEstimate: 45, protocol: 'socks5' },
  { id: 'socks5_104.19.12.8_1080', name: 'Netherlands (Amsterdam)', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', city: 'Amsterdam (AMS Core)', continent: 'Europe', ip: '104.19.12.8', port: 1080, pingEstimate: 41, protocol: 'socks5' },
];

const DEFAULT_DOMAINS = [
  'web.telegram.org',
  '*.web.telegram.org',
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
  'discord.com',
  '*.discord.com',
  'x.com',
  '*.x.com',
  'twitter.com',
  'reddit.com',
];

const ICON_ACTIVE = { 16: 'icons/icon-active-16.png', 32: 'icons/icon-active-32.png', 48: 'icons/icon-active-48.png', 128: 'icons/icon-active-128.png' };
const ICON_INACTIVE = { 16: 'icons/icon-inactive-16.png', 32: 'icons/icon-inactive-32.png', 48: 'icons/icon-inactive-48.png', 128: 'icons/icon-inactive-128.png' };

function updateToolbarState(isConnected, proxy = null, mode = 'split') {
  if (chrome.action && chrome.action.setIcon) {
    if (isConnected && proxy && mode !== 'off') {
      chrome.action.setIcon({ path: ICON_ACTIVE });
      const badgeText = proxy.countryCode ? proxy.countryCode.substring(0, 4).toUpperCase() : 'ON';
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      const flag = proxy.flag || '🌐';
      const countryName = proxy.name || proxy.country || 'Fast Edge';
      chrome.action.setTitle({
        title: `GRPROXY: Connected • ${flag} ${countryName}`,
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
}

let state = {
  isConnected: false,
  mode: 'split', // 'whole_profile' | 'split' | 'off'
  selectedNodeId: INITIAL_LOCATIONS[0].id,
  selectedProxy: INITIAL_LOCATIONS[0],
  workerHost: 'gredge-network.grwebdevs5.workers.dev',
  customDomains: [...DEFAULT_DOMAINS],
  selectedContinent: 'all',
  searchQuery: '',
  availableProxies: [...INITIAL_LOCATIONS],
  currentTabHost: null,
};

// UI Elements
const mainToggleBtn = document.getElementById('mainToggleBtn');
const btnLabel = document.getElementById('btnLabel');
const statusBadge = document.getElementById('statusBadge');
const statusText = document.getElementById('statusText');
const connectionSubtext = document.getElementById('connectionSubtext');

const modeWholeBtn = document.getElementById('modeWholeBtn');
const modeSplitBtn = document.getElementById('modeSplitBtn');
const modeOffBtn = document.getElementById('modeOffBtn');

const currentFlag = document.getElementById('currentFlag');
const currentCountryName = document.getElementById('currentCountryName');
const currentCity = document.getElementById('currentCity');
const currentPing = document.getElementById('currentPing');
const copyProxyBtn = document.getElementById('copyProxyBtn');
const openDrawerTrigger = document.getElementById('openDrawerTrigger');
const toggleCountryDrawerBtn = document.getElementById('toggleCountryDrawerBtn');

const currentSiteBanner = document.getElementById('currentSiteBanner');
const currentSiteHost = document.getElementById('currentSiteHost');
const addCurrentSiteBtn = document.getElementById('addCurrentSiteBtn');

const domainCount = document.getElementById('domainCount');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const openSettingsFromRulesBtn = document.getElementById('openSettingsFromRulesBtn');

const countryDrawer = document.getElementById('countryDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const countrySearchInput = document.getElementById('countrySearchInput');
const countryList = document.getElementById('countryList');

function detectCurrentTab() {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            const host = url.hostname.toLowerCase();
            if (host && !host.startsWith('chrome') && host !== 'localhost' && host !== '127.0.0.1') {
              state.currentTabHost = host;
              if (currentSiteBanner && currentSiteHost) {
                currentSiteHost.innerText = host;
                currentSiteBanner.classList.remove('hidden');
              }
            }
          }
        } catch {}
      }
    });
  }
}

function init() {
  chrome.runtime.sendMessage({ action: 'GET_STATUS' }, (res) => {
    if (chrome.runtime.lastError) {}
    if (res && res.success && res.data) {
      const d = res.data;
      if (d.isConnected !== undefined) state.isConnected = d.isConnected;
      if (d.mode) state.mode = d.mode;
      if (d.selectedNodeId) state.selectedNodeId = d.selectedNodeId;
      if (d.selectedProxy) state.selectedProxy = d.selectedProxy;
      if (d.workerHost) state.workerHost = d.workerHost;
      if (d.customDomains && Array.isArray(d.customDomains)) state.customDomains = d.customDomains;
    }
    updateUI();
    renderCountries();
    fetchLiveEdgeNodesAndProxies();
    detectCurrentTab();
  });
}

function updateUI() {
  // 1. Master Button & Status Badge
  if (state.isConnected && state.mode !== 'off') {
    mainToggleBtn.className = 'main-toggle-btn connected';
    btnLabel.innerText = 'DISCONNECT';
    statusBadge.className = 'status-badge connected';

    if (state.mode === 'whole_profile') {
      statusText.innerText = 'WHOLE PROFILE';
      connectionSubtext.innerText = 'All profile traffic protected via Edge Relay';
    } else {
      statusText.innerText = 'SMART SPLIT';
      connectionSubtext.innerText = 'Protected for Telegram & Added Links • 100% native speed for rest';
    }
  } else {
    mainToggleBtn.className = 'main-toggle-btn disconnected';
    btnLabel.innerText = 'CONNECT';
    statusBadge.className = 'status-badge disconnected';
    statusText.innerText = 'DIRECT';
    connectionSubtext.innerText = 'Click to activate Zero-Slowdown Edge Protection';
  }

  // 2. Mode Selector Pills
  modeWholeBtn.classList.remove('active');
  modeSplitBtn.classList.remove('active');
  modeOffBtn.classList.remove('active');

  if (!state.isConnected || state.mode === 'off') {
    modeOffBtn.classList.add('active');
  } else if (state.mode === 'whole_profile') {
    modeWholeBtn.classList.add('active');
  } else {
    modeSplitBtn.classList.add('active');
  }

  // 3. Location Card
  const activeProxy = getSelectedProxy();
  currentFlag.innerText = activeProxy.flag || '🌐';
  currentCountryName.innerText = activeProxy.name || activeProxy.country || 'Pakistan';
  currentCity.innerText = `${activeProxy.city || 'Karachi Direct'} • SOCKS5`;
  currentPing.innerText = `~${activeProxy.pingEstimate || activeProxy.latency || 20} ms`;

  // 4. Rule counter
  if (domainCount) {
    domainCount.innerText = state.customDomains.length;
  }

  // 5. Toolbar Icon
  updateToolbarState(state.isConnected, activeProxy, state.mode);
}

function getSelectedProxy() {
  if (state.selectedProxy && state.selectedProxy.ip) {
    return state.selectedProxy;
  }
  const found = state.availableProxies.find((p) => p.id === state.selectedNodeId);
  if (found) return found;
  return state.availableProxies[0] || INITIAL_LOCATIONS[0];
}

function getBackupProxies() {
  const current = getSelectedProxy();
  return state.availableProxies
    .filter((p) => p.id !== current.id && p.ip && p.port)
    .slice(0, 4);
}

function applyConnection(targetMode = state.mode) {
  if (targetMode === 'off') {
    disconnect();
    return;
  }

  state.mode = targetMode;
  const proxy = getSelectedProxy();
  const backups = getBackupProxies();

  updateToolbarState(true, proxy, targetMode);

  chrome.runtime.sendMessage(
    {
      action: 'CONNECT',
      mode: targetMode,
      proxy: {
        id: proxy.id,
        ip: proxy.ip,
        port: proxy.port,
        country: proxy.name || proxy.country,
        countryCode: proxy.countryCode,
        flag: proxy.flag,
        city: proxy.city,
        latency: proxy.pingEstimate || proxy.latency,
      },
      domains: state.customDomains,
      backups: backups.map((b) => ({
        id: b.id,
        ip: b.ip,
        port: b.port,
        country: b.name || b.country,
        flag: b.flag,
      })),
    },
    (res) => {
      if (chrome.runtime.lastError) return;
      if (res && res.success) {
        state.isConnected = true;
        updateUI();
      }
    }
  );
}

function disconnect() {
  updateToolbarState(false, null, 'off');
  chrome.runtime.sendMessage({ action: 'TURN_OFF' }, () => {
    if (chrome.runtime.lastError) {}
    state.isConnected = false;
    state.mode = 'off';
    updateUI();
  });
}

function renderCountries() {
  const filtered = state.availableProxies.filter((node) => {
    if (state.selectedContinent !== 'all' && node.continent !== state.selectedContinent) return false;
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const matchName = (node.name || node.country || '').toLowerCase().includes(q);
      const matchCity = (node.city || '').toLowerCase().includes(q);
      if (!matchName && !matchCity) return false;
    }
    return true;
  });

  countryList.innerHTML = filtered
    .map((node) => {
      const isSelected = node.id === state.selectedNodeId;
      return `
        <div class="country-item ${isSelected ? 'selected' : ''}" data-id="${node.id}">
          <div class="country-item-left">
            <span class="country-item-flag">${node.flag || '🌐'}</span>
            <div>
              <div class="country-item-name">${node.name || node.country}</div>
              <div class="country-item-city">${node.city || 'Edge Node'} • SOCKS5</div>
            </div>
          </div>
          <div class="ping-tag ping-green">~${node.pingEstimate || node.latency || 25} ms</div>
        </div>
      `;
    })
    .join('');

  countryList.querySelectorAll('.country-item').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      selectCountry(id);
    });
  });
}

function selectCountry(id) {
  const target = state.availableProxies.find((p) => p.id === id) || INITIAL_LOCATIONS.find((p) => p.id === id);
  if (target) {
    state.selectedNodeId = id;
    state.selectedProxy = target;
    chrome.storage.local.set({ selectedNodeId: id, selectedProxy: target });
  }
  updateUI();
  renderCountries();
  countryDrawer.classList.add('hidden');

  if (state.isConnected && state.mode !== 'off') {
    applyConnection(state.mode);
  }
}

function getContinentByCode(code) {
  const c = (code || '').toUpperCase();
  if (['PK', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'TR'].includes(c)) return 'Middle East';
  if (['IN', 'BD', 'LK', 'SG', 'MY', 'HK', 'JP', 'KR', 'TW', 'TH', 'VN', 'ID', 'PH'].includes(c)) return 'Asia';
  if (['DE', 'GB', 'FR', 'NL', 'EE', 'ES', 'IT', 'CH', 'SE', 'NO', 'FI', 'PL', 'CZ', 'AT', 'RO'].includes(c)) return 'Europe';
  if (['US', 'CA', 'MX', 'BR'].includes(c)) return 'North America';
  return 'Europe';
}

function fetchLiveEdgeNodesAndProxies() {
  fetch(`https://${state.workerHost}/api/proxies?protocol=socks5&_t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => r.json())
    .then((data) => {
      if (data && data.success && Array.isArray(data.proxies) && data.proxies.length > 0) {
        const liveMap = new Map();
        for (const loc of INITIAL_LOCATIONS) liveMap.set(loc.id, loc);

        for (const p of data.proxies) {
          liveMap.set(p.id, {
            id: p.id,
            name: `${p.country} (${p.city || 'Edge Core'})`,
            country: p.country,
            countryCode: p.countryCode,
            flag: p.flag || '🌐',
            city: p.city || 'Verified Core',
            continent: getContinentByCode(p.countryCode),
            ip: p.ip,
            port: p.port,
            pingEstimate: p.latency || 30,
            protocol: 'socks5',
          });
        }

        state.availableProxies = Array.from(liveMap.values());
        if (state.selectedNodeId && liveMap.has(state.selectedNodeId)) {
          state.selectedProxy = liveMap.get(state.selectedNodeId);
        }
        renderCountries();
        updateUI();
      }
    })
    .catch(() => {});
}

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

// Event Listeners
modeWholeBtn.addEventListener('click', () => {
  state.mode = 'whole_profile';
  applyConnection('whole_profile');
});

modeSplitBtn.addEventListener('click', () => {
  state.mode = 'split';
  applyConnection('split');
});

modeOffBtn.addEventListener('click', () => {
  state.mode = 'off';
  disconnect();
});

mainToggleBtn.addEventListener('click', () => {
  if (state.isConnected && state.mode !== 'off') {
    disconnect();
  } else {
    const targetMode = state.mode === 'off' ? 'split' : state.mode;
    applyConnection(targetMode);
  }
});

if (openDrawerTrigger) openDrawerTrigger.addEventListener('click', () => countryDrawer.classList.remove('hidden'));
if (toggleCountryDrawerBtn) toggleCountryDrawerBtn.addEventListener('click', () => countryDrawer.classList.remove('hidden'));
if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => countryDrawer.classList.add('hidden'));

if (openSettingsBtn) openSettingsBtn.addEventListener('click', openOptions);
if (openSettingsFromRulesBtn) openSettingsFromRulesBtn.addEventListener('click', openOptions);

document.querySelectorAll('.cont-pill').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cont-pill').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    state.selectedContinent = tab.dataset.continent;
    renderCountries();
  });
});

countrySearchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  renderCountries();
});

if (addCurrentSiteBtn) {
  addCurrentSiteBtn.addEventListener('click', () => {
    if (state.currentTabHost && !state.customDomains.includes(state.currentTabHost)) {
      state.customDomains.push(state.currentTabHost);
      chrome.storage.local.set({ customDomains: state.customDomains });
      if (domainCount) domainCount.innerText = state.customDomains.length;
      const orig = addCurrentSiteBtn.innerText;
      addCurrentSiteBtn.innerText = 'Added! ✓';
      setTimeout(() => {
        addCurrentSiteBtn.innerText = orig;
      }, 1500);

      if (state.isConnected && state.mode === 'split') {
        applyConnection('split');
      }
    }
  });
}

if (copyProxyBtn) {
  copyProxyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const proxy = getSelectedProxy();
    const addr = `${proxy.ip}:${proxy.port}`;
    navigator.clipboard.writeText(addr).then(() => {
      copyProxyBtn.innerText = '✓';
      copyProxyBtn.classList.add('copied');
      setTimeout(() => {
        copyProxyBtn.innerText = '📋';
        copyProxyBtn.classList.remove('copied');
      }, 1500);
    });
  });
}

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.isConnected) state.isConnected = changes.isConnected.newValue;
      if (changes.mode) state.mode = changes.mode.newValue;
      if (changes.selectedNodeId) state.selectedNodeId = changes.selectedNodeId.newValue;
      if (changes.selectedProxy) state.selectedProxy = changes.selectedProxy.newValue;
      if (changes.customDomains) state.customDomains = changes.customDomains.newValue;
      updateUI();
    }
  });
}

init();
