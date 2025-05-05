// src/worker.js
export default {
    async fetch(req, env) {
      // CORS 프리플라이트 처리
      if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
      }
  
      // ---- 파라미터 파싱 ----
      const url = new URL(req.url);
      const target    = url.searchParams.get('url');   // ex) https://playentry.org/project/123
      const name      = url.searchParams.get('name');  // ex) myData
      const isProject = /^https:\/\/playentry\.org\/project\/\d+$/i.test(target);
  
      if (!isProject || !name) {
        return json({ ok: false, error: 'INVALID_PARAM' }, 400);
      }
  
      const key = `${target}::${name}`;
  
      // ---- 데이터 로드 ----
      if (req.method === 'GET') {
        const stored = await env.ENTRY_KV.get(key);
        if (stored == null) {
          return json({ ok: false, error: 'NOT_FOUND' }, 404);
        }
        return json({ ok: true, data: JSON.parse(stored) });
      }
  
      // ---- 데이터 저장 ----
      if (req.method === 'POST') {
        let body;
        try {
          body = await req.json(); // 기대 형식: { data: ['1','2', ...] }
          if (!Array.isArray(body.data)) throw new Error();
        } catch {
          return json({ ok: false, error: 'INVALID_BODY' }, 400);
        }
  
        await env.ENTRY_KV.put(key, JSON.stringify(body.data));
        return json({ ok: true, message: 'SAVED' }, 201);
      }
  
      // 그 밖의 메서드
      return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405, {
        Allow: 'GET, POST, OPTIONS',
      });
    },
  };
  
  // ---------- 유틸 ----------
  function json(obj, status = 200, extra = {}) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json', ...extra },
    });
  }
  
  function corsHeaders() {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  