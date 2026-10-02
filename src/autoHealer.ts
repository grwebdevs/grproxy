import { Env, ProxyItem } from './types';
import { getActivePool, saveActivePool, generateSeedProxies } from './storage';
import { testProxySocket, validateProxies } from './validator';
import { scrapeAllSources } from './scraper';
import { getOrRotatePinnedProxy } from './failover';

export interface HealthReport {
  timestamp: number;
  checkedCount: number;
  prunedCount: number;
  freshCount: number;
  activeCount: number;
  avgLatency: number;
  status: string;
}

/**
 * Continuous Self-Healing & Replenishment Engine:
 * 1. Probes active pool proxies with strict latency thresholds (<850ms).
 * 2. Prunes dead, lagging, or unreachable proxies immediately.
 * 3. Scrapes and validates fresh candidates across countries (DE, TW, KR, EE, US, etc.).
 * 4. Replenishes pool back to high capacity with lowest ping nodes.
 * 5. Rotates pinned Telegram MTProto and Chrome SOCKS5 proxies to the healthiest available nodes.
 */
export async function pruneAndReplenishPool(env: Env): Promise<HealthReport> {
  const currentPool = await getActivePool(env);
  const checkedAlive: ProxyItem[] = [];
  let prunedCount = 0;
  let totalLatency = 0;

  // Sample existing pool in small batches (strictly respecting Cloudflare socket limits)
  const BATCH_SIZE = 6;
  const toCheck = currentPool.slice(0, 30);

  for (let i = 0; i < toCheck.length; i += BATCH_SIZE) {
    const chunk = toCheck.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      chunk.map(async (p) => {
        const res = await testProxySocket(p.ip, p.port, p.protocol, 1500);
        return { p, res };
      })
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.res.ok && r.value.res.latency < 850) {
        const item = r.value.p;
        item.latency = r.value.res.latency;
        item.lastChecked = Date.now();
        item.isAlive = true;
        checkedAlive.push(item);
        totalLatency += item.latency;
      } else {
        prunedCount++;
      }
    }
  }

  // Preserve remainder of existing pool that wasn't tested in this cycle
  const untestedRemainder = currentPool.slice(30);
  const poolMap = new Map<string, ProxyItem>();

  for (const item of checkedAlive) poolMap.set(item.id, item);
  for (const item of untestedRemainder) {
    if (!poolMap.has(item.id)) poolMap.set(item.id, item);
  }

  let finalPool = Array.from(poolMap.values());
  let freshCount = 0;

  // If pool dropped below 35, scrape fresh candidates to replenish
  if (finalPool.length < 35) {
    try {
      const candidates = await scrapeAllSources(40);
      const valResult = await validateProxies(candidates, 25, 6);
      for (const fresh of valResult.alive) {
        if (!poolMap.has(fresh.id)) {
          poolMap.set(fresh.id, fresh);
          freshCount++;
        }
      }
      finalPool = Array.from(poolMap.values());
    } catch (err) {
      console.warn('[AutoHealer] Candidate scrape replenishment notice:', err);
    }
  }

  // Guarantee seed proxies as unbreakable safety net
  if (finalPool.length < 20) {
    const seeds = generateSeedProxies();
    for (const s of seeds) {
      if (!poolMap.has(s.id)) {
        poolMap.set(s.id, s);
      }
    }
    finalPool = Array.from(poolMap.values());
  }

  // Sort by lowest latency (fastest first)
  finalPool.sort((a, b) => a.latency - b.latency);

  // Persist updated healthy pool to KV
  await saveActivePool(env, finalPool, prunedCount);

  // Auto-rotate pinned proxies to the freshest healthy nodes
  await Promise.allSettled([
    getOrRotatePinnedProxy(env, { force: true, protocol: 'mtproto' }),
    getOrRotatePinnedProxy(env, { force: true, protocol: 'socks5' }),
  ]);

  const avgLatency = checkedAlive.length > 0 ? Math.round(totalLatency / checkedAlive.length) : 0;

  const report: HealthReport = {
    timestamp: Date.now(),
    checkedCount: toCheck.length,
    prunedCount,
    freshCount,
    activeCount: finalPool.length,
    avgLatency,
    status: `Auto-healed: Pruned ${prunedCount} dead/lagging, Added ${freshCount} fresh, Total healthy: ${finalPool.length}`,
  };

  try {
    await env.GRPROXY_KV.put('pool_health_report', JSON.stringify(report), { expirationTtl: 86400 });
  } catch {}

  return report;
}
