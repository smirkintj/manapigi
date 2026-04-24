export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/db'
import { trips } from '@/db/schema'
import { eq } from 'drizzle-orm'
import ShareViewClient from './ShareViewClient'

async function getTripByToken(token: string) {
  return db.query.trips.findFirst({
    where: eq(trips.shareToken, token),
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

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const trip = await getTripByToken(token)
  if (!trip) notFound()

  return <ShareViewClient trip={trip} />
}
