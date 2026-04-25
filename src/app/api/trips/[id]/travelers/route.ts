import { NextResponse } from 'next/server'
import { db } from '@/db'
import { travelers } from '@/db/schema'
import { eq, count, asc } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const rows = await db
    .select()
    .from(travelers)
    .where(eq(travelers.tripId, id))
    .orderBy(asc(travelers.order))
  return NextResponse.json(rows)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name } = await req.json()

  const [{ c }] = await db
    .select({ c: count() })
    .from(travelers)
    .where(eq(travelers.tripId, id))

  const [row] = await db
    .insert(travelers)
    .values({ tripId: id, name, order: Number(c) })
    .returning()

  return NextResponse.json(row, { status: 201 })
}
