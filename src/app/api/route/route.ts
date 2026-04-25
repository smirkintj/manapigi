import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // "lng,lat"
  const to = searchParams.get('to')     // "lng,lat"
  const profile = searchParams.get('profile') ?? 'driving'

  if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })

  const url = `https://router.project-osrm.org/route/v1/${profile}/${from};${to}?overview=full&geometries=geojson`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json({ error: 'OSRM error' }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Routing unavailable' }, { status: 502 })
  }
}
