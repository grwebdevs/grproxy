import { Env } from './types';
import { getActivePool, saveActivePool, getPoolStats } from './storage';
import { scrapeAllSources } from './scraper';
import { validateProxies } from './validator';
import { generateEdgeNodes, handleVlessWebSocket } from './edgeNodes';
import { renderDashboardHtml } from './ui';
import { getOrRotatePinnedProxy, generatePacScript } from './failover';

export default {
  /**
   * Main HTTP request handler
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = url.host;
    const userUuid = env.USER_UUID || 'd342d11e-d424-4583-b36e-524ab1f0afa4';

    // 1. WebSocket VLESS Edge Relay Handler
    if (request.headers.get('Upgrade') === 'websocket' || url.pathname === '/ws') {
      return handleVlessWebSocket(request, userUuid);
    }

    // CORS Headers for API calls
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Web Admin Dashboard
    if (url.pathname === '/' || url.pathname === '') {
      const [pool, stats, pinned] = await Promise.all([
        getActivePool(env),
        getPoolStats(env),
        getOrRotatePinnedProxy(env),
      ]);

      // Auto-refresh pool in background if older than 15 minutes
      if (Date.now() - (stats.lastScrapedAt || 0) > 15 * 60 * 1000) {
        ctx.waitUntil(
          (async () => {
            try {
              const candidates = await scrapeAllSources(200);
              const validation = await validateProxies(candidates, 120);
              let finalPool = validation.alive;
              if (finalPool.length < 50) {
                const map = new Map<string, typeof pool[0]>();
                for (const item of pool) map.set(item.id, item);
                for (const item of finalPool) map.set(item.id, item);
                finalPool = Array.from(map.values()).slice(0, 130);
                finalPool.sort((a, b) => a.latency - b.latency);
              }
              await saveActivePool(env, finalPool, validation.deadCount);
            } catch (err) {
              console.warn('Background auto-refresh failed:', err);
            }
          })()
        );
      }

      const edgeNodes = generateEdgeNodes(host, userUuid);
      const html = renderDashboardHtml(pool, edgeNodes, stats, host, pinned);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    // 3. API: High-Speed 100+ Country Edge Nodes (for GRPROXY Extension & Android App)
    if (url.pathname === '/api/nodes') {
      const edgeNodes = generateEdgeNodes(host, userUuid);
      return new Response(
        JSON.stringify(
          {
            success: true,
            count: edgeNodes.length,
            nodes: edgeNodes,
          },
          null,
          2
        ),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 4. API: Telegram & Browser 100+ Active Verified Proxies Pool with full credentials
    if (url.pathname === '/api/proxies') {
      const pool = await getActivePool(env);
      const protocol = url.searchParams.get('protocol');
      const country = url.searchParams.get('country');
      let filtered = pool;
      if (protocol) {
        filtered = filtered.filter((p) => p.protocol === protocol);
      }
      if (country) {
        const cLower = country.toLowerCase();
        filtered = filtered.filter((p) => p.country.toLowerCase().includes(cLower) || p.countryCode.toLowerCase() === cLower);
      }
      return new Response(
        JSON.stringify(
          {
            success: true,
            total: filtered.length,
            proxies: filtered,
          },
          null,
          2
        ),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 5. API: System Health & Pool Stats
    if (url.pathname === '/api/stats') {
      const stats = await getPoolStats(env);
      return new Response(JSON.stringify({ success: true, stats }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 6. API: Auto-Rotating Smart Failover Proxy Endpoint
    // Stays pinned to the current working proxy; only hot-swaps on lag or failure
    if (url.pathname === '/api/rotate') {
      const force = url.searchParams.get('force') === 'true';
      const protocolParam = url.searchParams.get('protocol');
      const protocol = protocolParam === 'mtproto' || protocolParam === 'socks5' ? protocolParam : undefined;

      const pinned = await getOrRotatePinnedProxy(env, { force, protocol });
      return new Response(
        JSON.stringify(
          {
            success: true,
            message: 'Auto-rotating proxy pinned until failure (zero unnecessary churn)',
            pinned,
          },
          null,
          2
        ),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // 7. Auto-Rotating 1-Click Telegram Direct Launch (/rotate/tg or /tg/auto)
    if (url.pathname === '/rotate/tg' || url.pathname === '/tg/auto') {
      const force = url.searchParams.get('force') === 'true';
      const pinned = await getOrRotatePinnedProxy(env, { force, protocol: 'mtproto' });
      return Response.redirect(pinned.tgLink, 302);
    }

    // 8. Dynamic Proxy Auto-Config (PAC) Script (/pac)
    // Supports Smart Speed Booster Split-Routing or Global Routing with multi-tier SOCKS5 failover
    if (url.pathname === '/pac') {
      const modeParam = url.searchParams.get('mode');
      const mode = modeParam === 'all' ? 'all' : 'split';
      const [pool, pinned] = await Promise.all([
        getActivePool(env),
        getOrRotatePinnedProxy(env, { protocol: 'socks5' }),
      ]);
      const pacCode = generatePacScript(pinned, mode, pool);
      return new Response(pacCode, {
        headers: {
          'Content-Type': 'application/x-ns-proxy-autoconfig;charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders,
        },
      });
    }

    // 9. API: Trigger Scrape & Validation
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      try {
        const candidates = await scrapeAllSources(300);
        const validation = await validateProxies(candidates, 120);

        let finalPool = validation.alive;
        if (finalPool.length < 50) {
          const existing = await getActivePool(env);
          const map = new Map<string, typeof existing[0]>();
          for (const item of existing) map.set(item.id, item);
          for (const item of finalPool) map.set(item.id, item);
          finalPool = Array.from(map.values()).slice(0, 130);
          finalPool.sort((a, b) => a.latency - b.latency);
        }

        const savedStats = await saveActivePool(env, finalPool, validation.deadCount);
        // Refresh pinned proxy with the freshest candidate
        await getOrRotatePinnedProxy(env, { force: true });

        return new Response(
          JSON.stringify({
            success: true,
            aliveCount: finalPool.length,
            prunedCount: validation.deadCount,
            avgLatency: savedStats.avgLatency,
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ success: false, error: (err as Error).message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // 10. Universal Subscription Endpoint (Sing-Box / Clash / V2Ray)
    if (url.pathname === '/sub') {
      const edgeNodes = generateEdgeNodes(host, userUuid);
      const format = url.searchParams.get('format');

      if (format === 'singbox' || request.headers.get('User-Agent')?.toLowerCase().includes('sing-box')) {
        const nodeTags = edgeNodes.map((n) => n.id);
        const singboxConfig = {
          outbounds: [
            {
              type: 'urltest',
              tag: 'auto-fastest-failover',
              outbounds: nodeTags,
              url: 'https://cp.cloudflare.com/generate_204',
              interval: '3m',
              tolerance: 50,
            },
            {
              type: 'selector',
              tag: 'proxy-select',
              outbounds: ['auto-fastest-failover', ...nodeTags, 'direct'],
              default: 'auto-fastest-failover',
            },
            ...edgeNodes.map((n) => n.singboxOutbound),
            {
              type: 'direct',
              tag: 'direct',
            },
          ],
        };
        return new Response(JSON.stringify(singboxConfig, null, 2), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Default: Standard Base64 subscription containing all 100+ edge nodes
      const vlessLinks = edgeNodes.map((n) => n.vlessLink).join('\n');
      const b64 = btoa(unescape(encodeURIComponent(vlessLinks)));
      return new Response(b64, {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Subscription-Userinfo': 'upload=0; download=0; total=1073741824000; expire=0',
          ...corsHeaders,
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Scheduled Cron Trigger (every 15 min)
   * Scrapes, validates via raw TCP sockets, prunes dead proxies, and updates KV
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          console.log('[CRON] Starting GRPROXY automated scrape and validation pass...');
          const candidates = await scrapeAllSources(300);
          const validation = await validateProxies(candidates, 120);

          let finalPool = validation.alive;
          if (finalPool.length < 50) {
            const existing = await getActivePool(env);
            const map = new Map<string, typeof existing[0]>();
            for (const item of existing) map.set(item.id, item);
            for (const item of finalPool) map.set(item.id, item);
            finalPool = Array.from(map.values()).slice(0, 130);
            finalPool.sort((a, b) => a.latency - b.latency);
          }

          await saveActivePool(env, finalPool, validation.deadCount);
          // Check and update pinned proxy if needed
          await getOrRotatePinnedProxy(env);
          console.log(`[CRON] Pass complete. Active pool: ${finalPool.length}, Pruned: ${validation.deadCount}`);
        } catch (err) {
          console.error('[CRON] Automated scrape pass failed:', err);
        }
      })()
    );
  },
};
