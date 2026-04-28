import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount, itemCurrency, perPax, bookingStatus, deadline, accommodationId, paidBy, individual } = await req.json()

  const status = bookingStatus ?? 'pending'
  const [item] = await db
    .update(budgetItems)
    .set({
      label,
      amount: parseFloat(amount) || 0,
      itemCurrency: itemCurrency ?? 'MYR',
      perPax: perPax ?? false,
      bookingStatus: status,
      deadline: deadline ?? null,
      accommodationId: accommodationId ?? null,
      paidBy: paidBy ?? null,
      individual: individual ?? false,
      paid: status === 'done',
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
