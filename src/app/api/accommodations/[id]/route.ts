import { NextResponse } from 'next/server'
import { db } from '@/db'
import { accommodations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, type, destinationId, checkIn, checkOut } = await req.json()

  const [row] = await db
    .update(accommodations)
    .set({ name, type, destinationId, checkIn, checkOut })
    .where(eq(accommodations.id, id))
    .returning()

  return NextResponse.json(row)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.delete(accommodations).where(eq(accommodations.id, id))
  return NextResponse.json({ success: true })
}
