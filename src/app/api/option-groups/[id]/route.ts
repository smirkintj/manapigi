import { NextResponse } from 'next/server'
import { db } from '@/db'
import { optionGroups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { title, category } = await req.json()
  const [group] = await db
    .update(optionGroups)
    .set({ title, category })
    .where(eq(optionGroups.id, id))
    .returning()
  return NextResponse.json(group)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(optionGroups).where(eq(optionGroups.id, id))
  return NextResponse.json({ success: true })
}
