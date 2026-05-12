/** AI-assisted features (Workers, edge endpoints). */

const DEFAULT_VENICE_BREAKDOWN_URL =
  'https://taskboard.krakost1980.workers.dev/api/venice/breakdown'

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const FALLBACK_CARD_COLOR = '#71717a'

function normalizeCardColor(input: string | undefined): string {
  const c = typeof input === 'string' ? input.trim() : ''
  if (HEX_COLOR.test(c)) return c
  return FALLBACK_CARD_COLOR
}

const DEV_PROXY_BREAKDOWN_URL = '/api/venice/breakdown'

/**
 * При пустой `VITE_VENICE_BREAKDOWN_URL`:
 * - в dev — относительный путь к Vite proxy (без CORS в браузере);
 * - в prod — прямой URL на Worker (нужны CORS на сервере или свой шлюз, см. `workers/venice-cors-proxy`).
 */
export function getVeniceBreakdownUrl(): string {
  const fromEnv = import.meta.env.VITE_VENICE_BREAKDOWN_URL?.trim()
  if (fromEnv && fromEnv.length > 0) return fromEnv
  return import.meta.env.DEV ? DEV_PROXY_BREAKDOWN_URL : DEFAULT_VENICE_BREAKDOWN_URL
}

/** Нормализованный элемент ответа Venice breakdown (готов к insert в board_tasks). */
export type VeniceBreakdownItem = {
  title: string
  description: string
  color: string
}

function parseBreakdownPayload(data: unknown): VeniceBreakdownItem[] {
  if (data == null || typeof data !== 'object') return []
  const items = (data as { items?: unknown }).items
  if (!Array.isArray(items)) return []

  const out: VeniceBreakdownItem[] = []
  for (const raw of items) {
    if (raw == null || typeof raw !== 'object') continue
    const r = raw as Record<string, unknown>
    const title =
      typeof r.title === 'string' ? r.title.trim() : String(r.title ?? '').trim()
    if (!title) continue
    const description =
      typeof r.description === 'string' ? r.description.trim() : ''
    const color = normalizeCardColor(
      typeof r.color === 'string' ? r.color : undefined,
    )
    out.push({ title, description, color })
  }
  return out
}

/**
 * POST `{"task": "..."}` к Venice breakdown endpoint.
 * Возвращает нормализованный список карточек (без пустых title).
 */
export async function requestVeniceBreakdown(
  task: string,
): Promise<VeniceBreakdownItem[]> {
  const trimmed = task.trim()
  if (!trimmed) {
    throw new Error('Task text is empty.')
  }
  const url = getVeniceBreakdownUrl()
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: trimmed }),
  })
  if (!response.ok) {
    const hint = await response.text().catch(() => '')
    throw new Error(
      hint
        ? `Venice API ${response.status}: ${hint.slice(0, 200)}`
        : `Venice API error: ${response.status}`,
    )
  }
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('Venice API returned invalid JSON.')
  }
  return parseBreakdownPayload(data)
}

/** @deprecated заглушка; используйте requestVeniceBreakdown для реальных запросов. */
export async function requestAiSuggestion(input: string): Promise<string> {
  void input
  return ''
}
