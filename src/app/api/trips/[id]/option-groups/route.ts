import { NextResponse } from 'next/server'
import { db } from '@/db'
import { optionGroups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const groups = await db.query.optionGroups.findMany({
    where: eq(optionGroups.tripId, id),
    orderBy: (g, { asc }) => [asc(g.order)],
    with: { choices: { orderBy: (c, { asc }) => [asc(c.order)] } },
  })
  return NextResponse.json(groups)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { title, category } = await req.json()

  const existing = await db.query.optionGroups.findMany({ where: eq(optionGroups.tripId, id) })

  const [group] = await db
    .insert(optionGroups)
    .values({ tripId: id, title, category: category ?? 'other', order: existing.length })
    .returning()

  return NextResponse.json(group, { status: 201 })
}
