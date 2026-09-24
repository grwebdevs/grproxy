import { connect } from 'cloudflare:sockets';
import { ProxyItem } from './types';

export interface ValidationResult {
  alive: ProxyItem[];
  deadCount: number;
  avgLatency: number;
}

/**
 * Probes a TCP socket connection using Cloudflare Workers `connect()` API
 * Measures round-trip time and verifies socket establishment.
 */
export async function testTcpSocket(
  ip: string,
  port: number,
  timeoutMs = 2200
): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  let socket: ReturnType<typeof connect> | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  try {
    socket = connect({ hostname: ip, port });

    const timeoutPromise = new Promise<{ ok: boolean; latency: number }>((_, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error('Socket timeout')), timeoutMs);
    });

    const checkPromise = (async () => {
      await socket!.opened;
      const latency = Date.now() - start;

      // Close cleanly
      try {
        socket!.close();
      } catch {
        // ignore close errors
      }

      return { ok: true, latency };
    })();

    const res = await Promise.race([checkPromise, timeoutPromise]);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    return res;
  } catch {
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (socket) {
      try {
        socket.close();
      } catch {
        // ignore
      }
    }
    return { ok: false, latency: 9999 };
  }
}

/**
 * Validates a list of proxies in concurrency-controlled batches
 * to prevent hitting Cloudflare Worker connection limits.
 */
export async function validateProxies(
  candidates: ProxyItem[],
  targetAlive = 100,
  batchSize = 12
): Promise<ValidationResult> {
  const alive: ProxyItem[] = [];
  let deadCount = 0;
  let totalLatency = 0;

  // Process in small batches
  for (let i = 0; i < candidates.length; i += batchSize) {
    // If we've already achieved target active count with great latency, we can complete early
    if (alive.length >= targetAlive + 20) {
      break;
    }

    const batch = candidates.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (proxy) => {
        const check = await testTcpSocket(proxy.ip, proxy.port);
        return { proxy, check };
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        const { proxy, check } = res.value;
        if (check.ok && check.latency < 2500) {
          proxy.isAlive = true;
          proxy.latency = check.latency;
          proxy.lastChecked = Date.now();
          alive.push(proxy);
          totalLatency += check.latency;
        } else {
          deadCount++;
        }
      } else {
        deadCount++;
      }
    }
  }

  // Sort by lowest latency (fastest first)
  alive.sort((a, b) => a.latency - b.latency);

  const avgLatency = alive.length > 0 ? Math.round(totalLatency / alive.length) : 0;

  return {
    alive,
    deadCount,
    avgLatency,
  };
}
