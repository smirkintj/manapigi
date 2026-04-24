import { NextResponse } from 'next/server'
import { db } from '@/db'
import { trips } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const trip = await db.query.trips.findFirst({
    where: eq(trips.shareToken, token),
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
    },
  })

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(trip)
}
