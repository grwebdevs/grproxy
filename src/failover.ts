import { Env, FailoverState, ProxyItem } from './types';
import { getActivePool } from './storage';
import { testTcpSocket } from './validator';

const PINNED_KEY = 'failover_pinned_state';

/**
 * Intelligent Auto-Failover Proxy Manager:
 * Stays pinned to the current best verified proxy as long as it responds quickly.
 * Only hot-swaps to the next healthy proxy if the current one drops or lags.
 */
export async function getOrRotatePinnedProxy(
  env: Env,
  options?: { force?: boolean; protocol?: 'mtproto' | 'socks5' }
): Promise<FailoverState> {
  let existingState: FailoverState | null = null;

  try {
    const raw = await env.GRPROXY_KV.get(PINNED_KEY, 'json');
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
            await env.GRPROXY_KV.put(PINNED_KEY, JSON.stringify(existingState), { expirationTtl: 86400 * 7 });
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
  const selected: ProxyItem = candidates[0] || pool[0];

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
    await env.GRPROXY_KV.put(PINNED_KEY, JSON.stringify(newState), { expirationTtl: 86400 * 7 });
  } catch (err) {
    console.warn('Failed to save updated pinned proxy to KV:', err);
  }

  return newState;
}

/**
 * Generates an intelligent Proxy Auto-Config (PAC) script
 * Features:
 * - Smart Split-Routing: Heavy traffic (YouTube, Netflix, Speedtest, Twitch, local LAN) goes DIRECT at 100% full fiber speed.
 * - Blocked services (Telegram, Discord, X, etc.) route through the pinned auto-failover proxy.
 */
export function generatePacScript(pinned: FailoverState, mode: 'split' | 'all' = 'split'): string {
  const proxyInstruction =
    pinned.protocol === 'socks5'
      ? `SOCKS5 ${pinned.ip}:${pinned.port}; SOCKS ${pinned.ip}:${pinned.port}; DIRECT`
      : `DIRECT`; // MTProto is Telegram specific, browser PAC falls back to DIRECT or SOCKS5 fallback

  if (mode === 'all') {
    return `// GRPROXY Universal Proxy Auto-Config (Global Mode)
// Pinned Target: ${pinned.country} (${pinned.ip}:${pinned.port}) - Failover #${pinned.failoverCount}
function FindProxyForURL(url, host) {
  if (isPlainHostName(host) ||
      shExpMatch(host, "*.local") ||
      isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
      isInNet(dnsResolve(host), "172.16.0.0", "255.240.0.0") ||
      isInNet(dnsResolve(host), "192.168.0.0", "255.255.0.0") ||
      isInNet(dnsResolve(host), "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }
  return "${proxyInstruction}";
}
`;
  }

  return `// GRPROXY Smart Speed Booster PAC (Split-Routing Engine)
// Pins to fastest proxy: ${pinned.country} (${pinned.ip}:${pinned.port})
// ZERO SPEED LOSS: 100% native 4K YouTube/Netflix/Download speed, only accelerates blocked sites.
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

  // 2. High-Bandwidth Direct Bypass (Never proxy videos or gaming - runs at maximum fiber/4G line speed)
  if (shExpMatch(host, "*.googlevideo.com") ||
      shExpMatch(host, "*.youtube.com") ||
      shExpMatch(host, "*.ytimg.com") ||
      shExpMatch(host, "*.netflix.com") ||
      shExpMatch(host, "*.nflxvideo.net") ||
      shExpMatch(host, "*.speedtest.net") ||
      shExpMatch(host, "*.steamcontent.com") ||
      shExpMatch(host, "*.fast.com") ||
      shExpMatch(host, "*.cloudflare.com") ||
      shExpMatch(host, "*.workers.dev")) {
    return "DIRECT";
  }

  // 3. Blocked Services Acceleration (Telegram, Discord, X/Twitter, etc.)
  if (shExpMatch(host, "*.telegram.org") ||
      shExpMatch(host, "*.t.me") ||
      shExpMatch(host, "web.telegram.org") ||
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
      shExpMatch(host, "*.medium.com")) {
    return "${proxyInstruction}";
  }

  // 4. Default: DIRECT native speed
  return "DIRECT";
}
`;
}
