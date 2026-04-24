import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetItems } from '@/db/schema'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount } = await req.json()

  const [item] = await db
    .insert(budgetItems)
    .values({ categoryId: id, label, amount: parseFloat(amount) || 0 })
    .returning()

  return NextResponse.json(item, { status: 201 })
}
