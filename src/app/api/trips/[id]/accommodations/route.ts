import { NextResponse } from 'next/server'
import { db } from '@/db'
import { accommodations } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const rows = await db.query.accommodations.findMany({
    where: eq(accommodations.tripId, id),
    with: { rooms: true },
    orderBy: (a, { asc }) => [asc(a.order)],
  })
  return NextResponse.json(rows)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, type, destinationId, checkIn, checkOut } = await req.json()

  const [{ c }] = await db
    .select({ c: count() })
    .from(accommodations)
    .where(eq(accommodations.tripId, id))

  const [row] = await db
    .insert(accommodations)
    .values({
      tripId: id,
      name,
      type: type ?? 'hotel',
      destinationId: destinationId ?? null,
      checkIn: checkIn ?? null,
      checkOut: checkOut ?? null,
      order: Number(c),
    })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
