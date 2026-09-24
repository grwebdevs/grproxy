# GRPROXY Walkthrough & User Guide

> **Live Deployment URL**: [https://grproxy.grwebdevs5.workers.dev](https://grproxy.grwebdevs5.workers.dev)  
> **Auto-Rotating Telegram URL**: [https://grproxy.grwebdevs5.workers.dev/rotate/tg](https://grproxy.grwebdevs5.workers.dev/rotate/tg)  
> **Universal Browser PAC URL**: [https://grproxy.grwebdevs5.workers.dev/pac](https://grproxy.grwebdevs5.workers.dev/pac)  
> **Sing-Box / Universal Sub**: [https://grproxy.grwebdevs5.workers.dev/sub](https://grproxy.grwebdevs5.workers.dev/sub)

---

## 🌟 What's New in this Release

### 1. Dashboard Redesign & Prominent Credentials
* **Complete Visibility**: Every MTProto and SOCKS5 proxy card now shows:
  * **IP / Host**: With quick-copy button.
  * **Port**: With quick-copy button.
  * **Secret Key**: Prominently displayed with 1-click **Copy Secret**.
  * **Auth (Username & Password)**: Explicitly displayed for SOCKS5 proxies.
* **Config Inspector Modal**: Click the ⚙️ button on any proxy card to get copy-paste ready connection parameters for Telegram Desktop, Mobile, Firefox, cURL, and Python.

### 2. Auto-Rotating Smart Failover (Zero Churn)
* Traditional rotating proxies change on every single request, dropping voice calls and breaking sessions.
* **GRPROXY's Auto-Failover Engine stays pinned** to the fastest responding proxy until it lags or fails, and only then automatically hot-swaps to the next healthy node.
* **1-Click Launch**: Bookmark [https://grproxy.grwebdevs5.workers.dev/rotate/tg](https://grproxy.grwebdevs5.workers.dev/rotate/tg) on your phone or PC. Opening it immediately imports the healthy pinned proxy into Telegram!

### 3. 100+ Cloudflare Edge Countries
* Over 110 Anycast locations across 100+ countries:
  * 🇦🇪 UAE, 🇵🇰 Pakistan, 🇸🇦 Saudi Arabia, 🇶🇦 Qatar, 🇹🇷 Turkey, 🇮🇳 India, 🇸🇬 Singapore, 🇯🇵 Japan, 🇰🇷 South Korea, 🇩🇪 Germany, 🇬🇧 UK, 🇳🇱 Netherlands, 🇫🇷 France, 🇨🇭 Switzerland, 🇺🇸 USA, 🇨🇦 Canada, 🇧🇷 Brazil, 🇦🇺 Australia, 🇿🇦 South Africa, 🇪🇬 Egypt, and 80+ more!
* Fully searchable by continent, country, city, and clean IP.

### 4. GRPROXY Chrome Extension (Manifest V3)
* Located in `grproxy/extension/`.
* **Zero Speed Loss (Speed Booster Mode)**:
  * YouTube 4K, Netflix, local Pakistani banks/apps, and high-speed downloads run **DIRECT** at full line speed (up to 1 Gbps).
  * Only blocked/restricted domains (Telegram Web, Discord, X, Reddit) are accelerated over the Cloudflare edge.
* **How to Install**:
  1. Open `chrome://extensions` in Google Chrome, Brave, or Edge.
  2. Toggle on **Developer mode** (top-right).
  3. Click **Load unpacked** (top-left).
  4. Select `d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy\extension`.
  5. Click the GRPROXY icon in Chrome toolbar, select your country, and click **CONNECT**!

---

## 🚀 Verification & Live API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Redesigned Agency-Grade Dashboard |
| `/api/proxies` | GET | Active verified pool with full credentials |
| `/api/nodes` | GET | 100+ Cloudflare edge country nodes |
| `/api/rotate` | GET | Current pinned proxy with health telemetry (`?force=true` forces hot swap) |
| `/rotate/tg` | GET | 302 Redirect directly into Telegram app |
| `/pac` | GET | Proxy Auto-Config script with Split-Routing |
| `/sub` | GET | Universal Base64 or Sing-Box failover subscription |
| `/api/scrape` | POST | Trigger background scraper & TCP socket validation |
