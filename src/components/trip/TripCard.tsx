import Link from 'next/link'
import { formatDate, CURRENCY_SYMBOLS } from '@/lib/utils'

type TripCardData = {
  id: string
  name: string
  coverEmoji?: string | null
  description: string | null
  startDate?: string | null
  endDate?: string | null
  currency?: string | null
  createdAt: Date | string
  destinationCount: number
  budgetTotal: number
  travelers?: { id: string; name: string }[]
}

function tripDuration(startDate?: string | null, endDate?: string | null): number | null {
  if (!startDate || !endDate) return null
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const days = Math.round(
    (new Date(ey, em - 1, ed).getTime() - new Date(sy, sm - 1, sd).getTime()) / 86400000
  ) + 1
  return days > 0 ? days : null
}

function countdown(startDate?: string | null, endDate?: string | null) {
  if (!startDate) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const diff = Math.round((start.getTime() - today.getTime()) / 86400000)
  if (diff > 0) return { label: `${diff}d to go`, active: false }
  if (diff === 0) return { label: 'Today!', active: true }
  if (endDate) {
    const [ey, em, ed] = endDate.split('-').map(Number)
    if (today <= new Date(ey, em - 1, ed)) return { label: 'In progress', active: true }
  }
  return null
}

export default function TripCard({ trip }: { trip: TripCardData }) {
  const travelers = trip.travelers ?? []
  const currency = trip.currency ?? 'MYR'
  const currSym = CURRENCY_SYMBOLS[currency] ?? currency

  const dateRange = trip.startDate
    ? [trip.startDate, trip.endDate].filter(Boolean).map(formatDate).join(' → ')
    : null
  const duration = tripDuration(trip.startDate, trip.endDate)
  const cd = countdown(trip.startDate, trip.endDate)

  const perPerson = trip.budgetTotal > 0
    ? travelers.length > 1
      ? Math.round(trip.budgetTotal / travelers.length)
      : Math.round(trip.budgetTotal)
    : null

  return (
    <Link href={`/trip/${trip.id}`}>
      <div className="bg-card border border-border rounded-xl p-5 hover:border-accent transition-all hover:shadow-sm cursor-pointer flex flex-col gap-3 h-full">
        {/* Top: emoji + name + countdown */}
        <div className="flex items-start gap-3">
          {trip.coverEmoji && (
            <span className="text-2xl shrink-0 mt-0.5">{trip.coverEmoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-xl text-ink leading-snug">{trip.name}</h3>
              {cd && (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full shrink-0 mt-1 whitespace-nowrap ${
                  cd.active
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {cd.label}
                </span>
              )}
            </div>
            {dateRange && (
              <p className="font-mono text-xs text-muted mt-0.5">
                {dateRange}
                {duration && <span className="ml-1.5 text-border">· {duration}d</span>}
              </p>
            )}
            {trip.description && (
              <p className="text-muted text-sm mt-1 line-clamp-2 leading-relaxed">{trip.description}</p>
            )}
          </div>
        </div>

        {/* Bottom: travelers + stats */}
        <div className="flex items-center gap-2 pt-3 border-t border-border mt-auto flex-wrap">
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
          {perPerson !== null && (
            <>
              <span className="text-border">·</span>
              <span className="font-mono text-xs text-muted">
                {currSym}{perPerson.toLocaleString()}
                {travelers.length > 1 && <span className="text-[10px]">/pax</span>}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
