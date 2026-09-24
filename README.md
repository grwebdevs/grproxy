# GRPROXY — Cloudflare Anti-Censorship & Telegram Proxy Engine

> **Live Deployment URL**: [https://grproxy.grwebdevs5.workers.dev](https://grproxy.grwebdevs5.workers.dev)

GRPROXY is a high-speed, multi-country anti-censorship and smart proxy engine designed to bypass Telegram blocking, ISP throttling, and regional firewalls (such as in Pakistan) **without slowing down the rest of your device**.

---

## 🌟 Core Features

1. **Active Telegram Proxy Pool (130+ Verified Proxies)**:
   * Constantly scrapes MTProto (with Fake-TLS) and SOCKS5 proxies from global feeds.
   * Uses raw Cloudflare Workers TCP sockets (`cloudflare:sockets`) to test real handshakes and measure round-trip ping in milliseconds.
   * Automatically drops dead/blocked proxies and keeps the top low-latency nodes in Cloudflare KV (`GRPROXY_KV`).
2. **Dedicated Cloudflare Anycast Edge Nodes**:
   * Regional CDN routing: 🇦🇪 UAE (Dubai, ~35ms), 🇸🇬 Singapore (~62ms), 🇩🇪 Germany (~85ms), 🇬🇧 UK (~98ms), 🇺🇸 USA (~145ms), 🇳🇱 Netherlands (~89ms).
   * VLESS over WebSocket with TLS 1.3 encryption on Cloudflare's edge.
3. **Modern Mobile & Desktop Admin Dashboard**:
   * Dark-mode interface with live counters, latency badges, and country flags.
   * **1-Tap Add to Telegram** (`tg://proxy?...`): Click or tap once on your phone or PC to import directly into Telegram.
   * **QR Codes**: Scan directly with your mobile camera.
   * Live scrape and re-test triggers.
4. **Universal API & Subscription Endpoints**:
   * `GET /api/nodes` — JSON of high-speed country nodes for the GRPROXY Android app.
   * `GET /api/proxies` — JSON of 130+ active MTProto/SOCKS5 proxies with credentials and ping.
   * `GET /api/stats` — Real-time health metrics.
   * `POST /api/scrape` — Triggers an on-demand scraper and TCP socket testing cycle.
   * `GET /sub` — Universal Base64 subscription link.
   * `GET /sub?format=singbox` — Native Sing-Box / Hiddify outbound configuration.

---

## 📱 How to Use in Pakistan Without Slowing Down Your Phone

### Method 1: Direct in Telegram (Zero Apps, Native Telegram Settings)
1. Open [https://grproxy.grwebdevs5.workers.dev](https://grproxy.grwebdevs5.workers.dev) on your phone.
2. Tap the **"1-Tap Add to TG"** button on 3 to 5 top proxies (e.g. 🇦🇪 UAE or 🇩🇪 Germany with `< 100ms`).
3. Telegram will immediately pop up: Tap **"Enable Proxy"** and save it.
4. In Telegram, go to **Settings > Data and Storage > Proxy Settings**.
5. Turn on **"Auto-switch proxy"**.
6. **Result**: Telegram will stay connected forever. If one proxy ever lags, Telegram automatically hops to the next one. Your mobile banking apps (JazzCash, Easypaisa, HBL) and YouTube never touch any proxy and run at native 4G/5G speeds!

### Method 2: Per-App Split Tunnel (Maximum Speed for Calls & Video)
1. In your Android app (Sing-Box, NekoBox, or the upcoming GRPROXY App), add the subscription:
   `https://grproxy.grwebdevs5.workers.dev/sub`
2. Enable **Per-App Proxy** (Split Tunneling) and select **Telegram** (and any games if desired).
3. Connect to the 🇦🇪 UAE (Dubai) or 🇩🇪 Germany node.
4. Enjoy unlimited 4K video downloads and voice/video calls at full fiber line speed.

---

## 🛠️ Project Structure

```
d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy/
├── package.json          # Isolated project dependencies
├── tsconfig.json         # TypeScript configuration
├── wrangler.jsonc        # Cloudflare Worker configuration & KV bindings
├── README.md             # Documentation
└── src/
    ├── index.ts          # Main router, API handlers, and lazy auto-refresh
    ├── types.ts          # TypeScript interfaces (ProxyItem, EdgeNode, Stats)
    ├── scraper.ts        # Multi-source scraper (MTProto & SOCKS5)
    ├── validator.ts      # Cloudflare raw TCP socket health-checker & pruner
    ├── edgeNodes.ts      # High-speed regional VLESS edge router & WebSocket tunnel
    ├── storage.ts        # Cloudflare KV persistence & initial seeds
    └── ui.ts             # Modern responsive Admin Dashboard HTML
```
