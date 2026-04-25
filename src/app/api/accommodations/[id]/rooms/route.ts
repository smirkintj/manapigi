import { NextResponse } from 'next/server'
import { db } from '@/db'
import { accommodationRooms } from '@/db/schema'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name, guests, price } = await req.json()

  const [room] = await db
    .insert(accommodationRooms)
    .values({
      accommodationId: id,
      name,
      guests: guests ?? null,
      price: parseFloat(price) || 0,
    })
    .returning()

  return NextResponse.json(room, { status: 201 })
}
