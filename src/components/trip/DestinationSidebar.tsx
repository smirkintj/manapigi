'use client'

import { useState, useEffect } from 'react'
import type { Destination, Traveler } from '@/lib/types'
import { formatDate, TRANSPORT_MODES } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'

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
    <div className="px-4 py-3 border-t border-border shrink-0">
      <span className="font-mono text-xs text-muted uppercase tracking-wider">People</span>
      <div className="mt-2 space-y-1">
        {travelers.map((t) => (
          <div key={t.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-accent-light border border-accent/30 flex items-center justify-center shrink-0">
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

type Props = {
  tripId: string
  destinations: Destination[]
  travelers: Traveler[]
  onUpdate: () => void
}

export default function DestinationSidebar({ tripId, destinations, travelers, onUpdate }: Props) {
  const [localDests, setLocalDests] = useState<Destination[]>(destinations)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [transportMode, setTransportMode] = useState('')

  useEffect(() => { setLocalDests(destinations) }, [destinations])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const optimistic: Destination = {
      id: `temp-${Date.now()}`,
      tripId,
      name: name.trim(),
      country: null,
      lat: null,
      lng: null,
      arrival: arrival || null,
      departure: departure || null,
      notes: null,
      transportMode: transportMode || null,
      order: localDests.length,
      itineraryItems: [],
    }
    setLocalDests((prev) => [...prev, optimistic])
    setName('')
    setArrival('')
    setDeparture('')
    setTransportMode('')
    setAdding(false)

    await fetch(`/api/trips/${tripId}/destinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: optimistic.name,
        arrival: optimistic.arrival,
        departure: optimistic.departure,
        transportMode: optimistic.transportMode,
      }),
    })
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    setLocalDests((prev) => prev.filter((d) => d.id !== id))
    await fetch(`/api/destinations/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-cream flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-5 pb-3 border-b border-border shrink-0">
        <span className="font-mono text-xs text-muted uppercase tracking-wider">Stops</span>
      </div>

      {/* Scrollable destinations list */}
      <div className="flex-1 overflow-y-auto py-4">
        {localDests.length === 0 && (
          <p className="px-4 text-xs text-muted font-mono">No stops yet</p>
        )}
        <ol className="px-4">
          {localDests.map((d, i) => (
            <li key={d.id} className="relative group">
              {i > 0 && (
                <div className="flex items-center gap-1.5 mb-2 pl-[10px]">
                  <div className="w-px h-3 bg-border" />
                  {d.transportMode && (
                    <span className="font-mono text-[10px] text-muted bg-card border border-border rounded-full px-2 py-0.5">
                      {TRANSPORT_MODES.find((m) => m.value === d.transportMode)?.label ?? d.transportMode}
                    </span>
                  )}
                  {!d.transportMode && <div className="w-px h-3 bg-border" />}
                </div>
              )}

              <div className="flex items-start gap-3 pb-4">
                <div className="shrink-0 mt-0.5 flex flex-col items-center">
                  <div className="w-[22px] h-[22px] rounded-full bg-accent border-2 border-cream shadow-sm flex items-center justify-center">
                    <span className="font-mono text-[9px] text-cream font-bold">{i + 1}</span>
                  </div>
                  {i < localDests.length - 1 && (
                    <div className="w-px flex-1 min-h-[8px] bg-border mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm text-ink font-medium leading-snug break-words">{d.name}</p>
                    {!d.id.startsWith('temp-') && (
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all text-sm shrink-0 mt-0.5"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {(d.arrival || d.departure) && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {[d.arrival, d.departure].filter(Boolean).map(formatDate).join(' → ')}
                    </p>
                  )}
                  {d.id.startsWith('temp-') && (
                    <p className="font-mono text-[9px] text-muted/60 mt-0.5">saving…</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Add stop form — always visible */}
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
              <DatePicker
                value={arrival}
                onChange={setArrival}
                placeholder="Arrive"
                className="flex-1 text-xs"
              />
              <DatePicker
                value={departure}
                onChange={setDeparture}
                placeholder="Leave"
                className="flex-1 text-xs"
              />
            </div>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-xs bg-card focus:outline-none focus:border-accent text-muted"
            >
              <option value="">How are you getting here?</option>
              {TRANSPORT_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
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
                disabled={!name.trim()}
                className="flex-1 bg-accent text-cream rounded-lg py-1.5 text-xs font-mono hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                Add
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
