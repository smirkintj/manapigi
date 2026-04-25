import { NextResponse } from 'next/server'
import { db } from '@/db'
import { optionChoices, optionGroups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount, currency, timing, notes } = await req.json()

  const existing = await db.query.optionChoices.findMany({ where: eq(optionChoices.groupId, id) })

  const [choice] = await db
    .insert(optionChoices)
    .values({
      groupId: id,
      label,
      amount: parseFloat(amount) || 0,
      currency: currency ?? 'MYR',
      timing: timing || null,
      notes: notes || null,
      order: existing.length,
    })
    .returning()

  return NextResponse.json(choice, { status: 201 })
}
