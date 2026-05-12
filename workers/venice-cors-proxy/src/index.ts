/**
 * Прокси к Venice breakdown с заголовком Access-Control-Allow-Origin: *
 * для любого браузерного Origin. Задеплойте: `cd workers/venice-cors-proxy && npx wrangler deploy`
 */
type Env = {
  VENICE_UPSTREAM_URL: string
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (req.method !== 'POST') {
      return new Response('Use POST JSON {"task":"..."}', {
        status: 405,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    const upstream =
      env.VENICE_UPSTREAM_URL?.trim() ||
      'https://taskboard.krakost1980.workers.dev/api/venice/breakdown'

    const forwardingHeaders = new Headers()
    const ct = req.headers.get('Content-Type')
    if (ct) forwardingHeaders.set('Content-Type', ct)

    const res = await fetch(upstream, {
      method: 'POST',
      headers: forwardingHeaders,
      body: await req.text(),
    })

    const out = new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
    })
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      out.headers.set(k, v)
    }
    const resCt = res.headers.get('Content-Type')
    if (resCt) out.headers.set('Content-Type', resCt)
    return out
  },
}
