# GRPROXY — Cloudflare Anti-Censorship, Telegram & Edge Proxy Hub

> **Live Deployment URL**: [https://grproxy.grwebdevs5.workers.dev](https://grproxy.grwebdevs5.workers.dev)  
> **Auto-Rotating Telegram URL**: [https://grproxy.grwebdevs5.workers.dev/rotate/tg](https://grproxy.grwebdevs5.workers.dev/rotate/tg)  
> **Universal Browser PAC URL**: [https://grproxy.grwebdevs5.workers.dev/pac](https://grproxy.grwebdevs5.workers.dev/pac)  
> **Sing-Box Universal Sub**: [https://grproxy.grwebdevs5.workers.dev/sub](https://grproxy.grwebdevs5.workers.dev/sub)

GRPROXY is a high-speed, multi-country anti-censorship and smart proxy engine designed to bypass Telegram blocking, ISP throttling, and regional firewalls **without slowing down the rest of your device**.

---

## 🌟 Core Features

1. **Active Telegram Proxy Pool with Full Credentials (130+ Verified Proxies)**:
   * Constantly scrapes MTProto (with Fake-TLS) and SOCKS5 proxies from global feeds.
   * Prominently displays all connection credentials on each card: Host / IP, Port, Protocol, Secret (with 1-click **Copy Secret**), and Username/Password.
   * Interactive **Credential & Config Inspector Modal** provides ready-to-use configs for Telegram Desktop, Mobile, Firefox, cURL, and Python.
   * Uses raw Cloudflare Workers TCP sockets (`cloudflare:sockets`) to test real handshakes and measure round-trip ping in milliseconds.
2. **Auto-Rotating Smart Failover Engine (Zero Churn)**:
   * Stays pinned to the fastest responding proxy as long as it works reliably.
   * Automatically hot-swaps to the next healthy proxy if the current node lags or fails, eliminating dropped voice calls and reconnect loops.
   * `GET /rotate/tg` — 1-click auto-redirect to launch Telegram with the current healthy pinned node.
   * `GET /pac` — Universal Proxy Auto-Config script for system-wide zero-slowdown browsing.
3. **100+ Countries Cloudflare Anycast Edge Network (129 Locations)**:
   * Covers 100+ countries across Middle East, Asia, Europe, Americas, Africa, and Oceania.
   * Real Cloudflare Anycast IPs with TLS 1.3 encryption and low latency (~18ms - 85ms).
   * VLESS over WebSocket relay via Cloudflare Workers TCP sockets.
4. **GRPROXY Chrome Extension (Manifest V3)**:
   * Located in `grproxy/extension/`.
   * **Smart Speed Booster (Split-Routing)**: YouTube 4K, Netflix, Twitch, downloads, and local websites run **DIRECT at 100% native fiber speed**, while only blocked websites (Telegram Web, Discord, X, Reddit) are accelerated over the Cloudflare edge.
   * Country selector with 100+ locations, live ping indicators, and 1-click connect/disconnect.
5. **Universal API & Subscription Endpoints**:
   * `GET /api/nodes` — JSON of 100+ high-speed country nodes.
   * `GET /api/proxies` — JSON of 130+ active MTProto/SOCKS5 proxies with credentials and ping.
   * `GET /api/rotate` — Live status and failover control (`?force=true` triggers manual hot-swap).
   * `GET /rotate/tg` — Instant 302 redirect into Telegram with current pinned proxy.
   * `GET /pac` — Dynamic Proxy Auto-Config script.
   * `GET /sub` — Universal Base64 and Sing-Box auto-failover outbounds subscription.

---

## 📱 How to Use (Zero Phone Slowdown)

### Method 1: 1-Click Auto-Rotating Telegram (Mobile & PC)
1. Tap or click [https://grproxy.grwebdevs5.workers.dev/rotate/tg](https://grproxy.grwebdevs5.workers.dev/rotate/tg).
2. Telegram opens automatically and asks to save the proxy. Tap **Enable Proxy**.
3. In Telegram, go to **Settings > Data and Storage > Proxy Settings** and turn on **Auto-switch proxy**.
4. Telegram stays connected forever. All other apps on your phone run at full native 4G/5G line speed.

### Method 2: GRPROXY Chrome Extension
1. In Google Chrome, Brave, or Edge, navigate to `chrome://extensions`.
2. Turn ON **Developer mode** in the top-right.
3. Click **Load unpacked** and select `d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy\extension`.
4. Click the GRPROXY icon in the browser toolbar, select **Speed Booster Mode**, pick your country, and click **CONNECT**!

### Method 3: Windows / Mac Automatic Proxy (PAC Script)
1. Open Windows **Settings > Network & internet > Proxy**.
2. Turn ON **Use setup script** and enter:
   `https://grproxy.grwebdevs5.workers.dev/pac`
3. Click **Save**. Your browser will now automatically route blocked services through GRPROXY while streaming YouTube 4K directly at native speed!

---

## 🛠️ Project Structure

```
grproxy/
├── package.json          # Dependencies & build scripts
├── tsconfig.json         # TypeScript configuration
├── wrangler.jsonc        # Cloudflare Worker configuration & KV bindings
├── implementation_plan.md# Architecture & design document
├── walkthrough.md        # User verification & API guide
├── README.md             # Project documentation
├── src/
│   ├── index.ts          # Main router & auto-failover API endpoints
│   ├── types.ts          # TypeScript interfaces (ProxyItem, EdgeNode, FailoverState)
│   ├── failover.ts       # Intelligent auto-failover engine & dynamic PAC generator
│   ├── edgeNodes.ts      # 100+ Cloudflare Anycast edge nodes & VLESS WebSocket tunnel
│   ├── scraper.ts        # Multi-source scraper (MTProto & SOCKS5)
│   ├── validator.ts      # Cloudflare raw TCP socket health-checker & pruner
│   ├── storage.ts        # Cloudflare KV persistence & initial seeds
│   └── ui.ts             # Redesigned cyberpunk dashboard HTML with visible credentials
└── extension/            # Manifest V3 Chrome Extension
    ├── manifest.json     # Manifest V3 configuration
    ├── background.js     # Service worker managing chrome.proxy & PAC routing
    ├── popup.html        # Modern extension popup interface
    ├── popup.css         # Cyberpunk emerald styling
    ├── popup.js          # 100+ countries, search, continent filters, and live ping
    ├── icons/            # 16, 48, 128 px PNG icons
    └── README.md         # Extension setup guide
```
