import { connect } from 'cloudflare:sockets';
import { EdgeNode } from './types';

// Curated high-performance clean Cloudflare edge Anycast IPs by geographic affinity
export const REGIONAL_NODES = [
  {
    id: 'ae-dxb',
    name: 'GRPROXY 🇦🇪 UAE (Dubai Edge)',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    flag: '🇦🇪',
    city: 'Dubai',
    cleanIp: '172.67.182.11',
    pingEstimate: 35,
  },
  {
    id: 'sg-sin',
    name: 'GRPROXY 🇸🇬 Singapore (Asia Edge)',
    country: 'Singapore',
    countryCode: 'SG',
    flag: '🇸🇬',
    city: 'Singapore',
    cleanIp: '104.16.24.4',
    pingEstimate: 62,
  },
  {
    id: 'de-fra',
    name: 'GRPROXY 🇩🇪 Germany (Frankfurt Hub)',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    city: 'Frankfurt',
    cleanIp: '104.17.150.10',
    pingEstimate: 85,
  },
  {
    id: 'gb-lon',
    name: 'GRPROXY 🇬🇧 UK (London Edge)',
    country: 'United Kingdom',
    countryCode: 'GB',
    flag: '🇬🇧',
    city: 'London',
    cleanIp: '104.18.28.5',
    pingEstimate: 98,
  },
  {
    id: 'us-nyc',
    name: 'GRPROXY 🇺🇸 USA (New York Global)',
    country: 'United States',
    countryCode: 'US',
    flag: '🇺🇸',
    city: 'New York',
    cleanIp: '104.21.32.1',
    pingEstimate: 145,
  },
  {
    id: 'nl-ams',
    name: 'GRPROXY 🇳🇱 Netherlands (Amsterdam)',
    country: 'Netherlands',
    countryCode: 'NL',
    flag: '🇳🇱',
    city: 'Amsterdam',
    cleanIp: '104.19.12.8',
    pingEstimate: 89,
  },
];

/**
 * Builds edge nodes with full VLESS configs and Sing-Box outbounds
 */
export function generateEdgeNodes(workerHost: string, uuid: string): EdgeNode[] {
  return REGIONAL_NODES.map((node) => {
    const vlessLink = `vless://${uuid}@${node.cleanIp}:443?encryption=none&security=tls&sni=${workerHost}&type=ws&host=${workerHost}&path=%2Fws#${encodeURIComponent(node.name)}`;

    const singboxOutbound = {
      type: 'vless',
      tag: node.id,
      server: node.cleanIp,
      server_port: 443,
      uuid: uuid,
      tls: {
        enabled: true,
        server_name: workerHost,
        utls: {
          enabled: true,
          fingerprint: 'chrome',
        },
      },
      transport: {
        type: 'ws',
        path: '/ws',
        headers: {
          Host: workerHost,
        },
      },
    };

    return {
      ...node,
      port: 443,
      tls: true,
      sni: workerHost,
      path: '/ws',
      uuid,
      vlessLink,
      singboxOutbound,
    };
  });
}

/**
 * Parses binary VLESS header and tunnels traffic over Cloudflare TCP sockets
 */
export async function handleVlessWebSocket(request: Request, validUuid: string): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [clientWs, serverWs] = Object.values(webSocketPair);

  serverWs.accept();

  // Handle stream in background
  (async () => {
    let tcpSocket: ReturnType<typeof connect> | null = null;
    let isHeaderProcessed = false;

    serverWs.addEventListener('message', async (event) => {
      try {
        const data = event.data;
        if (!(data instanceof ArrayBuffer)) {
          return;
        }

        const buffer = new Uint8Array(data);

        if (!isHeaderProcessed) {
          // Process VLESS header (minimum 18 bytes: 1 ver + 16 uuid + 1 proto + ...)
          if (buffer.length < 18) {
            serverWs.close(1002, 'VLESS header too short');
            return;
          }

          const version = buffer[0];
          // Check UUID
          const uuidBytes = buffer.slice(1, 17);
          const clientUuidHex = Array.from(uuidBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          const expectedUuidHex = validUuid.replace(/-/g, '').toLowerCase();

          if (clientUuidHex !== expectedUuidHex) {
            serverWs.close(1008, 'Unauthorized UUID');
            return;
          }

          let offset = 17;
          const protoAddonLen = buffer[offset++];
          offset += protoAddonLen; // Skip addons

          const command = buffer[offset++]; // 1 = TCP, 2 = UDP
          const port = (buffer[offset] << 8) | buffer[offset + 1];
          offset += 2;

          const addressType = buffer[offset++];
          let address = '';

          if (addressType === 1) {
            // IPv4 (4 bytes)
            address = `${buffer[offset++]}.${buffer[offset++]}.${buffer[offset++]}.${buffer[offset++]}`;
          } else if (addressType === 2) {
            // Domain (1 byte len + string)
            const domainLen = buffer[offset++];
            address = new TextDecoder().decode(buffer.slice(offset, offset + domainLen));
            offset += domainLen;
          } else if (addressType === 3) {
            // IPv6 (16 bytes)
            const ipv6Parts: string[] = [];
            for (let i = 0; i < 8; i++) {
              ipv6Parts.push(((buffer[offset++] << 8) | buffer[offset++]).toString(16));
            }
            address = ipv6Parts.join(':');
          } else {
            serverWs.close(1002, 'Unsupported address type');
            return;
          }

          // Acknowledge VLESS header to client: [version, 0]
          serverWs.send(new Uint8Array([version, 0]));

          // Connect outbound TCP socket to destination
          tcpSocket = connect({ hostname: address, port });
          await tcpSocket.opened;

          isHeaderProcessed = true;

          // Send any remaining payload in first chunk
          const rawPayload = buffer.slice(offset);
          if (rawPayload.length > 0) {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(rawPayload);
            writer.releaseLock();
          }

          // Pipe TCP socket readable -> WebSocket client
          (async () => {
            const reader = tcpSocket!.readable.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  serverWs.send(value);
                }
              }
            } catch {
              // Pipe closed
            } finally {
              serverWs.close();
            }
          })();
        } else {
          // Streaming subsequent packets from WebSocket to TCP socket
          if (tcpSocket) {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(buffer);
            writer.releaseLock();
          }
        }
      } catch (err) {
        console.warn('VLESS Relay Error:', err);
        serverWs.close(1011, 'Internal proxy error');
        if (tcpSocket) {
          try {
            tcpSocket.close();
          } catch {
            // ignore
          }
        }
      }
    });

    serverWs.addEventListener('close', () => {
      if (tcpSocket) {
        try {
          tcpSocket.close();
        } catch {
          // ignore
        }
      }
    });
  })();

  return new Response(null, {
    status: 101,
    webSocket: clientWs,
  });
}
