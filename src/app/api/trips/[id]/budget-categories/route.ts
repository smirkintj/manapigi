import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetCategories } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const rows = await db.query.budgetCategories.findMany({
    where: eq(budgetCategories.tripId, id),
    with: { items: true },
    orderBy: (bc, { asc }) => [asc(bc.order)],
  })
  return NextResponse.json(rows)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, color } = await req.json()

  const [{ c }] = await db
    .select({ c: count() })
    .from(budgetCategories)
    .where(eq(budgetCategories.tripId, id))

  const COLORS = ['#2d5a3d', '#5a2d3d', '#2d3d5a', '#5a4e2d', '#4a2d5a', '#2d5a4e']

  const [cat] = await db
    .insert(budgetCategories)
    .values({
      tripId: id,
      name,
      color: color ?? COLORS[Number(c) % COLORS.length],
      order: Number(c),
    })
    .returning()

  return NextResponse.json(cat, { status: 201 })
}
