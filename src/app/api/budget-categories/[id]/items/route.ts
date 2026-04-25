import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetItems } from '@/db/schema'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount, itemCurrency, perPax, deadline, accommodationId } = await req.json()

  const [item] = await db
    .insert(budgetItems)
    .values({
      categoryId: id,
      label,
      amount: parseFloat(amount) || 0,
      itemCurrency: itemCurrency ?? 'MYR',
      perPax: perPax ?? false,
      bookingStatus: 'pending',
      deadline: deadline ?? null,
      accommodationId: accommodationId ?? null,
    })
    .returning()

  return NextResponse.json(item, { status: 201 })
}
