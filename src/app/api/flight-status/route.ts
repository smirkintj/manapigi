import { NextRequest, NextResponse } from 'next/server'

// Cache per flight+date, 5 minutes
const cache: Record<string, { data: FlightStatus; ts: number }> = {}

export type FlightStatus = {
  flightNumber: string
  airline: string | null
  status: string | null
  departure: { airport: string; iata: string; scheduled: string | null; actual: string | null; terminal: string | null; gate: string | null } | null
  arrival:   { airport: string; iata: string; scheduled: string | null; actual: string | null; terminal: string | null; gate: string | null } | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const flight = searchParams.get('flight')?.trim().toUpperCase()
  const date   = searchParams.get('date')?.trim()  // YYYY-MM-DD

  if (!flight) return NextResponse.json({ error: 'flight required' }, { status: 400 })

  const key = `${flight}:${date ?? 'any'}`
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < 5 * 60 * 1000) {
    return NextResponse.json(cache[key].data)
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AVIATIONSTACK_API_KEY not configured' }, { status: 503 })

  try {
    const params = new URLSearchParams({ access_key: apiKey, flight_iata: flight, limit: '1' })
    if (date) params.set('flight_date', date)
    const res = await fetch(`http://api.aviationstack.com/v1/flights?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return NextResponse.json({ error: 'API error' }, { status: 502 })
    const json = await res.json()
    const f = json.data?.[0]
    if (!f) return NextResponse.json({ error: 'Flight not found' }, { status: 404 })

    const result: FlightStatus = {
      flightNumber: f.flight?.iata ?? flight,
      airline: f.airline?.name ?? null,
      status: f.flight_status ?? null,
      departure: f.departure ? {
        airport:   f.departure.airport ?? '',
        iata:      f.departure.iata ?? '',
        scheduled: f.departure.scheduled ?? null,
        actual:    f.departure.actual ?? null,
        terminal:  f.departure.terminal ?? null,
        gate:      f.departure.gate ?? null,
      } : null,
      arrival: f.arrival ? {
        airport:   f.arrival.airport ?? '',
        iata:      f.arrival.iata ?? '',
        scheduled: f.arrival.scheduled ?? null,
        actual:    f.arrival.actual ?? null,
        terminal:  f.arrival.terminal ?? null,
        gate:      f.arrival.gate ?? null,
      } : null,
    }
    cache[key] = { data: result, ts: now }
    return NextResponse.json(result)
  } catch (err) {
    console.error('flight-status error:', err)
    return NextResponse.json({ error: 'Failed to fetch flight status' }, { status: 500 })
  }
}
