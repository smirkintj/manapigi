import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const cache = new Map<string, { data: unknown; at: number }>()
const TTL = 24 * 60 * 60 * 1000

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 })

  const cached = cache.get(q)
  if (cached && Date.now() - cached.at < TTL) return NextResponse.json(cached.data)

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Manapigi Travel Planner (manapigi.app)' },
  })
  const data = await res.json()
  cache.set(q, { data, at: Date.now() })
  return NextResponse.json(data)
}
