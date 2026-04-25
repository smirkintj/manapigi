import { NextResponse } from 'next/server'
import { db } from '@/db'
import { trips } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      destinations: {
        orderBy: (d, { asc }) => [asc(d.order)],
        with: {
          itineraryItems: {
            orderBy: (i, { asc }) => [asc(i.order)],
          },
        },
      },
      budgetCategories: {
        orderBy: (bc, { asc }) => [asc(bc.order)],
        with: { items: true },
      },
      travelers: {
        orderBy: (t, { asc }) => [asc(t.order)],
      },
      accommodations: {
        orderBy: (a, { asc }) => [asc(a.order)],
        with: { rooms: true },
      },
    },
  })

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(trip)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, description, coverEmoji, notes, currency } = await req.json()

  const [trip] = await db
    .update(trips)
    .set({ name, description, coverEmoji, notes, currency, updatedAt: new Date() })
    .where(eq(trips.id, id))
    .returning()

  return NextResponse.json(trip)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(trips).where(eq(trips.id, id))
  return NextResponse.json({ success: true })
}
