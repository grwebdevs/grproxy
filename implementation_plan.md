# GRPROXY Architecture & Implementation Plan

## Executive Summary
GRPROXY is an anti-censorship proxy ecosystem built on Cloudflare Workers. It resolves Telegram blocks, ISP throttling, and regional firewalls without decreasing client internet speed.

This release (v1.1.0) addresses three major components:
1. **Chrome Extension (Manifest V3)**:
   - Fixed `ERR_TUNNEL_CONNECTION_FAILED` by swapping dead mock IPs with a multi-tier pure SOCKS5 fallback chain (`47.245.165.201:1080`, `141.148.158.143:1080`, `66.42.224.229:41679`, `72.195.34.35:27360`, `98.178.72.21:10919`, `184.178.172.18:15280`).
   - Dynamic Toolbar States: Active vibrant emerald green shield with country badge vs muted slate gray when disconnected.
   - 3 Routing Modes: Whole Profile, Added Links Only (Smart Split), and Turn Off.
   - Persistent Auto-Reconnect on PC reboot with desktop toast notifications.
   - 100+ Cloudflare Anycast edge locations loaded dynamically from `/api/nodes`.
2. **Dashboard UI & Prominent Credentials (`src/ui.ts`)**:
   - Clear, prominent display of Host, Port, Protocol, Secret (with 1-click copy), and Auth (User/Password).
   - Event delegation with `data-copy` attributes preventing string escaping or quote syntax errors.
   - Dedicated navigation tabs: Telegram Proxies, 100+ Cloudflare Edge Locations, Chrome Extension, Android APK Download, Auto-Failover Route, and Setup Guides.
3. **Android Client APK (`app/` & `.github/workflows/build-apk.yml`)**:
   - Complete Android Gradle scaffolding committed in repo (`build.gradle`, `settings.gradle`, `AndroidManifest.xml`).
   - GitHub Actions CI workflow to compile both debug and release APKs and automatically publish to GitHub Releases for 1-tap download on Android.

---

## Architecture Blueprint

```
                      ┌───────────────────────────────────────┐
                      │          Client User Entry            │
                      ├───────────────────┬───────────────────┤
                      │  Chrome Extension │  Telegram Client  │
                      └─────────┬─────────┴─────────┬─────────┘
                                │                   │
             PAC / HTTPS / SOCKS│                   │ tg://proxy
                                ▼                   ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │               Cloudflare Workers Global Edge Network            │
   │               (https://grproxy.grwebdevs5.workers.dev)           │
   ├───────────────────────┬─────────────────┬───────────────────────┤
   │ 1. Dashboard UI (/)   │ 2. Failover API │ 3. 100+ Country Nodes │
   │    • Cyberpunk Glass  │    • /api/rotate│    • /api/nodes       │
   │    • Full Credentials │    • /rotate/tg │    • /sub (Sing-Box)  │
   │    • Config Inspector │    • /pac (Auto)│    • VLESS WebSocket  │
   │    • APK Releases Tab │    • /api/stats │    • Handshake Tests  │
   └───────────┬───────────┴────────┬────────┴───────────┬───────────┘
               │                    │                    │
               ▼                    ▼                    ▼
     ┌───────────────────┐┌───────────────────┐┌───────────────────┐
     │  Cloudflare KV    ││  TCP Socket Engine││ Chrome Extension  │
     │  (GRPROXY_KV)     ││ (Pure SOCKS5 Test)││ (Manifest V3)     │
     │  • pool_active    ││  • Live Ping ms   ││  • Speed Booster  │
     │  • pinned_state   ││  • Pruning Dead   ││  • 3-Mode Routing │
     └───────────────────┘└───────────────────┘└───────────────────┘
```
