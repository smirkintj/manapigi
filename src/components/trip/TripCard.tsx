import Link from 'next/link'
import { formatDate } from '@/lib/utils'

type TripCardData = {
  id: string
  name: string
  coverEmoji?: string | null
  description: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt: Date | string
  destinationCount: number
  budgetTotal: number
  travelers?: { id: string; name: string }[]
}

export default function TripCard({ trip }: { trip: TripCardData }) {
  const dateLabel = trip.startDate
    ? [trip.startDate, trip.endDate].filter(Boolean).map(formatDate).join(' → ')
    : null

  const travelers = trip.travelers ?? []

  return (
    <Link href={`/trip/${trip.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-accent transition-all hover:shadow-sm cursor-pointer flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {trip.coverEmoji && (
            <span className="text-2xl shrink-0 mt-0.5">{trip.coverEmoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-xl text-ink leading-snug">{trip.name}</h3>
            {dateLabel && (
              <p className="font-mono text-xs text-muted mt-0.5">{dateLabel}</p>
            )}
            {trip.description && (
              <p className="text-muted text-sm mt-1 line-clamp-2 leading-relaxed">{trip.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-border mt-auto">
          {travelers.length > 0 && (
            <>
              <div className="flex items-center -space-x-1">
                {travelers.slice(0, 5).map((t) => (
                  <div key={t.id}
                    className="w-5 h-5 rounded-full bg-accent-light border border-accent/30 flex items-center justify-center ring-1 ring-card"
                    title={t.name}
                  >
                    <span className="font-mono text-[8px] text-accent font-bold">{t.name[0].toUpperCase()}</span>
                  </div>
                ))}
                {travelers.length > 5 && (
                  <div className="w-5 h-5 rounded-full bg-border flex items-center justify-center ring-1 ring-card">
                    <span className="font-mono text-[8px] text-muted">+{travelers.length - 5}</span>
                  </div>
                )}
              </div>
              <span className="text-border">·</span>
            </>
          )}
          <span className="font-mono text-xs text-muted">
            {trip.destinationCount} {trip.destinationCount === 1 ? 'stop' : 'stops'}
          </span>
          {trip.budgetTotal > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono text-xs text-muted">${trip.budgetTotal.toLocaleString()}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
