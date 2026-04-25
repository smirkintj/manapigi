'use client'

import { useState } from 'react'
import type { Accommodation, AccommodationRoom, Destination } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'

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

function AccommodationCard({
  acc,
  destinations,
  onUpdate,
}: {
  acc: Accommodation
  destinations: Destination[]
  onUpdate: () => void
}) {
  const [addingRoom, setAddingRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [guests, setGuests] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(false)

  const linkedDest = destinations.find((d) => d.id === acc.destinationId)
  const rooms = acc.rooms ?? []
  const totalPrice = rooms.reduce((s, r) => s + (r.price ?? 0), 0)

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
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {totalPrice > 0 && (
            <span className="font-mono text-sm text-ink font-semibold">RM {totalPrice.toFixed(2)}</span>
          )}
          <button onClick={remove} className="text-muted hover:text-red-500 text-sm transition-colors">×</button>
        </div>
      </div>

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
  onUpdate: () => void
}

export default function StayTab({ tripId, accommodations, destinations, onUpdate }: Props) {
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
      {accommodations.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-mono text-sm text-muted">No accommodations yet</p>
          <p className="font-mono text-xs text-muted mt-1">Add hotels, Airbnbs and assign rooms to people</p>
        </div>
      )}

      {accommodations.map((acc) => (
        <AccommodationCard key={acc.id} acc={acc} destinations={destinations} onUpdate={onUpdate} />
      ))}

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
