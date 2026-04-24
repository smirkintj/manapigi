import { NextResponse } from 'next/server'
import { db } from '@/db'
import { itineraryItems } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { title, description, day, time } = await req.json()

  const [item] = await db
    .update(itineraryItems)
    .set({ title, description, day, time })
    .where(eq(itineraryItems.id, id))
    .returning()

  return NextResponse.json(item)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(itineraryItems).where(eq(itineraryItems.id, id))
  return NextResponse.json({ success: true })
}
