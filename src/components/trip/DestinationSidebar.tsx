'use client'

import { useState } from 'react'
import type { Destination } from '@/lib/types'

type Props = {
  tripId: string
  destinations: Destination[]
  onUpdate: () => void
}

export default function DestinationSidebar({ tripId, destinations, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/destinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), arrival: arrival || null, departure: departure || null }),
    })
    setLoading(false)
    setName('')
    setArrival('')
    setDeparture('')
    setAdding(false)
    onUpdate()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/destinations/${id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-cream flex flex-col h-full">
      <div className="px-4 pt-5 pb-3 border-b border-border">
        <span className="font-mono text-xs text-muted uppercase tracking-wider">Stops</span>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        {destinations.length === 0 && (
          <p className="px-4 text-xs text-muted font-mono py-2">No stops yet</p>
        )}

        <ol className="relative px-4">
          {destinations.map((d, i) => (
            <li key={d.id} className="relative pl-6 pb-5 last:pb-0 group">
              {/* timeline line */}
              {i < destinations.length - 1 && (
                <div className="absolute left-[9px] top-4 bottom-0 w-px bg-border" />
              )}
              {/* dot */}
              <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full border-2 border-accent bg-cream flex items-center justify-center">
                <span className="font-mono text-[8px] text-accent font-bold">{i + 1}</span>
              </div>

              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-sm text-ink font-medium leading-snug truncate">{d.name}</p>
                  {(d.arrival || d.departure) && (
                    <p className="font-mono text-[10px] text-muted mt-0.5">
                      {d.arrival && <span>{d.arrival}</span>}
                      {d.arrival && d.departure && <span> → </span>}
                      {d.departure && <span>{d.departure}</span>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all text-sm leading-none shrink-0 mt-0.5"
                  title="Remove stop"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border">
        {adding ? (
          <form onSubmit={handleAdd} className="space-y-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="City or place"
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
    </aside>
  )
}
