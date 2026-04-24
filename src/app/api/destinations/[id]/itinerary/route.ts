import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itineraryItems } from '@/db/schema'
import { eq, count, asc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const rows = await db
    .select()
    .from(itineraryItems)
    .where(eq(itineraryItems.destinationId, id))
    .orderBy(asc(itineraryItems.order))
  return NextResponse.json(rows)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { title, description, day, time } = await req.json()

  const [{ c }] = await db
    .select({ c: count() })
    .from(itineraryItems)
    .where(eq(itineraryItems.destinationId, id))

  const [item] = await db
    .insert(itineraryItems)
    .values({
      destinationId: id,
      title,
      description: description ?? null,
      day: day ?? null,
      time: time ?? null,
      order: Number(c),
    })
    .returning()

  return NextResponse.json(item, { status: 201 })
}
