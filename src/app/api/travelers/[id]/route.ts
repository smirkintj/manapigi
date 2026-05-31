import { NextResponse } from 'next/server'
import { db } from '@/db'
import { travelers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const [traveler] = await db
    .update(travelers)
    .set({ name: name.trim() })
    .where(eq(travelers.id, id))
    .returning()

  return NextResponse.json(traveler)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(travelers).where(eq(travelers.id, id))
  return NextResponse.json({ success: true })
}
