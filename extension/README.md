# GRPROXY Chrome Extension (Manifest V3)

> **High-Speed Anti-Censorship SOCKS5 Proxy & Smart Split-Routing Extension**  
> Covers 100+ verified SOCKS5 edge countries with zero speed loss split-routing, persistent auto-reconnect, and desktop notifications.

---

## ⚡ Core Features

1. **Dynamic Chrome Toolbar Icon & Visual Status Indicators**:
   * **Connected State**:
     * **Icon**: Bright emerald green (`#10b981`) and cyber cyan shield with glowing lightning bolt.
     * **Badge**: Shows the active 2-letter country code (e.g. `US`, `DE`, `AE`, `SG`) with vibrant emerald green background (`#10b981`).
     * **Tooltip**: Hovering over the extension icon displays: `GRPROXY: Connected to [Flag] [Country Name]`.
   * **Disconnected State**:
     * **Icon**: Grayscale / muted slate icon (`#64748b` / `#334155`) indicating inactive standby.
     * **Badge**: Cleared / hidden badge.
     * **Tooltip**: Hovering displays: `GRPROXY: Disconnected (Click to Connect)`.
   * **Instant Visual Distinction**: Identify connection state and active country instantly at a glance directly from Chrome's toolbar without opening the popup interface!

2. **3 Flexible Routing Modes**:
   * **Mode 1: Whole Chrome Profile**: Routes all external web traffic in your Chrome profile through high-speed SOCKS5 proxies while bypassing local intranet and router IP ranges (RFC 1918).
   * **Mode 2: Added Links Only (Smart Split-Routing)**: Routes **only** `web.telegram.org`, `*.telegram.org`, `t.me`, and custom user-added URLs through the proxy. Streaming 4K YouTube, Netflix, local banking, and general web browsing run **DIRECT at 100% full line speed**.
   * **Mode 3: Turn Off (Default DIRECT)**: Disables the proxy completely with 1 click, returning Chrome to standard direct network connectivity.

3. **Power-User Productivity Shortcuts & Context Menus**:
   * **Keyboard Shortcut**: Press `Alt+Shift+P` (or `Command+Shift+P` on Mac) anywhere in Chrome to instantly toggle proxy connection on/off.
   * **Right-Click Context Menu**:
     * Right-click anywhere -> `⚡ Toggle GRPROXY On/Off`
     * Right-click on any page or hyperlink -> `➕ Route this site through GRPROXY` to automatically add it to Split-Routing rules and enable protection.
   * **1-Click Active Tab Quick-Add**: Popup automatically detects your current browser tab hostname and offers a 1-tap `+ Add to Rules` button.
   * **1-Click SOCKS5 Copy**: Copy the active proxy `IP:Port` directly to clipboard to paste into Telegram Desktop or other external apps.
   * **Interactive Latency Check**: Click the ping badge to test live round-trip latency to the proxy network.

4. **Zero `ERR_TUNNEL_CONNECTION_FAILED` Guarantee**:
   * Chrome's proxy engine only speaks HTTP CONNECT and SOCKS5. If an MTProto proxy (Telegram's binary protocol) or a CDN IP is assigned to the browser, Chrome fails with `ERR_TUNNEL_CONNECTION_FAILED`.
   * GRPROXY strictly assigns verified live SOCKS5 endpoints with multi-tier backup failover and automatic `DIRECT` fallback.

5. **Persistent Auto-Reconnect & Desktop Toast Notifications**:
   * The active connection state is securely persisted in `chrome.storage.local`.
   * When your computer reboots or Chrome is restarted, the extension detects previous state and automatically restores your proxy settings to the previously selected country.
   * A native desktop notification is fired: `GRPROXY Connected • [Country Flag] [Country Name] Protection Active`.

6. **100+ Multi-Country SOCKS5 Locations**:
   * Real-time multi-country edge nodes across Americas, Europe, Asia, Middle East, Africa, and Oceania.
   * Live ping estimation and real-time synchronization with the Cloudflare Worker API.

7. **Custom Link & Domain Acceleration Manager**:
   * Paste any link (e.g. `https://web.telegram.org/a/`) or domain (`*.custom.org`) into the popup drawer to instantly accelerate it in Split-Routing mode.
   * "Reset Defaults" button instantly restores essential Telegram, Discord, and anti-censorship domains.

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
6. Observe the muted gray shield icon when disconnected.
7. Click the GRPROXY icon, choose your mode (Added Links Only recommended), pick any country, and click **CONNECT**!
8. Notice the icon instantly turn into a glowing bright emerald shield with the 2-letter country code badge (e.g. `US`) and hover tooltip!

---

## 🛠️ Architecture

* `manifest.json`: Manifest V3 specification with `"proxy"`, `"storage"`, `"tabs"`, `"unlimitedStorage"`, `"notifications"`, `"contextMenus"`, and `commands` shortcut.
* `background.js`: Service worker managing dynamic multi-tier SOCKS5 PAC scripts, toolbar icon & badge status synchronization, reboot auto-reconnection, context menus, and desktop notifications.
* `popup.html` / `popup.css`: Cyberpunk obsidian & emerald glassmorphism UI with 3-mode selection, live tab quick-add banner, and drawer navigation.
* `popup.js`: Controller managing SOCKS5 node pool, toolbar status updates, tab domain detection, URL sanitization, mode switching, and real-time telemetry.
