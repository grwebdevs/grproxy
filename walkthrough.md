# GRPROXY Walkthrough & User Guide

> **Live Deployment URL**: [https://grproxy.grwebdevs5.workers.dev](https://grproxy.grwebdevs5.workers.dev)  
> **Auto-Rotating Telegram URL**: [https://grproxy.grwebdevs5.workers.dev/rotate/tg](https://grproxy.grwebdevs5.workers.dev/rotate/tg)  
> **Universal Browser PAC URL**: [https://grproxy.grwebdevs5.workers.dev/pac](https://grproxy.grwebdevs5.workers.dev/pac)  
> **Sing-Box / Universal Sub**: [https://grproxy.grwebdevs5.workers.dev/sub](https://grproxy.grwebdevs5.workers.dev/sub)  
> **Android APK Releases**: [https://github.com/grwebdevs/grproxy/releases](https://github.com/grwebdevs/grproxy/releases)  
> **Chrome Extension Path**: `d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy\extension`

---

## 🌟 Comprehensive Improvements & Fixes in v1.1.0

### 1. Chrome Extension (Manifest V3)
* **Resolved `ERR_TUNNEL_CONNECTION_FAILED`**:
  * Scraped dead mock IPs were removed and replaced with a multi-tier pure SOCKS5 fallback chain (`47.245.165.201:1080`, `141.148.158.143:1080`, `66.42.224.229:41679`, `72.195.34.35:27360`, `98.178.72.21:10919`, `184.178.172.18:15280`).
  * Removed the `SOCKS` keyword (which forced buggy SOCKS4 negotiation) in favor of pure `SOCKS5`.
  * Expanded Telegram Web rules to include all subdomains, CDNs, and WebSockets: `web.telegram.org`, `*.web.telegram.org`, `*.telegram.org`, `*.telegram-cdn.org`, `t.me`, `*.t.me`, `telesco.pe`, `*.telesco.pe`.
* **Dynamic Toolbar States (Immediate Visual Distinction)**:
  * **Connected**: Bright emerald green shield icon (`icons/icon-active-*.png`) + 2-letter country code badge (`US`, `DE`, `FR`, `UN`) with emerald background (`#10b981`) + Tooltip showing active country and mode.
  * **Disconnected**: Muted slate gray shield icon (`icons/icon-inactive-*.png`) + cleared badge text + Tooltip "GRPROXY: Disconnected (Click to Connect)".
* **3 Distinct Routing Modes**:
  1. **Added Links Only (Smart Split)** *(Default)*: Only accelerates `web.telegram.org`, Discord, and custom added URLs. YouTube 4K, Netflix, local Pakistani banks, and downloads run at 100% native speed (zero speed loss!).
  2. **Whole Chrome Profile**: Routes all browser profile traffic through the verified SOCKS5 proxy chain.
  3. **Turn Off**: Disables proxy and restores Chrome to system direct connection.
* **Persistent Auto-Reconnect & Desktop Toast Notifications**:
  * Listens to `chrome.runtime.onStartup`: Upon computer reboot or Chrome launch, if previously connected, it immediately restores proxy routing and displays a desktop toast notification: *"GRPROXY Auto-Reconnected • Protection Active"*.
* **100+ Cloudflare Edge Locations**:
  * Dynamically queries `/api/nodes` to populate 100+ Cloudflare Anycast edge locations in the country drawer with flags, cities, and live ping estimates.
* **Active Tab Detection & Quick Add**:
  * Automatically detects the active tab domain (e.g. `web.telegram.org`) with a 1-click **[+ Add to Rules]** button.

### 2. Website & Dashboard Redesign (`src/ui.ts`)
* **Prominent, Unmissable Credentials on Every Card**:
  * **Server IP**: Displayed with 1-click **[copy]** button.
  * **Port**: Monospace badge with 1-click **[copy]** button.
  * **Protocol**: MTProto or SOCKS5 badge.
  * **Secret Key / Auth**:
    * MTProto: Full secret key in high-contrast monospace font with dedicated **[📋 Copy Secret]** button.
    * SOCKS5: `Open Direct SOCKS5` or Username/Password with dedicated **[📋 Copy Auth]** button.
  * **Action Buttons**:
    * **[✈️ 1-Tap Connect]**: Direct link into Telegram (`tg://proxy?...`).
    * **[⚙️ Full Specs]**: Opens detailed modal with copy-paste connection parameters for Telegram Desktop, Mobile, Firefox, cURL, and Python.
    * **[📱 QR Code]**: Generates instant QR code for camera scanning on mobile.
    * **[📋 Copy All]**: Copies full formatted connection details to clipboard.
* **Event Delegation (Zero String Escaping Bugs)**:
  * Uses `data-copy`, `data-id`, and `data-qr` attributes to prevent any quote or newline syntax errors.
* **Dedicated Navigation Tabs**:
  * **✈️ Telegram Proxies**: 130+ active proxies with instant search, country filter dropdown, latency filter, and protocol pills.
  * **🌍 100+ Cloudflare Edge Locations**: Anycast edge nodes with continent chips, clean IPs, and Sing-Box / V2Ray subscription copy button.
  * **🧩 Chrome Extension**: Overview, mode explanation, and 60-second setup guide.
  * **📱 Android APK**: Direct download links for debug & release APKs and mobile QR scanner.
  * **🔄 Auto-Failover Route**: Live pinned healthy proxy with PAC URL and force hot-swap.
  * **📖 Setup Guides**: Step-by-step instructions for Android, iPhone, Windows, Mac, Linux.

### 3. Android APK & GitHub Actions CI (`app/` & `.github/workflows/build-apk.yml`)
* **Complete Android Gradle Scaffolding**:
  * Scaffolded `android/build.gradle`, `android/settings.gradle`, `android/app/build.gradle`, `android/gradle.properties`, and `AndroidManifest.xml` with `INTERNET` and `ACCESS_NETWORK_STATE` permissions.
* **Reliable GitHub Actions Workflow**:
  * Set up Java 17 and Flutter stable.
  * Builds both `app-debug.apk` and `app-release.apk`.
  * Uploads downloadable artifacts to the GitHub Actions run.
  * Automatically creates a GitHub Release tagged `v1.1.0` with the APK files attached so users can download directly to their phone with 1 tap.

---

## 🛠️ How to Test & Verify

### 1. Test Chrome Extension
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top right.
3. Click **Load unpacked** (or click the reload icon on the existing unpacked extension).
4. Select `d:\GR WEB DEVS\Cloudflare workers TOOLS BUILDS\New ideas\grproxy\extension`.
5. Notice the extension toolbar icon:
   * When disconnected: Muted slate gray shield.
   * Click the icon, select **Added Links Only (Smart Split)** or **Whole Chrome Profile**, and click **CONNECT**.
   * The toolbar icon immediately changes to a vibrant emerald green shield with country code badge (e.g. `UN`, `DE`, `US`).
6. Visit `https://web.telegram.org/`:
   * It loads seamlessly through the verified SOCKS5 proxy chain without `ERR_TUNNEL_CONNECTION_FAILED`.
7. Visit `https://www.youtube.com/`:
   * Streams at full native line speed directly (0% speed loss!).

### 2. Test Website Dashboard
1. Open `https://grproxy.grwebdevs5.workers.dev/`.
2. Inspect any proxy card:
   * IP, Port, Protocol, and Secret Key are prominently displayed.
   * Click **[📋 Copy Secret]** or **[copy]** on IP: Toast notification confirms "Copied to clipboard! ✓".
   * Click **[✈️ 1-Tap Connect]**: Prompts to launch Telegram directly.
   * Click **[📱 QR Code]**: Displays QR code for phone scanning.
3. Switch between tabs: Telegram Proxies, 100+ Cloudflare Edge Locations, Chrome Extension, Android APK, Auto-Failover, and Setup Guides.

### 3. Test Android APK Release
1. Visit `https://github.com/grwebdevs/grproxy/releases`.
2. Download `app-debug.apk` directly to an Android phone.
3. Install and run GRPROXY: It syncs with Cloudflare Anycast edge locations and supports Per-App Split Tunneling.
