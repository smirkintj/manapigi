import { NextResponse } from 'next/server'
import { db } from '@/db'
import { accommodationRooms } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, guests, price } = await req.json()

  const [room] = await db
    .update(accommodationRooms)
    .set({ name, guests, price: parseFloat(price) || 0 })
    .where(eq(accommodationRooms.id, id))
    .returning()

  return NextResponse.json(room)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(accommodationRooms).where(eq(accommodationRooms.id, id))
  return NextResponse.json({ success: true })
}
