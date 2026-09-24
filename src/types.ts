export type ProxyProtocol = 'mtproto' | 'socks5';

export interface ProxyItem {
  id: string;
  protocol: ProxyProtocol;
  ip: string;
  port: number;
  secret?: string;          // For MTProto (e.g. ee... or normal secret)
  username?: string;        // For SOCKS5
  password?: string;        // For SOCKS5
  country: string;
  countryCode: string;
  flag: string;
  continent?: string;
  latency: number;          // In milliseconds
  isAlive: boolean;
  lastChecked: number;      // Epoch timestamp
  source: string;
  tgLink?: string;          // tg://proxy?...
}

export interface EdgeNode {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  continent: string;
  cleanIp: string;
  port: number;
  tls: boolean;
  sni: string;
  path: string;
  uuid: string;
  pingEstimate: number;     // Approximate ms to region
  vlessLink: string;
  singboxOutbound: Record<string, unknown>;
}

export interface FailoverState {
  pinnedProxyId: string;
  protocol: ProxyProtocol;
  ip: string;
  port: number;
  secret?: string;
  username?: string;
  password?: string;
  country: string;
  countryCode?: string;
  flag: string;
  latency: number;
  pinnedAt: number;
  lastVerified: number;
  failoverCount: number;
  reason: string;
  tgLink: string;
  socksUrl?: string;
}

export interface PoolStats {
  totalScraped: number;
  totalAlive: number;
  deadPruned: number;
  avgLatency: number;
  lastScrapedAt: number;
  lastValidatedAt: number;
  countryDistribution: Record<string, number>;
}

export interface Env {
  GRPROXY_KV: KVNamespace;
  APP_NAME?: string;
  PROXY_TARGET_COUNT?: string | number;
  USER_UUID?: string;
  ADMIN_TOKEN?: string;
}
