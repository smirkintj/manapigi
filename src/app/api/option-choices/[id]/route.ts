import { NextResponse } from 'next/server'
import { db } from '@/db'
import { optionChoices } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { label, amount, currency, timing, notes } = await req.json()
  const [choice] = await db
    .update(optionChoices)
    .set({ label, amount: parseFloat(amount) || 0, currency: currency ?? 'MYR', timing: timing || null, notes: notes || null })
    .where(eq(optionChoices.id, id))
    .returning()
  return NextResponse.json(choice)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(optionChoices).where(eq(optionChoices.id, id))
  return NextResponse.json({ success: true })
}
