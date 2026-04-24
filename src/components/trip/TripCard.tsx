import Link from 'next/link'

type TripCardData = {
  id: string
  name: string
  description: string | null
  createdAt: Date | string
  destinationCount: number
  budgetTotal: number
}

export default function TripCard({ trip }: { trip: TripCardData }) {
  return (
    <Link href={`/trip/${trip.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-accent transition-all hover:shadow-sm cursor-pointer flex flex-col gap-4">
        <div>
          <h3 className="font-serif text-xl text-ink leading-snug">{trip.name}</h3>
          {trip.description && (
            <p className="text-muted text-sm mt-1.5 line-clamp-2 leading-relaxed">
              {trip.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-3.5 border-t border-border mt-auto">
          <span className="font-mono text-xs text-muted">
            {trip.destinationCount} {trip.destinationCount === 1 ? 'stop' : 'stops'}
          </span>
          {trip.budgetTotal > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono text-xs text-muted">
                ${trip.budgetTotal.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
