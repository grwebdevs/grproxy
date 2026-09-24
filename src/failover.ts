import { Env, FailoverState, ProxyItem } from './types';
import { getActivePool, generateSeedProxies } from './storage';
import { testTcpSocket } from './validator';

const getPinnedKey = (proto?: string) => (proto ? `failover_pinned_${proto}` : 'failover_pinned_state');

/**
 * Intelligent Auto-Failover Proxy Manager:
 * Stays pinned to the current best verified proxy as long as it responds quickly.
 * Only hot-swaps to the next healthy proxy if the current one drops or lags.
 * Uses protocol-namespaced KV keys so MTProto (Telegram) and SOCKS5 (Browser/PAC) never collide.
 */
export async function getOrRotatePinnedProxy(
  env: Env,
  options?: { force?: boolean; protocol?: 'mtproto' | 'socks5' }
): Promise<FailoverState> {
  const kvKey = getPinnedKey(options?.protocol);
  let existingState: FailoverState | null = null;

  try {
    const raw = await env.GRPROXY_KV.get(kvKey, 'json');
    if (raw && typeof raw === 'object' && (raw as FailoverState).pinnedProxyId) {
      existingState = raw as FailoverState;
    }
  } catch (err) {
    console.warn('Failed to load pinned proxy from KV:', err);
  }

  // Check if existing state can be retained
  if (existingState && !options?.force) {
    if (!options?.protocol || existingState.protocol === options.protocol) {
      const ageMs = Date.now() - (existingState.lastVerified || 0);

      // If verified in the last 2 minutes, return immediately with zero delay
      if (ageMs < 2 * 60 * 1000) {
        return existingState;
      }

      // Check socket health of the pinned proxy
      try {
        const check = await testTcpSocket(existingState.ip, existingState.port, 1800);
        if (check.ok && check.latency < 2200) {
          // Healthy! Retain pin and update timestamp
          existingState.lastVerified = Date.now();
          existingState.latency = check.latency;
          try {
            await env.GRPROXY_KV.put(kvKey, JSON.stringify(existingState), { expirationTtl: 86400 * 7 });
          } catch {
            // ignore async write failure
          }
          return existingState;
        }
      } catch {
        // failed check, proceed to failover
      }
    }
  }

  // Either force requested, no state, or previous proxy lagged/failed -> FAILOVER TO NEXT HEALTHIEST PROXY
  const pool = await getActivePool(env);
  let candidates = pool.filter((p) => p.isAlive);

  if (options?.protocol) {
    candidates = candidates.filter((p) => p.protocol === options.protocol);
    if (candidates.length === 0) {
      // Pull specifically from seed proxies matching the requested protocol
      candidates = generateSeedProxies().filter((p) => p.protocol === options.protocol);
    }
  }

  // Filter out the failed proxy to ensure we switch to a different one
  if (existingState && candidates.length > 1) {
    const filtered = candidates.filter((p) => p.id !== existingState!.pinnedProxyId);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  // Pick the lowest latency verified candidate
  candidates.sort((a, b) => a.latency - b.latency);
  const selected: ProxyItem =
    candidates[0] ||
    (options?.protocol ? generateSeedProxies().find((p) => p.protocol === options.protocol) : pool[0]) ||
    pool[0];

  const reason = options?.force
    ? 'Manual user switch'
    : existingState
    ? 'Auto-failover: Previous pinned proxy lagged or failed TCP socket health check'
    : 'Initial intelligent pool auto-pin';

  const tgLink =
    selected.tgLink ||
    (selected.protocol === 'mtproto'
      ? `tg://proxy?server=${encodeURIComponent(selected.ip)}&port=${selected.port}&secret=${encodeURIComponent(selected.secret || '')}`
      : `tg://socks?server=${encodeURIComponent(selected.ip)}&port=${selected.port}`);

  const socksUrl =
    selected.protocol === 'socks5'
      ? `socks5://${selected.username ? `${selected.username}:${selected.password}@` : ''}${selected.ip}:${selected.port}`
      : undefined;

  const newState: FailoverState = {
    pinnedProxyId: selected.id,
    protocol: selected.protocol,
    ip: selected.ip,
    port: selected.port,
    secret: selected.secret,
    username: selected.username,
    password: selected.password,
    country: selected.country,
    countryCode: selected.countryCode,
    flag: selected.flag,
    latency: selected.latency,
    pinnedAt: Date.now(),
    lastVerified: Date.now(),
    failoverCount: (existingState?.failoverCount || 0) + 1,
    reason,
    tgLink,
    socksUrl,
  };

  try {
    await env.GRPROXY_KV.put(kvKey, JSON.stringify(newState), { expirationTtl: 86400 * 7 });
  } catch (err) {
    console.warn('Failed to save updated pinned proxy to KV:', err);
  }

  return newState;
}

/**
 * Generates an intelligent Proxy Auto-Config (PAC) script with multi-tier failover
 * Features:
 * - Smart Split-Routing: Heavy traffic (YouTube, Netflix, Speedtest, Twitch, local LAN) goes DIRECT at 100% full fiber speed.
 * - Blocked services (web.telegram.org, t.me, Discord, X, etc.) and user added links route through verified SOCKS5 proxies.
 * - Multi-proxy failover: If the primary SOCKS5 proxy hiccups, Chrome immediately tries backup proxies before DIRECT.
 * - Guaranteed Zero ERR_TUNNEL_CONNECTION_FAILED: MTProto proxies are strictly excluded from browser PAC scripts.
 */
export function generatePacScript(
  pinned: FailoverState,
  mode: 'split' | 'all' = 'split',
  backupPool: ProxyItem[] = [],
  customDomains: string[] = []
): string {
  // Filter for valid SOCKS5 proxies only (Never MTProto for browser PAC)
  let primarySocks = pinned.protocol === 'socks5' ? pinned : null;
  const socksBackups = backupPool.filter((p) => p.protocol === 'socks5' && p.isAlive && p.id !== pinned.pinnedProxyId);

  if (!primarySocks && socksBackups.length > 0) {
    const first = socksBackups.shift()!;
    primarySocks = {
      pinnedProxyId: first.id,
      protocol: 'socks5',
      ip: first.ip,
      port: first.port,
      country: first.country,
      flag: first.flag,
      latency: first.latency,
      pinnedAt: Date.now(),
      lastVerified: Date.now(),
      failoverCount: 1,
      reason: 'Auto-fallback to verified SOCKS5 for browser PAC',
      tgLink: first.tgLink || '',
    };
  }

  const backupInstruction = socksBackups
    .slice(0, 4)
    .map((p) => `SOCKS5 ${p.ip}:${p.port}`)
    .join('; ');

  const proxyInstruction = primarySocks
    ? [`SOCKS5 ${primarySocks.ip}:${primarySocks.port}`, backupInstruction, 'DIRECT']
        .filter(Boolean)
        .join('; ')
    : backupInstruction
    ? [backupInstruction, 'DIRECT'].join('; ')
    : 'DIRECT';

  const commonBypass = `
  // 1. Direct Intranet & Local Traffic (Pure string matching - ZERO blocking DNS)
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

  // 2. High-Bandwidth Speed Tests, Media, CDN & Regional Bypass (Guarantees full native 4K line speed)
  if (/(^|\.)(fast\.com|speedtest\.net|netflix\.com|nflxvideo\.net|nflxext\.com|nflximg\.net|youtube\.com|googlevideo\.com|ytimg\.com|steamcontent\.com|steampowered\.com|cloudflare\.com|workers\.dev|speed\.cloudflare\.com|pk)$/i.test(host)) {
    return "DIRECT";
  }
  `;

  if (mode === 'all') {
    return `// GRPROXY Universal Proxy Auto-Config (Global Mode)
// Pinned Target: ${primarySocks ? `${primarySocks.country} (${primarySocks.ip}:${primarySocks.port})` : 'Direct Fallback'}
function FindProxyForURL(url, host) {
${commonBypass}
  return "${proxyInstruction}";
}
`;
  }

  // Format custom domain rules
  const extraRules = customDomains
    .map((d) => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(Boolean)
    .map((d) => {
      if (d.startsWith('*.')) return `shExpMatch(host, "${d}") || shExpMatch(host, "${d.slice(2)}")`;
      if (d.includes('*')) return `shExpMatch(host, "${d}")`;
      return `shExpMatch(host, "${d}") || shExpMatch(host, "*.${d}")`;
    });

  const customCondition = extraRules.length > 0 ? ` ||\n      ${extraRules.join(' ||\n      ')}` : '';

  return `// GRPROXY Smart Speed Booster PAC (Split-Routing Engine)
// Pins to fastest verified SOCKS5: ${primarySocks ? `${primarySocks.country} (${primarySocks.ip}:${primarySocks.port})` : 'Direct'}
// ZERO SPEED LOSS: 100% native 4K YouTube/Netflix/Download speed, only accelerates blocked sites.
function FindProxyForURL(url, host) {
${commonBypass}
  // 3. Blocked Services Acceleration (Telegram, Discord, X/Twitter, etc. + Added Links)
  if (shExpMatch(host, "web.telegram.org") ||
      shExpMatch(host, "*.web.telegram.org") ||
      shExpMatch(host, "*.telegram.org") ||
      shExpMatch(host, "*.telegram-cdn.org") ||
      shExpMatch(host, "*.t.me") ||
      shExpMatch(host, "t.me") ||
      shExpMatch(host, "*.telesco.pe") ||
      shExpMatch(host, "*.tdesktop.com") ||
      shExpMatch(host, "*.discord.com") ||
      shExpMatch(host, "*.discordapp.com") ||
      shExpMatch(host, "*.discord.gg") ||
      shExpMatch(host, "*.x.com") ||
      shExpMatch(host, "*.twitter.com") ||
      shExpMatch(host, "*.twimg.com") ||
      shExpMatch(host, "*.reddit.com") ||
      shExpMatch(host, "*.redd.it") ||
      shExpMatch(host, "*.medium.com")${customCondition}) {
    return "${proxyInstruction}";
  }

  // 4. Default: DIRECT native speed
  return "DIRECT";
}
`;
}
