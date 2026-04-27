import { NextResponse } from 'next/server'
import { db } from '@/db'
import { destinations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  const [dest] = await db
    .update(destinations)
    .set({
      name: body.name,
      country: body.country,
      arrival: body.arrival,
      arrivalTime: body.arrivalTime,
      departure: body.departure,
      departureTime: body.departureTime,
      notes: body.notes,
      transportMode: body.transportMode,
      lat: body.lat,
      lng: body.lng,
      order: body.order,
    })
    .where(eq(destinations.id, id))
    .returning()

  return NextResponse.json(dest)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(destinations).where(eq(destinations.id, id))
  return NextResponse.json({ success: true })
}
