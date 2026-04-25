import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount, paid, itemCurrency, perPax } = await req.json()

  const [item] = await db
    .update(budgetItems)
    .set({
      label,
      amount: parseFloat(amount) || 0,
      paid,
      itemCurrency: itemCurrency ?? 'MYR',
      perPax: perPax ?? false,
    })
    .where(eq(budgetItems.id, id))
    .returning()

  return NextResponse.json(item)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(budgetItems).where(eq(budgetItems.id, id))
  return NextResponse.json({ success: true })
}
