export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { trips, destinations, budgetCategories, budgetItems } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import TripCard from '@/components/trip/TripCard'
import NewTripButton from '@/components/trip/NewTripButton'

async function getTrips() {
  const rows = await db.select().from(trips).orderBy(desc(trips.createdAt))

  return Promise.all(
    rows.map(async (trip) => {
      const dests = await db.select().from(destinations).where(eq(destinations.tripId, trip.id))
      const cats = await db.select().from(budgetCategories).where(eq(budgetCategories.tripId, trip.id))
      let budgetTotal = 0
      for (const cat of cats) {
        const items = await db.select().from(budgetItems).where(eq(budgetItems.categoryId, cat.id))
        budgetTotal += items.reduce((s, i) => s + i.amount, 0)
      }
      return { ...trip, destinationCount: dests.length, budgetTotal }
    }),
  )
}

export default async function HomePage() {
  const tripList = await getTrips()

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-cream/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-serif text-xl text-ink">manapigi</span>
            <span className="font-mono text-xs text-muted ml-2">travel planner</span>
          </div>
          <NewTripButton />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {tripList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h2 className="font-serif text-2xl text-ink mb-2">No trips yet</h2>
            <p className="text-muted text-sm mb-6 max-w-xs">
              Start planning your first adventure. Add destinations, itinerary, budget — then share with friends.
            </p>
            <NewTripButton />
          </div>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-ink mb-6">Your trips</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tripList.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
