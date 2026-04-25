'use client'

import Link from 'next/link'
import type { Trip } from '@/lib/types'
import dynamic from 'next/dynamic'
import ItineraryTab from '@/components/trip/ItineraryTab'
import BudgetTab from '@/components/trip/BudgetTab'
import NotesTab from '@/components/trip/NotesTab'
import OptionsTab from '@/components/trip/OptionsTab'
import { useState } from 'react'

const WorldMap = dynamic(() => import('@/components/map/WorldMap'), { ssr: false })

const TABS = ['Map', 'Itinerary', 'Budget', 'Options', 'Notes'] as const
type Tab = (typeof TABS)[number]

type Props = { trip: Trip }

export default function ShareViewClient({ trip }: Props) {
  const [active, setActive] = useState<Tab>('Map')
  const travelerCount = Math.max(1, (trip.travelers ?? []).length)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-cream sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{trip.coverEmoji}</span>
            <div>
              <h1 className="font-serif text-lg text-ink">{trip.name}</h1>
              {trip.description && (
                <p className="font-mono text-xs text-muted">{trip.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted border border-border rounded-full px-2.5 py-1">
              View only
            </span>
            <Link href="/" className="font-mono text-xs text-accent hover:underline">
              Plan your own →
            </Link>
          </div>
        </div>
      </header>

      {/* Destination timeline */}
      {(trip.destinations ?? []).length > 0 && (
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {(trip.destinations ?? []).map((d, i) => (
                <div key={d.id} className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 border border-border rounded-full px-3 py-1.5 bg-cream">
                    <span className="w-4 h-4 rounded-full bg-accent text-cream font-mono text-[9px] flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink">{d.name}</span>
                    {(d.arrival || d.departure) && (
                      <span className="font-mono text-xs text-muted">
                        {d.arrival}{d.arrival && d.departure ? '→' : ''}{d.departure}
                      </span>
                    )}
                  </div>
                  {i < (trip.destinations ?? []).length - 1 && (
                    <span className="text-muted font-mono text-sm">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-border bg-cream sticky top-[57px] z-10">
        <div className="max-w-4xl mx-auto px-6 flex gap-0 overflow-x-auto">
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
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {active === 'Map' && (
          <div className="space-y-6">
            <WorldMap destinations={trip.destinations ?? []} />
          </div>
        )}
        {active === 'Itinerary' && (
          <ItineraryTab destinations={trip.destinations ?? []} onUpdate={() => {}} />
        )}
        {active === 'Budget' && (
          <BudgetTab
            tripId={trip.id}
            tripCurrency={trip.currency ?? 'MYR'}
            categories={trip.budgetCategories ?? []}
            travelerCount={travelerCount}
            onUpdate={() => {}}
            onCurrencyChange={() => {}}
          />
        )}
        {active === 'Options' && (
          <OptionsTab
            tripId={trip.id}
            optionGroups={trip.optionGroups ?? []}
            readOnly
            onUpdate={() => {}}
          />
        )}
        {active === 'Notes' && (
          <NotesTab tripId={trip.id} notes={trip.notes} onUpdate={() => {}} />
        )}
      </main>
    </div>
  )
}
