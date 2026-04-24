export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { trips } from '@/db/schema'
import { eq } from 'drizzle-orm'
import TripDetailClient from './TripDetailClient'

async function getTrip(id: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      destinations: {
        orderBy: (d, { asc }) => [asc(d.order)],
        with: {
          itineraryItems: {
            orderBy: (i, { asc }) => [asc(i.order)],
          },
        },
      },
      budgetCategories: {
        orderBy: (bc, { asc }) => [asc(bc.order)],
        with: { items: true },
      },
    },
  })
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip = await getTrip(id)
  if (!trip) notFound()

  return <TripDetailClient initialTrip={trip} />
}
