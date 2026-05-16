'use client'

import { useState, useEffect } from 'react'
import type { Accommodation, AccommodationRoom, BudgetCategory, BudgetItem, Destination } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'
import type { AreaInsight } from '@/app/api/area-insights/route'

const PRICE_TIER: Record<string, string> = { budget: '💸', mid: '💳', luxury: '💎' }

function AreaInsightsPanel({ destinations }: { destinations: Destination[] }) {
  const dests = destinations.filter((d) => d.name)
  const [selectedId, setSelectedId] = useState<string>(dests[0]?.id ?? '')
  const [insights, setInsights] = useState<AreaInsight[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const selected = dests.find((d) => d.id === selectedId) ?? dests[0]

  const fetchInsights = async (dest: Destination) => {
    setLoading(true)
    setError(null)
    setInsights(null)
    try {
      const params = new URLSearchParams({ city: dest.name })
      if (dest.country) params.set('country', dest.country)
      const res = await fetch(`/api/area-insights?${params}`)
      if (!res.ok) throw new Error(await res.text())
      setInsights(await res.json())
    } catch {
      setError('Could not load insights. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggle = () => {
    if (!open) {
      setOpen(true)
      if (!insights && selected) fetchInsights(selected)
    } else {
      setOpen(false)
    }
  }

  const changeDest = (id: string) => {
    setSelectedId(id)
    const dest = dests.find((d) => d.id === id)
    if (dest) { setInsights(null); fetchInsights(dest) }
  }

  if (dests.length === 0) return null

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent-light/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-accent">✦ AI Insights</span>
          <span className="text-border">·</span>
          <span className="text-sm font-medium text-ink">Best areas to stay</span>
        </div>
        <span className="font-mono text-xs text-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {dests.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {dests.map((d) => (
                <button
                  key={d.id}
                  onClick={() => changeDest(d.id)}
                  className={`font-mono text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    d.id === selectedId
                      ? 'bg-accent text-cream border-accent'
                      : 'border-border text-muted hover:border-accent hover:text-accent'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center">
              <span className="font-mono text-xs text-muted animate-pulse">Asking Claude for local insights…</span>
            </div>
          )}

          {error && (
            <p className="font-mono text-xs text-red-500 py-2">{error}</p>
          )}

          {insights && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.map((area) => (
                <div key={area.name} className="border border-border rounded-lg p-3 space-y-1.5 bg-cream/50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-ink">{area.name}</p>
                    <span title={area.price_tier}>{PRICE_TIER[area.price_tier] ?? ''}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {area.vibe.map((v) => (
                      <span key={v} className="font-mono text-[10px] bg-accent-light text-accent border border-accent/20 px-1.5 py-0.5 rounded-full">
                        {v}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{area.best_for}</p>
                  <p className="font-mono text-[10px] text-muted border-t border-border pt-1.5 mt-1">💡 {area.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TYPES = ['hotel', 'airbnb', 'hostel', 'guesthouse', 'other'] as const

function RoomRow({ room, onUpdate }: { room: AccommodationRoom; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(room.name)
  const [guests, setGuests] = useState(room.guests ?? '')
  const [price, setPrice] = useState(String(room.price ?? 0))

  const save = async () => {
    await fetch(`/api/accommodation-rooms/${room.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, guests: guests || null, price }),
    })
    setEditing(false)
    onUpdate()
  }

  const remove = async () => {
    await fetch(`/api/accommodation-rooms/${room.id}`, { method: 'DELETE' })
    onUpdate()
  }

  if (editing) {
    return (
      <div className="border border-accent/20 rounded-lg p-3 space-y-2 bg-accent-light/20">
        <div className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Room 1 / Master Room"
            className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="any"
            placeholder="0.00"
            className="w-24 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
          />
        </div>
        <input
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Alice, Bob (comma-separated)"
          className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between group py-2">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
        <div>
          <p className="text-sm text-ink font-medium">{room.name}</p>
          {room.guests && <p className="font-mono text-xs text-muted mt-0.5">{room.guests}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {room.price != null && room.price > 0 && (
          <span className="font-mono text-sm text-ink">RM {room.price.toFixed(2)}</span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-xs font-mono">edit</button>
          <button onClick={remove} className="text-muted hover:text-red-500 text-xs font-mono">del</button>
        </div>
      </div>
    </div>
  )
}

const STATUS_DOT: Record<string, string> = { done: '✓', in_progress: '◑', pending: '○' }

function AccommodationCard({
  acc,
  destinations,
  linkedItems,
  onUpdate,
}: {
  acc: Accommodation
  destinations: Destination[]
  linkedItems: BudgetItem[]
  onUpdate: () => void
}) {
  const [addingRoom, setAddingRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [guests, setGuests] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(acc.name)
  const [editType, setEditType] = useState(acc.type ?? 'hotel')
  const [editDestId, setEditDestId] = useState(acc.destinationId ?? '')
  const [editCheckIn, setEditCheckIn] = useState(acc.checkIn ?? '')
  const [editCheckOut, setEditCheckOut] = useState(acc.checkOut ?? '')
  const [editNotes, setEditNotes] = useState(acc.notes ?? '')

  const linkedDest = destinations.find((d) => d.id === acc.destinationId)
  const rooms = acc.rooms ?? []
  const totalPrice = rooms.reduce((s, r) => s + (r.price ?? 0), 0)

  const saveEdit = async () => {
    await fetch(`/api/accommodations/${acc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim() || acc.name,
        type: editType,
        destinationId: editDestId || null,
        checkIn: editCheckIn || null,
        checkOut: editCheckOut || null,
        notes: editNotes.trim() || null,
      }),
    })
    setEditing(false)
    onUpdate()
  }

  const addRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return
    setLoading(true)
    await fetch(`/api/accommodations/${acc.id}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName.trim(), guests: guests || null, price }),
    })
    setLoading(false)
    setRoomName('')
    setGuests('')
    setPrice('')
    setAddingRoom(false)
    onUpdate()
  }

  const remove = async () => {
    if (!confirm(`Delete "${acc.name}"?`)) return
    await fetch(`/api/accommodations/${acc.id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {editing ? (
        <div className="px-4 py-3.5 space-y-2.5 border-b border-border">
          <div className="flex gap-2">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Accommodation name"
              className="flex-1 border border-border rounded-lg px-2.5 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
            />
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {destinations.length > 0 && (
            <select
              value={editDestId}
              onChange={(e) => setEditDestId(e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent text-muted"
            >
              <option value="">No stop linked</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <DatePicker value={editCheckIn} onChange={setEditCheckIn} placeholder="Check-in" className="flex-1 text-sm" />
            <DatePicker value={editCheckOut} onChange={setEditCheckOut} placeholder="Check-out" className="flex-1 text-sm" />
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Notes — address, wifi password, contact…"
            rows={3}
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent resize-none"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
            <button onClick={saveEdit} className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded-lg hover:bg-accent/90">Save</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-light border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-mono text-[10px] font-bold text-accent uppercase">{(acc.type ?? 'stay')[0]}</span>
            </div>
            <div>
              <p className="font-medium text-ink text-sm">{acc.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-xs text-muted capitalize">{acc.type}</span>
                {linkedDest && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono text-xs text-muted">{linkedDest.name}</span>
                  </>
                )}
                {(acc.checkIn || acc.checkOut) && (
                  <>
                    <span className="text-border">·</span>
                    <span className="font-mono text-xs text-muted">
                      {[acc.checkIn, acc.checkOut].filter(Boolean).map(formatDate).join(' → ')}
                    </span>
                  </>
                )}
              </div>
              {acc.notes && (
                <p className="text-xs text-muted mt-1.5 whitespace-pre-wrap">{acc.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {totalPrice > 0 && (
              <span className="font-mono text-sm text-ink font-semibold">RM {totalPrice.toFixed(2)}</span>
            )}
            <button onClick={() => setEditing(true)} className="font-mono text-[10px] text-muted hover:text-ink transition-colors">edit</button>
            <button onClick={remove} className="text-muted hover:text-red-500 text-sm transition-colors">×</button>
          </div>
        </div>
      )}

      {linkedItems.length > 0 && (
        <div className="px-4 py-2 border-b border-border bg-accent-light/10">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1.5">Budget items</p>
          <div className="space-y-1">
            {linkedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] text-muted font-mono shrink-0">
                    {STATUS_DOT[item.bookingStatus] ?? '○'}
                  </span>
                  <span className="text-xs text-ink truncate">{item.label}</span>
                  {item.deadline && (
                    <span className="font-mono text-[10px] text-muted shrink-0">· {formatDate(item.deadline)}</span>
                  )}
                </div>
                <span className="font-mono text-xs text-ink shrink-0">
                  {item.itemCurrency} {item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 divide-y divide-border">
        {rooms.map((room) => (
          <RoomRow key={room.id} room={room} onUpdate={onUpdate} />
        ))}

        {addingRoom ? (
          <form onSubmit={addRoom} className="py-3 space-y-2">
            <div className="flex gap-2">
              <input
                autoFocus
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name"
                className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
              />
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                step="any"
                placeholder="Price"
                className="w-24 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
              />
            </div>
            <input
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Guests (Alice, Bob)"
              className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAddingRoom(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90 disabled:opacity-50"
              >
                {loading ? '…' : 'Add room'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingRoom(true)}
            className="w-full text-left text-xs font-mono text-muted hover:text-accent py-2.5 transition-colors"
          >
            + Add room / assignment
          </button>
        )}
      </div>
    </div>
  )
}

type Props = {
  tripId: string
  accommodations: Accommodation[]
  destinations: Destination[]
  budgetCategories?: BudgetCategory[]
  onUpdate: () => void
}

export default function StayTab({ tripId, accommodations, destinations, budgetCategories, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('hotel')
  const [destinationId, setDestinationId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [loading, setLoading] = useState(false)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/accommodations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        type,
        destinationId: destinationId || null,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
      }),
    })
    setLoading(false)
    setName('')
    setType('hotel')
    setDestinationId('')
    setCheckIn('')
    setCheckOut('')
    setAdding(false)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <AreaInsightsPanel destinations={destinations} />

      {accommodations.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-mono text-sm text-muted">No accommodations yet</p>
          <p className="font-mono text-xs text-muted mt-1">Add hotels, Airbnbs and assign rooms to people</p>
        </div>
      )}

      {accommodations.map((acc) => {
        const linked = (budgetCategories ?? []).flatMap((c) =>
          (c.items ?? []).filter((it) => it.accommodationId === acc.id),
        )
        return (
          <AccommodationCard
            key={acc.id}
            acc={acc}
            destinations={destinations}
            linkedItems={linked}
            onUpdate={onUpdate}
          />
        )
      })}

      {adding ? (
        <form onSubmit={add} className="border border-border rounded-xl p-4 space-y-3 bg-card">
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Accommodation name"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:border-accent"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-2 text-sm bg-cream focus:outline-none focus:border-accent"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {destinations.length > 0 && (
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-cream focus:outline-none focus:border-accent text-muted"
            >
              <option value="">Link to a stop (optional)</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <DatePicker value={checkIn} onChange={setCheckIn} placeholder="Check-in" className="flex-1 text-sm" />
            <DatePicker value={checkOut} onChange={setCheckOut} placeholder="Check-out" className="flex-1 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="font-mono text-sm text-muted hover:text-ink">Cancel</button>
            <button type="submit" disabled={!name.trim() || loading}
              className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {loading ? '…' : 'Add'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm font-mono text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add accommodation
        </button>
      )}
    </div>
  )
}
