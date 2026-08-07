import { apiUrl } from '../../lib/api'

const BASE = apiUrl('/api/proxy/supabase/functions/v1/make-server-12f1d05f')

async function call(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export const db = {
  obstacles: {
    getAll: () => call('/obstacles'),
    create: (data: unknown) => call('/obstacles', 'POST', data),
    remove: (id: string) => call(`/obstacles/${id}`, 'DELETE'),
  },
  decisions: {
    getAll: () => call('/decisions'),
    create: (data: unknown) => call('/decisions', 'POST', data),
  },
  events: {
    getAll: () => call('/events'),
    create: (data: unknown) => call('/events', 'POST', data),
  },
  ai: {
    analyze: (prompt: string, geminiKey: string) =>
      call('/ai/analyze', 'POST', { prompt, geminiKey }),
  },
}
