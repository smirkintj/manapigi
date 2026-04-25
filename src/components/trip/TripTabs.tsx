'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Trip } from '@/lib/types'
import ItineraryTab from './ItineraryTab'
import BudgetTab from './BudgetTab'
import NotesTab from './NotesTab'
import StayTab from './StayTab'
import OptionsTab from './OptionsTab'
import { formatDate } from '@/lib/utils'

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

const TABS = ['Map', 'Itinerary', 'Budget', 'Stay', 'Options', 'Notes'] as const
type Tab = (typeof TABS)[number]

type Props = {
  trip: Trip
  onUpdate: () => void
  onCurrencyChange?: (c: string) => void
  readOnly?: boolean
}

export default function TripTabs({ trip, onUpdate, onCurrencyChange, readOnly = false }: Props) {
  const [active, setActive] = useState<Tab>('Map')

  const noop = () => {}
  const travelerCount = Math.max(1, (trip.travelers ?? []).length)

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-border px-6 shrink-0 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`font-mono text-xs uppercase tracking-wider px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
              active === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {active === 'Map' && (
          <div className="space-y-5">
            <WorldMap destinations={trip.destinations ?? []} />
            {(trip.destinations ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(trip.destinations ?? []).map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 border border-border rounded-full px-3 py-1.5 bg-card"
                  >
                    <span className="w-[18px] h-[18px] rounded-full bg-accent text-cream font-mono text-[9px] flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink">{d.name}</span>
                    {d.arrival && (
                      <span className="font-mono text-xs text-muted">{formatDate(d.arrival)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active === 'Itinerary' && (
          <ItineraryTab destinations={trip.destinations ?? []} onUpdate={readOnly ? noop : onUpdate} />
        )}

        {active === 'Budget' && (
          <BudgetTab
            tripId={trip.id}
            tripCurrency={trip.currency ?? 'MYR'}
            categories={trip.budgetCategories ?? []}
            travelerCount={travelerCount}
            accommodations={trip.accommodations ?? []}
            onUpdate={readOnly ? noop : onUpdate}
            onCurrencyChange={readOnly ? noop : (onCurrencyChange ?? noop)}
          />
        )}

        {active === 'Stay' && (
          <StayTab
            tripId={trip.id}
            accommodations={trip.accommodations ?? []}
            destinations={trip.destinations ?? []}
            budgetCategories={trip.budgetCategories ?? []}
            onUpdate={readOnly ? noop : onUpdate}
          />
        )}

        {active === 'Options' && (
          <OptionsTab
            tripId={trip.id}
            optionGroups={trip.optionGroups ?? []}
            readOnly={readOnly}
            onUpdate={readOnly ? noop : onUpdate}
          />
        )}

        {active === 'Notes' && (
          <NotesTab tripId={trip.id} notes={trip.notes} onUpdate={readOnly ? noop : onUpdate} />
        )}
      </div>
    </div>
  )
}
