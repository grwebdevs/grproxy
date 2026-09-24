import { connect } from 'cloudflare:sockets';
import { ProxyItem } from './types';

export interface ValidationResult {
  alive: ProxyItem[];
  deadCount: number;
  avgLatency: number;
}

export async function testTcpSocket(
  ip: string,
  port: number,
  timeoutMs = 2500,
  protocol: 'mtproto' | 'socks5' = 'mtproto'
): Promise<{ ok: boolean; latency: number }> {
  return testProxySocket(ip, port, protocol, timeoutMs);
}

/**
 * Probes a TCP socket connection using Cloudflare Workers `connect()` API.
 * For SOCKS5, sends a SOCKS5 greeting handshake (0x05 0x01 0x00) to ensure
 * it is a genuine SOCKS5 server rather than a random HTTP or closed port.
 */
export async function testProxySocket(
  ip: string,
  port: number,
  protocol: 'mtproto' | 'socks5',
  timeoutMs = 2500
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

      // Verify SOCKS5 protocol handshake
      if (protocol === 'socks5') {
        try {
          const writer = socket!.writable.getWriter();
          await writer.write(new Uint8Array([0x05, 0x01, 0x00]));
          writer.releaseLock();

          const reader = socket!.readable.getReader();
          const { value, done } = await reader.read();
          reader.releaseLock();

          if (done || !value || value[0] !== 0x05) {
            try { socket!.close(); } catch {}
            return { ok: false, latency: 9999 };
          }
        } catch {
          try { socket!.close(); } catch {}
          return { ok: false, latency: 9999 };
        }
      }

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
    if (alive.length >= targetAlive + 20) {
      break;
    }

    const batch = candidates.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (proxy) => {
        const check = await testProxySocket(proxy.ip, proxy.port, proxy.protocol);
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
