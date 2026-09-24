import { ProxyItem } from './types';

// Curated high-yield public sources for MTProto and SOCKS5 proxies
export const PROXY_SOURCES = [
  // MTProto specific live active sources
  { url: 'https://raw.githubusercontent.com/Argh94/Proxy-List/master/MTProto.txt', type: 'mtproto' },
  { url: 'https://raw.githubusercontent.com/ALIILAPRO/MTProtoProxy/main/mtproto.txt', type: 'mtproto' },

  // SOCKS5 specific sources
  { url: 'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt', type: 'socks5' },
  { url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt', type: 'socks5' },
  { url: 'https://raw.githubusercontent.com/prxchk/proxy-list/main/socks5.txt', type: 'socks5' },
];

/**
 * Flag / Country lookup based on IP range / known regional clusters
 */
export function getCountryInfo(ip: string): { country: string; code: string; flag: string } {
  // Common European, Asian, American server clusters
  const firstOctet = parseInt(ip.split('.')[0] || '0', 10);
  if (firstOctet >= 45 && firstOctet <= 46) return { country: 'Germany', code: 'DE', flag: '🇩🇪' };
  if (firstOctet >= 51 && firstOctet <= 54) return { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' };
  if (firstOctet >= 65 && firstOctet <= 76) return { country: 'United States', code: 'US', flag: '🇺🇸' };
  if (firstOctet >= 80 && firstOctet <= 89) return { country: 'Netherlands', code: 'NL', flag: '🇳🇱' };
  if (firstOctet >= 94 && firstOctet <= 95) return { country: 'UAE / Middle East', code: 'AE', flag: '🇦🇪' };
  if (firstOctet >= 103 && firstOctet <= 104) return { country: 'Singapore', code: 'SG', flag: '🇸🇬' };
  if (firstOctet >= 138 && firstOctet <= 149) return { country: 'Germany', code: 'DE', flag: '🇩🇪' };
  if (firstOctet >= 159 && firstOctet <= 167) return { country: 'Finland', code: 'FI', flag: '🇫🇮' };
  if (firstOctet >= 178 && firstOctet <= 188) return { country: 'France', code: 'FR', flag: '🇫🇷' };
  if (firstOctet >= 193 && firstOctet <= 195) return { country: 'Turkey', code: 'TR', flag: '🇹🇷' };
  if (firstOctet >= 209 && firstOctet <= 216) return { country: 'United States', code: 'US', flag: '🇺🇸' };
  return { country: 'Global Edge', code: 'UN', flag: '🌐' };
}

/**
 * Parses MTProto tg:// or t.me/ links
 */
export function parseMtprotoLink(line: string, sourceName = 'github'): ProxyItem | null {
  try {
    const trimmed = line.trim();
    if (!trimmed.includes('proxy?') && !trimmed.startsWith('tg://') && !trimmed.startsWith('https://t.me/')) {
      return null;
    }

    const urlStr = trimmed.replace('tg://proxy?', 'http://localhost/proxy?').replace('https://t.me/proxy?', 'http://localhost/proxy?');
    const parsed = new URL(urlStr);
    const server = parsed.searchParams.get('server');
    const portStr = parsed.searchParams.get('port');
    const secret = parsed.searchParams.get('secret');

    if (!server || !portStr || !secret) return null;
    const cleanServer = server.trim().replace(/\.+$/, '');
    if (!cleanServer) return null;
    const cleanSecret = secret.trim();
    if (!cleanSecret) return null;

    const port = parseInt(portStr, 10);
    if (isNaN(port) || port <= 0 || port > 65535) return null;

    // Reject synthetic placeholder IPs or test secrets
    if (
      cleanServer.startsWith('149.154.') ||
      cleanServer.startsWith('91.108.') ||
      cleanSecret.startsWith('ee00112233445566778899aabbccdd') ||
      cleanSecret.startsWith('ee00000000000000000000000000000000')
    ) {
      return null;
    }

    const geo = getCountryInfo(cleanServer);
    const id = `mtproto_${cleanServer}_${port}`;

    return {
      id,
      protocol: 'mtproto',
      ip: cleanServer,
      port,
      secret: cleanSecret,
      country: geo.country,
      countryCode: geo.code,
      flag: geo.flag,
      latency: 0,
      isAlive: true,
      lastChecked: Date.now(),
      source: sourceName,
      tgLink: `tg://proxy?server=${encodeURIComponent(cleanServer)}&port=${port}&secret=${encodeURIComponent(cleanSecret)}`,
    };
  } catch {
    return null;
  }
}

/**
 * Parses SOCKS5 lines (ip:port or ip:port:user:pass or socks5://...)
 */
export function parseSocks5Line(line: string, sourceName = 'github'): ProxyItem | null {
  try {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return null;

    let ip = '';
    let port = 0;
    let username: string | undefined;
    let password: string | undefined;

    if (trimmed.startsWith('socks5://')) {
      const url = new URL(trimmed);
      ip = url.hostname;
      port = parseInt(url.port || '1080', 10);
      username = url.username || undefined;
      password = url.password || undefined;
    } else {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        ip = parts[0].trim();
        port = parseInt(parts[1].trim(), 10);
        if (parts.length >= 4) {
          username = parts[2].trim();
          password = parts[3].trim();
        }
      }
    }

    // Basic IPv4 / IPv6 validation
    if (!ip || isNaN(port) || port <= 0 || port > 65535) return null;
    if (!ip.match(/^(\d{1,3}\.){3}\d{1,3}$/) && !ip.includes('.')) return null;

    const geo = getCountryInfo(ip);
    const id = `socks5_${ip}_${port}`;
    let tgLink = `tg://socks?server=${encodeURIComponent(ip)}&port=${port}`;
    if (username && password) {
      tgLink += `&user=${encodeURIComponent(username)}&pass=${encodeURIComponent(password)}`;
    }

    return {
      id,
      protocol: 'socks5',
      ip,
      port,
      username,
      password,
      country: geo.country,
      countryCode: geo.code,
      flag: geo.flag,
      latency: 0,
      isAlive: true,
      lastChecked: Date.now(),
      source: sourceName,
      tgLink,
    };
  } catch {
    return null;
  }
}

/**
 * Main scraper worker: downloads feeds and extracts deduplicated proxy candidates
 */
export async function scrapeAllSources(maxTotal = 400): Promise<ProxyItem[]> {
  const proxyMap = new Map<string, ProxyItem>();

  const scrapePromises = PROXY_SOURCES.map(async (src) => {
    try {
      const resp = await fetch(src.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GRProxyScraper/1.0)' },
        cf: { cacheTtl: 300 },
      });
      if (!resp.ok) return;
      const text = await resp.text();
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;

        if (src.type === 'mtproto') {
          const item = parseMtprotoLink(line, src.url);
          if (item && !proxyMap.has(item.id)) {
            proxyMap.set(item.id, item);
          }
        } else if (src.type === 'socks5') {
          const item = parseSocks5Line(line, src.url);
          if (item && !proxyMap.has(item.id)) {
            proxyMap.set(item.id, item);
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to scrape ${src.url}:`, err);
    }
  });

  await Promise.allSettled(scrapePromises);

  // Return up to maxTotal candidates for health check
  return Array.from(proxyMap.values()).slice(0, maxTotal);
}
