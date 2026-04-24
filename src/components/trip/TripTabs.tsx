'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Trip } from '@/lib/types'
import ItineraryTab from './ItineraryTab'
import BudgetTab from './BudgetTab'
import NotesTab from './NotesTab'

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

const TABS = ['Map', 'Itinerary', 'Budget', 'Notes'] as const
type Tab = (typeof TABS)[number]

type Props = {
  trip: Trip
  onUpdate: () => void
  readOnly?: boolean
}

export default function TripTabs({ trip, onUpdate, readOnly = false }: Props) {
  const [active, setActive] = useState<Tab>('Map')

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border px-6 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-3 border-b-2 transition-colors ${
              active === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {active === 'Map' && (
          <div className="space-y-6">
            <WorldMap destinations={trip.destinations ?? []} />
            {(trip.destinations ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(trip.destinations ?? []).map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 border border-border rounded-full px-3 py-1.5 bg-card"
                  >
                    <span className="w-4 h-4 rounded-full bg-accent text-cream font-mono text-[9px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink">{d.name}</span>
                    {d.arrival && (
                      <span className="font-mono text-xs text-muted">{d.arrival}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active === 'Itinerary' && (
          <ItineraryTab destinations={trip.destinations ?? []} onUpdate={readOnly ? () => {} : onUpdate} />
        )}

        {active === 'Budget' && (
          <BudgetTab
            tripId={trip.id}
            categories={trip.budgetCategories ?? []}
            onUpdate={readOnly ? () => {} : onUpdate}
          />
        )}

        {active === 'Notes' && (
          <NotesTab tripId={trip.id} notes={trip.notes} onUpdate={readOnly ? () => {} : onUpdate} />
        )}
      </div>
    </div>
  )
}
