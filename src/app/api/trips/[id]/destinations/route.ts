import { NextResponse } from 'next/server'
import { db } from '@/db'
import { destinations } from '@/db/schema'
import { eq, asc, count } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const rows = await db
    .select()
    .from(destinations)
    .where(eq(destinations.tripId, id))
    .orderBy(asc(destinations.order))
  return NextResponse.json(rows)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  const [{ c }] = await db
    .select({ c: count() })
    .from(destinations)
    .where(eq(destinations.tripId, id))

  let lat = body.lat ?? null
  let lng = body.lng ?? null

  if ((!lat || !lng) && body.name) {
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(body.name)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'manapigi-travel-planner' } },
      )
      const geoData = await geo.json()
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat)
        lng = parseFloat(geoData[0].lon)
      }
    } catch {
      // geocoding optional — continue without coords
    }
  }

  const [dest] = await db
    .insert(destinations)
    .values({
      tripId: id,
      name: body.name,
      country: body.country ?? null,
      lat,
      lng,
      arrival: body.arrival ?? null,
      departure: body.departure ?? null,
      notes: body.notes ?? null,
      order: Number(c),
    })
    .returning()

  return NextResponse.json(dest, { status: 201 })
}
