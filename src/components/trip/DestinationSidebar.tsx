'use client'

import { useState, useEffect, useRef } from 'react'
import type { Destination, Traveler } from '@/lib/types'
import { formatDate, TRANSPORT_MODES, haversineKm, wmoToEmoji } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

type WeatherInfo = { emoji: string; min: number; max: number; historical: boolean }

function SortableStop({
  dest,
  index,
  total,
  onDelete,
  distKm,
  weather,
}: {
  dest: Destination
  index: number
  total: number
  onDelete: (id: string) => void
  distKm?: number | null
  weather?: WeatherInfo | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dest.id, disabled: dest.id.startsWith('temp-') })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <li ref={setNodeRef} style={style} className="relative group">
      {index > 0 && (
        <div className="flex items-center gap-1.5 mb-2 pl-[10px]">
          <div className="w-px h-3 bg-border" />
          {(dest.transportMode || distKm != null) ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {dest.transportMode && (
                <span className="font-mono text-[10px] text-muted bg-card border border-border rounded-full px-2 py-0.5">
                  {TRANSPORT_MODES.find((m) => m.value === dest.transportMode)?.label ?? dest.transportMode}
                </span>
              )}
              {distKm != null && (
                <span className="font-mono text-[10px] text-muted">~{Math.round(distKm).toLocaleString()} km</span>
              )}
            </div>
          ) : (
            <div className="w-px h-3 bg-border" />
          )}
        </div>
      )}

      <div className="flex items-start gap-3 pb-4">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none text-border hover:text-muted transition-colors"
          aria-label="Drag to reorder"
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="3" cy="2.5" r="1.2" /><circle cx="7" cy="2.5" r="1.2" />
            <circle cx="3" cy="7" r="1.2" /><circle cx="7" cy="7" r="1.2" />
            <circle cx="3" cy="11.5" r="1.2" /><circle cx="7" cy="11.5" r="1.2" />
          </svg>
        </button>

        <div className="shrink-0 mt-0.5 flex flex-col items-center">
          <div className="w-[22px] h-[22px] rounded-full bg-accent border-2 border-cream shadow-sm flex items-center justify-center">
            <span className="font-mono text-[9px] text-cream font-bold">{index + 1}</span>
          </div>
          {index < total - 1 && (
            <div className="w-px flex-1 min-h-[8px] bg-border mt-1" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm text-ink font-medium leading-snug break-words">{dest.name}</p>
            {!dest.id.startsWith('temp-') && (
              <button
                onClick={() => onDelete(dest.id)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all text-sm shrink-0 mt-0.5"
              >
                ×
              </button>
            )}
          </div>
          {(dest.arrival || dest.departure) && (
            <p className="font-mono text-[10px] text-muted mt-0.5">
              {[dest.arrival, dest.departure].filter(Boolean).map(formatDate).join(' → ')}
            </p>
          )}
          {weather && (
            <p className="font-mono text-[10px] text-muted mt-0.5">
              {weather.emoji} {weather.min}°–{weather.max}°C{weather.historical ? ' (est)' : ''}
            </p>
          )}
          {dest.id.startsWith('temp-') && (
            <p className="font-mono text-[9px] text-muted/60 mt-0.5">saving…</p>
          )}
        </div>
      </div>
    </li>
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
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherInfo>>({})
  const geocodingRef = useRef<Set<string>>(new Set())
  const weatherFetchedRef = useRef<Set<string>>(new Set())

  useEffect(() => { setLocalDests(destinations) }, [destinations])

  useEffect(() => {
    localDests.forEach((dest) => {
      if (dest.lat != null || dest.id.startsWith('temp-') || geocodingRef.current.has(dest.id)) return
      geocodingRef.current.add(dest.id)
      fetch(`/api/geocode?q=${encodeURIComponent(dest.name)}`)
        .then((r) => r.json())
        .then((data: Array<{ lat: string; lon: string }>) => {
          if (!data?.[0]) return
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          setLocalDests((prev) => prev.map((d) => d.id === dest.id ? { ...d, lat, lng } : d))
          fetch(`/api/destinations/${dest.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: dest.name, country: dest.country, arrival: dest.arrival, departure: dest.departure, notes: dest.notes, lat, lng, order: dest.order }),
          })
        })
        .catch(() => {})
    })
  }, [localDests])

  useEffect(() => {
    localDests.forEach((dest) => {
      if (!dest.lat || !dest.lng || !dest.arrival || weatherFetchedRef.current.has(dest.id)) return
      weatherFetchedRef.current.add(dest.id)
      fetch(`/api/weather?lat=${dest.lat}&lng=${dest.lng}&date=${dest.arrival}`)
        .then((r) => r.json())
        .then((data) => {
          const code = data?.daily?.weathercode?.[0]
          const max = data?.daily?.temperature_2m_max?.[0]
          const min = data?.daily?.temperature_2m_min?.[0]
          if (code == null || max == null || min == null) return
          setWeatherMap((prev) => ({
            ...prev,
            [dest.id]: { emoji: wmoToEmoji(code), min: Math.round(min), max: Math.round(max), historical: !!data.historical },
          }))
        })
        .catch(() => {})
    })
  }, [localDests])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localDests.findIndex((d) => d.id === active.id)
    const newIndex = localDests.findIndex((d) => d.id === over.id)
    const reordered = arrayMove(localDests, oldIndex, newIndex)
    setLocalDests(reordered)

    await Promise.all(
      reordered.map((d, i) =>
        fetch(`/api/destinations/${d.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...d, order: i }),
        }),
      ),
    )
    onUpdate()
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localDests.map((d) => d.id)} strategy={verticalListSortingStrategy}>
            <ol className="px-4">
              {localDests.map((d, i) => {
                const prev = localDests[i - 1]
                const distKm =
                  i > 0 && prev?.lat != null && prev?.lng != null && d.lat != null && d.lng != null
                    ? haversineKm(prev.lat, prev.lng, d.lat, d.lng)
                    : null
                return (
                <SortableStop
                  key={d.id}
                  dest={d}
                  index={i}
                  total={localDests.length}
                  onDelete={handleDelete}
                  distKm={distKm}
                  weather={weatherMap[d.id] ?? null}
                />
              )
              })}
            </ol>
          </SortableContext>
        </DndContext>
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
