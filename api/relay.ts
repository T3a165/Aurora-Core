/**
 * /api/relay — relay command dispatch
 *
 * POST /api/relay
 * Body: { "relay": "k1"|"k2"|"k3"|"k4", "state": true|false, "reason": string }
 *
 * In production: this writes to Vercel KV, which the ESP32
 * polls on its next /api/commands request.
 *
 * K1 = Generator   K2 = Shore Power
 * K3 = HVAC        K4 = Propane / AUX
 */

export const config = { runtime: 'nodejs' }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const RELAY_LABELS: Record<string, string> = {
  k1: 'Generator',
  k2: 'Shore Power',
  k3: 'HVAC',
  k4: 'Propane / AUX',
}

type RelayId = 'k1' | 'k2' | 'k3' | 'k4'

interface RelayCommand {
  relay:   RelayId
  state:   boolean
  reason?: string
}

function isValidRelay(r: unknown): r is RelayId {
  return typeof r === 'string' && ['k1','k2','k3','k4'].includes(r)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  // GET — return current relay state (from KV if available, else defaults)
  if (req.method === 'GET') {
    const state = await getRelayState()
    return new Response(JSON.stringify({ ok: true, relay: state }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS })
  }

  if (typeof body !== 'object' || body === null) {
    return new Response(JSON.stringify({ error: 'Expected JSON object' }), { status: 422, headers: CORS })
  }

  const cmd = body as Partial<RelayCommand>

  if (!isValidRelay(cmd.relay)) {
    return new Response(JSON.stringify({ error: 'relay must be k1|k2|k3|k4' }), { status: 422, headers: CORS })
  }

  if (typeof cmd.state !== 'boolean') {
    return new Response(JSON.stringify({ error: 'state must be boolean' }), { status: 422, headers: CORS })
  }

  const validated: RelayCommand = {
    relay:  cmd.relay,
    state:  cmd.state,
    reason: typeof cmd.reason === 'string' ? cmd.reason.slice(0, 200) : 'manual',
  }

  // Write to KV store (queued for ESP32 poll)
  await setRelayCommand(validated)

  return new Response(JSON.stringify({
    ok:      true,
    ts:      Date.now(),
    relay:   validated.relay,
    label:   RELAY_LABELS[validated.relay],
    state:   validated.state,
    reason:  validated.reason,
    message: `${RELAY_LABELS[validated.relay]} → ${validated.state ? 'ON' : 'OFF'}`,
  }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ── KV helpers (Vercel KV when available, in-memory fallback) ────────────────

interface RelayState { k1: boolean; k2: boolean; k3: boolean; k4: boolean }

const DEFAULT_STATE: RelayState = { k1: false, k2: true, k3: true, k4: false }
const memState: RelayState = { ...DEFAULT_STATE }

async function getRelayState(): Promise<RelayState> {
  try {
    const { kv } = await import('@vercel/kv')
    const stored = await kv.get<RelayState>('relay_state')
    return stored ?? DEFAULT_STATE
  } catch {
    return memState
  }
}

async function setRelayCommand(cmd: RelayCommand): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv')
    const current = await kv.get<RelayState>('relay_state') ?? { ...DEFAULT_STATE }
    current[cmd.relay] = cmd.state
    await kv.set('relay_state', current)
    // Queue command for ESP32 poll
    await kv.lpush('relay_queue', JSON.stringify({ ...cmd, ts: Date.now() }))
    await kv.ltrim('relay_queue', 0, 49) // keep last 50
  } catch {
    // In-memory fallback — works for demos without KV configured
    memState[cmd.relay] = cmd.state
  }
}
