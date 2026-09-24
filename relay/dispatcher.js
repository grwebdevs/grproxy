/**
 * GRPROXY Smart Auto-Rotating Telegram Relay Dispatcher
 * ---------------------------------------------------
 * Allows Telegram on mobile or desktop to connect to a SINGLE proxy address
 * (e.g., your-server-ip:1080), while automatically rotating and hot-swapping
 * between fresh, verified upstream proxies from the GRPROXY Cloudflare Worker.
 *
 * In Telegram Mobile:
 *   Server: YOUR_SERVER_IP (or 127.0.0.1 if running on device/Termux)
 *   Port: 1080
 *   Type: SOCKS5 (No username/password)
 *
 * Zero external dependencies — runs on standard Node.js (v18+).
 */

import net from 'net';

const WORKER_URL = process.env.WORKER_URL || 'https://grproxy.grwebdevs5.workers.dev';
const LISTEN_PORT = parseInt(process.env.PORT || '1080', 10);
const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Refresh pool every 10 min

let upstreamPool = [];
let currentUpstream = null;
let stats = {
  totalConnections: 0,
  activeConnections: 0,
  failoverCount: 0,
  bytesTransferred: 0,
};

// Fallback seed proxies if worker is temporarily unreachable
const SEED_PROXIES = [
  { ip: '84.17.45.92', port: 1080, country: 'Netherlands', flag: '🇳🇱', latency: 37 },
  { ip: '144.76.107.55', port: 1080, country: 'Germany', flag: '🇩🇪', latency: 41 },
  { ip: '46.4.103.12', port: 1080, country: 'Germany', flag: '🇩🇪', latency: 43 },
  { ip: '94.130.180.201', port: 1080, country: 'Germany', flag: '🇩🇪', latency: 44 },
  { ip: '174.75.211.193', port: 4145, country: 'United States', flag: '🇺🇸', latency: 49 },
];

/**
 * Fetch latest verified proxies from GRPROXY Cloudflare Worker
 */
async function fetchUpstreamPool() {
  try {
    const res = await fetch(`${WORKER_URL}/api/proxies?protocol=socks5`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.proxies && data.proxies.length > 0) {
        upstreamPool = data.proxies;
        if (!currentUpstream || !upstreamPool.some((p) => p.ip === currentUpstream.ip)) {
          currentUpstream = upstreamPool[0];
        }
        console.log(`[GRPROXY Dispatcher] Synced ${upstreamPool.length} verified proxies from Cloudflare Worker.`);
        console.log(`[GRPROXY Dispatcher] Current Active Upstream: ${currentUpstream.flag} ${currentUpstream.country} (${currentUpstream.ip}:${currentUpstream.port})`);
        return;
      }
    }
  } catch (err) {
    console.warn(`[GRPROXY Dispatcher] Failed to sync pool from ${WORKER_URL}:`, err.message);
  }

  if (upstreamPool.length === 0) {
    upstreamPool = [...SEED_PROXIES];
    currentUpstream = upstreamPool[0];
    console.log(`[GRPROXY Dispatcher] Using ${upstreamPool.length} verified fallback seeds.`);
  }
}

/**
 * Failover to the next healthy upstream proxy
 */
function failoverToNext(failedProxy = null) {
  stats.failoverCount++;
  if (failedProxy && upstreamPool.length > 1) {
    upstreamPool = upstreamPool.filter((p) => p.ip !== failedProxy.ip);
  }

  if (upstreamPool.length > 0) {
    currentUpstream = upstreamPool[0];
  } else {
    upstreamPool = [...SEED_PROXIES];
    currentUpstream = upstreamPool[0];
  }

  console.warn(`[GRPROXY Dispatcher] ⚠️ Failover triggered! Swapped to next healthy upstream: ${currentUpstream.flag} ${currentUpstream.country} (${currentUpstream.ip}:${currentUpstream.port})`);

  // Asynchronously trigger Cloudflare worker failover sync
  fetch(`${WORKER_URL}/api/rotate?force=true&protocol=socks5`).catch(() => {});
}

/**
 * Connect to upstream SOCKS5 and negotiate target connection
 */
