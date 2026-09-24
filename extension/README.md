# GRPROXY Chrome Extension (Manifest V3)

> **World's First Speed-Boosting Anti-Censorship Proxy Extension**  
> Covers 100+ Cloudflare Anycast edge countries with zero speed loss split-routing.

---

## ⚡ Core Features

1. **Smart Speed Booster (Split-Routing)**:
   * **Zero Speed Decrease**: Only proxies restricted/blocked services (Telegram Web, Discord, X/Twitter, Reddit, etc.) over Cloudflare's ultra-low latency Anycast network.
   * Streaming 4K YouTube, Netflix, Twitch, downloads, and local websites run **DIRECT at 100% native fiber/4G line speed**.
2. **100+ Cloudflare Edge Countries**:
   * One-click hop across 100+ countries and territories across Middle East, Asia, Europe, Americas, Africa, and Oceania.
   * Real-time Anycast ping telemetry.
3. **Native Chrome Proxy API**:
   * Built on Manifest V3 `chrome.proxy` API.
   * Clean PAC script auto-generation.
   * Safe disconnect with immediate system fallback.
4. **Custom Split-Routing Rules**:
   * Add any custom domain with 1-click in the popup to include it in the accelerated tunnel.

---

## 🚀 How to Install in Google Chrome / Brave / Edge / Opera

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions` in Edge).
2. Enable the **"Developer mode"** toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left toolbar.
4. Select the `extension` folder inside this repository:
   ```
   d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy\extension
   ```
5. Click the puzzle icon in Chrome and **Pin** GRPROXY to your toolbar.
6. Click the GRPROXY icon, choose your mode (Speed Booster recommended), pick any of the 100+ countries, and click **CONNECT**!

---

## 🛠️ Architecture

* `manifest.json`: Manifest V3 specification with `"proxy"`, `"storage"`, and `"tabs"` permissions.
* `background.js`: Background Service Worker managing dynamic PAC scripts and state synchronization.
* `popup.html` / `popup.css`: Cyberpunk obsidian & emerald glassmorphism UI.
* `popup.js`: Offline database of 110+ Cloudflare edge nodes, live ping measurement, and custom domain rule editor.
