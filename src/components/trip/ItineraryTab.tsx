'use client'

import { useState } from 'react'
import type { Destination, ItineraryItem } from '@/lib/types'

type Props = {
  destinations: Destination[]
  onUpdate: () => void
}

function ItemRow({
  item,
  onUpdate,
}: {
  item: ItineraryItem
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [desc, setDesc] = useState(item.description ?? '')
  const [time, setTime] = useState(item.time ?? '')

  const save = async () => {
    await fetch(`/api/itinerary/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc || null, day: item.day, time: time || null }),
    })
    setEditing(false)
    onUpdate()
  }

  const remove = async () => {
    await fetch(`/api/itinerary/${item.id}`, { method: 'DELETE' })
    onUpdate()
  }

  if (editing) {
    return (
      <div className="border border-accent/30 rounded-lg p-3 space-y-2 bg-accent-light/30">
        <div className="flex gap-2">
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="10:00"
            className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
          />
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Activity title"
            className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
          />
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 group py-1.5">
      {item.time && (
        <span className="font-mono text-xs text-muted w-12 pt-0.5 shrink-0">{item.time}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink">{item.title}</p>
        {item.description && <p className="text-xs text-muted mt-0.5">{item.description}</p>}
      </div>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-xs font-mono">edit</button>
        <button onClick={remove} className="text-muted hover:text-red-500 text-xs font-mono">del</button>
      </div>
    </div>
  )
}

function AddItemForm({
  destinationId,
  onAdd,
}: {
  destinationId: string
  onAdd: () => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await fetch(`/api/destinations/${destinationId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: desc.trim() || null,
        day: day ? parseInt(day) : null,
        time: time || null,
      }),
    })
    setLoading(false)
    setTitle('')
    setDesc('')
    setDay('')
    setTime('')
    setOpen(false)
    onAdd()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-muted hover:text-accent transition-colors mt-2"
      >
        + Add activity
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-3 border border-border rounded-lg p-3 space-y-2 bg-card">
      <div className="flex gap-2">
        <input
          value={day}
          onChange={(e) => setDay(e.target.value)}
          placeholder="Day"
          type="number"
          min={1}
          className="w-16 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
        />
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="10:00"
          className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
        />
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Activity"
          className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
        />
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? '…' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export default function ItineraryTab({ destinations, onUpdate }: Props) {
  if (destinations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono text-sm text-muted">Add stops first to plan your itinerary</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {destinations.map((dest) => (
        <div key={dest.id}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-serif text-base text-ink">{dest.name}</h3>
            {(dest.arrival || dest.departure) && (
              <span className="font-mono text-xs text-muted">
                {dest.arrival}{dest.arrival && dest.departure ? ' → ' : ''}{dest.departure}
              </span>
            )}
          </div>

          <div className="pl-3 border-l-2 border-border space-y-0.5">
            {(dest.itineraryItems ?? []).length === 0 && (
              <p className="text-xs text-muted font-mono">No activities yet</p>
            )}
            {(dest.itineraryItems ?? []).map((item) => (
              <ItemRow key={item.id} item={item} onUpdate={onUpdate} />
            ))}
          </div>

          <AddItemForm destinationId={dest.id} onAdd={onUpdate} />
        </div>
      ))}
    </div>
  )
}
