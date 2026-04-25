'use client'

import { useState } from 'react'
import type { Destination, Traveler } from '@/lib/types'
import { formatDate, transportIcon, TRANSPORT_MODES } from '@/lib/utils'

// ── Travelers section ───────────────────────────────────────────────────────

function TravelersSection({
  tripId,
  travelers,
  onUpdate,
}: {
  tripId: string
  travelers: Traveler[]
  onUpdate: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await fetch(`/api/trips/${tripId}/travelers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setName('')
    setAdding(false)
    onUpdate()
  }

  const remove = async (id: string) => {
    await fetch(`/api/travelers/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="px-4 py-3 border-t border-border">
      <span className="font-mono text-xs text-muted uppercase tracking-wider">People</span>
      <div className="mt-2 space-y-1">
        {travelers.map((t) => (
          <div key={t.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-light border border-accent/30 flex items-center justify-center">
                <span className="font-mono text-[9px] text-accent font-bold">
                  {t.name[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-ink">{t.name}</span>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 text-sm transition-all"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={add} className="mt-2 flex gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card focus:outline-none focus:border-accent"
          />
          <button type="submit" className="bg-accent text-cream font-mono text-xs px-3 rounded-lg hover:bg-accent/90">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-muted text-sm px-1">
            ×
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full border border-dashed border-border rounded-lg py-1.5 text-xs font-mono text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add person
        </button>
      )}
    </div>
  )
}

// ── Main sidebar ────────────────────────────────────────────────────────────

type Props = {
  tripId: string
  destinations: Destination[]
  travelers: Traveler[]
  onUpdate: () => void
}

export default function DestinationSidebar({ tripId, destinations, travelers, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [transportMode, setTransportMode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/destinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        arrival: arrival || null,
        departure: departure || null,
        transportMode: transportMode || null,
      }),
    })
    setLoading(false)
    setName('')
    setArrival('')
    setDeparture('')
    setTransportMode('')
    setAdding(false)
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/destinations/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-cream flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-border shrink-0">
        <span className="font-mono text-xs text-muted uppercase tracking-wider">Stops</span>
      </div>

      <div className="flex-1 py-4">
        {destinations.length === 0 && (
          <p className="px-4 text-xs text-muted font-mono">No stops yet</p>
        )}

        <ol className="px-4">
          {destinations.map((d, i) => (
            <li key={d.id} className="relative group">
              {/* Transport mode badge between stops */}
              {i > 0 && (
                <div className="flex items-center gap-1.5 mb-2 pl-[11px]">
                  <div className="w-px h-4 bg-border" />
                  {d.transportMode ? (
                    <span className="font-mono text-[10px] text-muted bg-card border border-border rounded-full px-2 py-0.5 flex items-center gap-1">
                      <span>{transportIcon(d.transportMode)}</span>
                      <span>{TRANSPORT_MODES.find((m) => m.value === d.transportMode)?.label}</span>
                    </span>
                  ) : (
                    <div className="w-px h-4 bg-border" />
                  )}
                </div>
              )}

              <div className="flex items-start gap-3 pb-4">
                {/* Numbered dot */}
                <div className="shrink-0 mt-0.5">
                  <div className="w-[22px] h-[22px] rounded-full bg-accent border-2 border-cream shadow-sm flex items-center justify-center">
                    <span className="font-mono text-[9px] text-cream font-bold">{i + 1}</span>
                  </div>
                  {i < destinations.length - 1 && (
                    <div className="w-px h-full min-h-[8px] bg-border mx-auto mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm text-ink font-medium leading-snug">{d.name}</p>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all text-sm shrink-0 mt-0.5"
                    >
                      ×
                    </button>
                  </div>
                  {(d.arrival || d.departure) && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {[d.arrival, d.departure].filter(Boolean).map(formatDate).join(' → ')}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Add stop form */}
      <div className="px-4 pb-3 pt-2 border-t border-border shrink-0">
        {adding ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Togakushi Shrine, Nagano"
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-card focus:outline-none focus:border-accent"
            />
            <div className="flex gap-1.5">
              <input
                type="date"
                value={arrival}
                onChange={(e) => setArrival(e.target.value)}
                className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs bg-card focus:outline-none focus:border-accent"
              />
              <input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs bg-card focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-card focus:outline-none focus:border-accent text-muted"
            >
              <option value="">How are you getting here?</option>
              {TRANSPORT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.icon} {m.label}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { setAdding(false); setName('') }}
                className="flex-1 border border-border rounded-lg py-1.5 text-xs font-mono text-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="flex-1 bg-accent text-cream rounded-lg py-1.5 text-xs font-mono hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {loading ? '…' : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full border border-dashed border-border rounded-lg py-2 text-xs font-mono text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add stop
          </button>
        )}
      </div>

      <TravelersSection tripId={tripId} travelers={travelers} onUpdate={onUpdate} />
    </aside>
  )
}
