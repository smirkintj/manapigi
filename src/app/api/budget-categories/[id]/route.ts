import { NextResponse } from 'next/server'
import { db } from '@/db'
import { budgetCategories } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, color } = await req.json()

  const [cat] = await db
    .update(budgetCategories)
    .set({ name, color })
    .where(eq(budgetCategories.id, id))
    .returning()

  return NextResponse.json(cat)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(budgetCategories).where(eq(budgetCategories.id, id))
  return NextResponse.json({ success: true })
}