function connectUpstream(targetHost, targetPort, onConnected, onError) {
  let attempts = 0;
  const maxAttempts = Math.min(3, upstreamPool.length || 1);

  function tryNext() {
    attempts++;
    const proxy = currentUpstream || SEED_PROXIES[0];

    const upstreamSocket = net.createConnection({
      host: proxy.ip,
      port: proxy.port,
      timeout: 4000,
    });

    let stage = 0; // 0 = greeting sent, 1 = connect request sent

    upstreamSocket.on('connect', () => {
      // Step 1: Send SOCKS5 greeting (No authentication)
      upstreamSocket.write(Buffer.from([0x05, 0x01, 0x00]));
    });

    upstreamSocket.on('data', (chunk) => {
      if (stage === 0) {
        if (chunk[0] === 0x05 && chunk[1] === 0x00) {
          stage = 1;
          // Step 2: Send SOCKS5 CONNECT to targetHost:targetPort
          const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetHost);
          let reqBuf;
          if (isIp) {
            const octets = targetHost.split('.').map((n) => parseInt(n, 10));
            reqBuf = Buffer.alloc(10);
            reqBuf[0] = 0x05;
            reqBuf[1] = 0x01; // CONNECT
            reqBuf[2] = 0x00; // RSV
            reqBuf[3] = 0x01; // IPv4
            reqBuf[4] = octets[0];
            reqBuf[5] = octets[1];
            reqBuf[6] = octets[2];
            reqBuf[7] = octets[3];
            reqBuf.writeUInt16BE(targetPort, 8);
          } else {
            const hostBuf = Buffer.from(targetHost);
            reqBuf = Buffer.alloc(7 + hostBuf.length);
            reqBuf[0] = 0x05;
            reqBuf[1] = 0x01;
            reqBuf[2] = 0x00;
            reqBuf[3] = 0x03; // Domain name
            reqBuf[4] = hostBuf.length;
            hostBuf.copy(reqBuf, 5);
            reqBuf.writeUInt16BE(targetPort, 5 + hostBuf.length);
          }
          upstreamSocket.write(reqBuf);
        } else {
          upstreamSocket.destroy();
          handleFailure();
        }
      } else if (stage === 1) {
        if (chunk[0] === 0x05 && chunk[1] === 0x00) {
          // Success! Connection through upstream SOCKS5 established
          upstreamSocket.removeAllListeners('data');
          upstreamSocket.removeAllListeners('timeout');
          upstreamSocket.removeAllListeners('error');
          onConnected(upstreamSocket, proxy);
        } else {
          upstreamSocket.destroy();
          handleFailure();
        }
      }
    });

    function handleFailure() {
      failoverToNext(proxy);
      if (attempts < maxAttempts) {
        tryNext();
      } else {
        onError(new Error('All upstream proxies exhausted'));
      }
    }

    upstreamSocket.on('timeout', () => {
      upstreamSocket.destroy();
      handleFailure();
    });

    upstreamSocket.on('error', () => {
      handleFailure();
    });
  }

  tryNext();
}

/**
 * Start the local Dispatcher Server
 */
const server = net.createServer((clientSocket) => {
  stats.totalConnections++;
  stats.activeConnections++;

  let clientStage = 0; // 0 = waiting greeting, 1 = waiting connect request

  clientSocket.on('data', (data) => {
    if (clientStage === 0) {
      // Telegram client greeting
      if (data[0] === 0x05) {
        clientStage = 1;
        // Accept connection without authentication: [VER=0x05, METHOD=0x00]
        clientSocket.write(Buffer.from([0x05, 0x00]));
      } else {
        clientSocket.destroy();
      }
    } else if (clientStage === 1) {
      // Telegram CONNECT request
      if (data[0] === 0x05 && data[1] === 0x01) {
        clientStage = 2; // Forwarding established
        let targetHost = '';
        let targetPort = 0;

        const addrType = data[3];
        if (addrType === 0x01) {
          // IPv4
          targetHost = `${data[4]}.${data[5]}.${data[6]}.${data[7]}`;
          targetPort = data.readUInt16BE(8);
        } else if (addrType === 0x03) {
          // Domain
          const len = data[4];
          targetHost = data.toString('utf8', 5, 5 + len);
          targetPort = data.readUInt16BE(5 + len);
        }

        connectUpstream(
          targetHost,
          targetPort,
          (upstreamSocket, usedProxy) => {
            // Tell Telegram client: Connected successfully!
            const reply = Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0x04, 0x38]);
            clientSocket.write(reply);

            // Bidirectional streaming with stats tracking
            clientSocket.pipe(upstreamSocket);
            upstreamSocket.pipe(clientSocket);

            clientSocket.on('data', (d) => { stats.bytesTransferred += d.length; });
            upstreamSocket.on('data', (d) => { stats.bytesTransferred += d.length; });

            clientSocket.on('close', () => { stats.activeConnections--; upstreamSocket.destroy(); });
            upstreamSocket.on('close', () => { clientSocket.destroy(); });
            clientSocket.on('error', () => { upstreamSocket.destroy(); });
            upstreamSocket.on('error', () => { clientSocket.destroy(); });
          },
          (err) => {
            // Inform Telegram client: SOCKS5 network unreachable
            clientSocket.write(Buffer.from([0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0]));
            clientSocket.destroy();
          }
        );
      } else {
        clientSocket.destroy();
      }
    }
  });

  clientSocket.on('error', () => {});
  clientSocket.on('timeout', () => { clientSocket.destroy(); });
});

server.listen(LISTEN_PORT, '0.0.0.0', async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 GRPROXY Telegram Auto-Rotating Single Proxy Dispatcher`);
  console.log(`   Listening on: 0.0.0.0:${LISTEN_PORT}`);
  console.log(`   Cloudflare Worker: ${WORKER_URL}`);
  console.log(`======================================================\n`);
  await fetchUpstreamPool();
  setInterval(fetchUpstreamPool, REFRESH_INTERVAL_MS);
});
