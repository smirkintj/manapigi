import { NextResponse } from 'next/server'
import { db } from '@/db'
import { trips, destinations, budgetItems, budgetCategories } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function GET() {
  const rows = await db.select().from(trips).orderBy(desc(trips.createdAt))

  const enriched = await Promise.all(
    rows.map(async (trip) => {
      const dests = await db
        .select()
        .from(destinations)
        .where(eq(destinations.tripId, trip.id))

      const cats = await db
        .select()
        .from(budgetCategories)
        .where(eq(budgetCategories.tripId, trip.id))

      let budgetTotal = 0
      for (const cat of cats) {
        const items = await db
          .select()
          .from(budgetItems)
          .where(eq(budgetItems.categoryId, cat.id))
        budgetTotal += items.reduce((s, i) => s + i.amount, 0)
      }

      return { ...trip, destinationCount: dests.length, budgetTotal }
    }),
  )

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const { name, description, coverEmoji, currency, startDate, endDate } = await req.json()
  const shareToken = nanoid(12)

  const [trip] = await db
    .insert(trips)
    .values({
      name,
      description,
      coverEmoji: coverEmoji || '✈️',
      currency: currency || 'MYR',
      startDate: startDate || null,
      endDate: endDate || null,
      shareToken,
    })
    .returning()

  return NextResponse.json(trip, { status: 201 })
}
