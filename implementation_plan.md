# GRPROXY Architecture & Implementation Plan

## Executive Summary
GRPROXY is an enterprise-grade, high-speed anti-censorship proxy engine built on Cloudflare Workers. It resolves Telegram blocks, ISP throttling, and regional firewalls without decreasing client internet speed.

This upgrade solves four major user requirements:
1. **Agency-Grade Dashboard Redesign with Full Credential Visibility**: Clear, prominent display of Host, Port, Protocol, Secret (with 1-click copy), and Auth (User/Password), plus an interactive configuration inspector modal.
2. **Intelligent Auto-Rotating Failover Engine**: Pins traffic to the fastest verified proxy until it drops or lags; hot-swaps to the next healthy node automatically without unnecessary churn or dropped calls.
3. **100+ Countries Cloudflare Anycast Edge Network**: Curated 110+ nodes across 100+ countries with clean Anycast IPs, flags, and estimated latencies.
4. **Manifest V3 Chrome Extension**: Custom browser extension featuring Speed Booster Split-Routing (YouTube 4K & downloads stay DIRECT at native fiber speed, only blocked sites proxied), 100+ country picker, and 1-click connect via native `chrome.proxy` API.

---

## Architecture Blueprint

```
                      ┌───────────────────────────────────────┐
                      │          Client User Entry            │
                      ├───────────────────┬───────────────────┤
                      │  Browser / Ext    │  Telegram Client  │
                      └─────────┬─────────┴─────────┬─────────┘
                                │                   │
             PAC / HTTPS / WS   │                   │ tg://proxy
                                ▼                   ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │               Cloudflare Workers Global Edge Network            │
   │               (https://grproxy.grwebdevs5.workers.dev)           │
   ├───────────────────────┬─────────────────┬───────────────────────┤
   │ 1. Dashboard UI (/)   │ 2. Failover API │ 3. 100+ Country Nodes │
   │    • Cyberpunk Glass  │    • /api/rotate│    • /api/nodes       │
   │    • Full Credentials │    • /rotate/tg │    • /sub (Sing-Box)  │
   │    • Config Inspector │    • /pac (Auto)│    • VLESS WebSocket  │
   └───────────┬───────────┴────────┬────────┴───────────┬───────────┘
               │                    │                    │
               ▼                    ▼                    ▼
     ┌───────────────────┐┌───────────────────┐┌───────────────────┐
     │  Cloudflare KV    ││  TCP Socket Engine││ Chrome Extension  │
     │  (GRPROXY_KV)     ││ (Raw Handshakes)  ││ (Manifest V3)     │
     │  • pool_active    ││  • Live Ping ms   ││  • Speed Booster  │
     │  • pinned_state   ││  • Pruning Dead   ││  • Split-Routing  │
     └───────────────────┘└───────────────────┘└───────────────────┘
```

---

## Detailed Components

### 1. Web Dashboard & Credential Visibility (`src/ui.ts`)
* **Full Credential Display**: Each proxy card now prominently displays:
  * Host / IP address with copy button.
  * Port with copy button.
  * Protocol badge (`MTProto Fake-TLS` or `SOCKS5`).
  * Secret key with monospace formatting and 1-click **Copy Secret** button.
  * Username / Password with individual copy buttons.
* **Credential & Config Inspector Modal**:
  * Step-by-step connection commands for Telegram Desktop, Mobile, Firefox manual proxy, cURL, and Python.
* **Auto-Failover Live Monitor**:
  * Real-time card showing the current pinned node, response latency, failover counter, and status.
* **100+ Country Edge Network Browser**:
  * Continent filtering (All, Middle East, Asia, Europe, Americas, Africa, Oceania) with live search and VLESS copy.
* **Chrome Extension Showcase Tab**:
  * Detailed download instructions and feature walkthrough.

### 2. Auto-Rotating Smart Failover Engine (`src/failover.ts`)
* **State Persistence in KV**: Stored under `failover_pinned_state`.
* **Zero-Churn Pinning Algorithm**:
  * Requests to `/api/rotate` check the pinned proxy's verification timestamp.
  * If verified within 2 minutes, returns immediately with 0ms overhead.
  * If older, runs a TCP socket health check (`testTcpSocket`).
  * If healthy, updates `lastVerified` and retains the pin.
  * If failed or lagged (> 2200ms), automatically selects the top healthy proxy from the verified pool, records the failover event, and hot-swaps seamlessly.
* **Dynamic Endpoints**:
  * `GET /api/rotate`: JSON with pinned proxy details (`?force=true` forces rotation).
  * `GET /rotate/tg`: 302 redirect launching Telegram directly with the healthy pinned proxy.
  * `GET /pac`: Dynamic Proxy Auto-Config script with Split-Routing rules.

### 3. 100+ Countries Cloudflare Anycast Edge Network (`src/edgeNodes.ts`)
* Expanded `REGIONAL_NODES` to **110+ nodes covering over 100 countries and territories**.
* Cloudflare Anycast IPs across `104.16.x.x` - `104.28.x.x`, `172.67.x.x`, `162.159.x.x`.
* VLESS WebSocket relay (`handleVlessWebSocket`) over Cloudflare's native `connect()` sockets.
* Enhanced `/sub` endpoint outputting Sing-Box `urltest` automatic failover outbounds.

### 4. Manifest V3 Chrome Extension (`extension/`)
* **Zero Speed Decrease Engine**:
  * Uses a dynamic PAC script generated in the background worker.
  * Local/LAN traffic -> `DIRECT`.
  * YouTube 4K, Netflix, Twitch, downloads, Speedtest -> `DIRECT` (guarantees 100% native speed).
  * Blocked domains (Telegram Web, Discord, X, Reddit) -> Accelerated over Cloudflare Anycast edge.
* **UI & Controls**:
  * Master 1-Click Connect Button with pulsing neon ring.
  * Mode Switch: Speed Booster (Split-Routing) vs Global Shield.
  * Country Drawer with 100+ countries, search bar, continent chips, and live ping badge.
  * Custom domain rules editor.
