'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import type { Destination, ItineraryItem } from '@/lib/types'
import { formatDate } from '@/lib/utils'

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({ item, onUpdate }: { item: ItineraryItem; onUpdate: () => void }) {
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
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00"
            className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent" />
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity title"
            className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent" />
        </div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes (optional)" rows={2}
          className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none" />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 group py-1.5">
      {item.time && <span className="font-mono text-xs text-muted w-12 pt-0.5 shrink-0">{item.time}</span>}
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

// ── Destination activities panel ──────────────────────────────────────────────

function DestinationPanel({ dest, onUpdate }: { dest: Destination; onUpdate: () => void }) {
  const [localItems, setLocalItems] = useState<ItineraryItem[]>(dest.itineraryItems ?? [])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => { setLocalItems(dest.itineraryItems ?? []) }, [dest.itineraryItems])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const optimistic: ItineraryItem = {
      id: `temp-${Date.now()}`,
      destinationId: dest.id,
      day: day ? parseInt(day) : null,
      time: time || null,
      title: title.trim(),
      description: desc.trim() || null,
      order: localItems.length,
    }
    setLocalItems((prev) => [...prev, optimistic])
    setTitle(''); setDesc(''); setDay(''); setTime(''); setOpen(false)
    await fetch(`/api/destinations/${dest.id}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: optimistic.title, description: optimistic.description, day: optimistic.day, time: optimistic.time }),
    })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-accent-light/20">
        <h3 className="font-serif text-base text-ink">{dest.name}</h3>
        {(dest.arrival || dest.departure) && (
          <span className="font-mono text-xs text-muted">
            {[dest.arrival, dest.departure].filter(Boolean).map(formatDate).join(' → ')}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-0.5">
        {localItems.length === 0 && (
          <p className="text-xs text-muted font-mono py-1">No activities yet</p>
        )}
        {localItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onUpdate={() => { setLocalItems((prev) => prev.filter((i) => i.id !== item.id)); onUpdate() }}
          />
        ))}
      </div>

      <div className="px-4 pb-3">
        {open ? (
          <form onSubmit={submit} className="border border-border rounded-lg p-3 space-y-2 bg-cream">
            <div className="flex gap-2">
              <input value={day} onChange={(e) => setDay(e.target.value)} placeholder="Day" type="number" min={1}
                className="w-14 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent" />
              <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00"
                className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent" />
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity"
                className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent" />
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Notes (optional)" rows={2}
              className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
              <button type="submit" disabled={!title.trim()}
                className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90 disabled:opacity-50">Add</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} className="text-xs font-mono text-muted hover:text-accent transition-colors">
            + Add activity
          </button>
        )}
      </div>
    </div>
  )
}

// ── Route flow with SVG wrap curves ──────────────────────────────────────────

function RouteFlow({
  destinations,
  activeId,
  onSelect,
}: {
  destinations: Destination[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<(HTMLDivElement | null)[]>([])
  const [rowBreaks, setRowBreaks] = useState<Set<number>>(new Set())
  const [svgPaths, setSvgPaths] = useState<{ d: string; tipX: number; tipY: number }[]>([])

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    const breaks = new Set<number>()
    const paths: { d: string; tipX: number; tipY: number }[] = []
    const r = 10

    for (let i = 0; i < destinations.length - 1; i++) {
      const a = chipRefs.current[i]
      const b = chipRefs.current[i + 1]
      if (!a || !b) continue
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      if (br.top <= ar.top + 5) continue

      breaks.add(i)
      const x1 = ar.right - cRect.left + 4
      const y1 = ar.top + ar.height / 2 - cRect.top
      const y2 = br.top + br.height / 2 - cRect.top
      const cW = cRect.width

      const d = [
        `M ${x1} ${y1}`,
        `H ${cW - r}`,
        `A ${r} ${r} 0 0 1 ${cW} ${y1 + r}`,
        `V ${y2 - r}`,
        `A ${r} ${r} 0 0 1 ${cW - r} ${y2}`,
        `H ${cW - r - 8}`,
      ].join(' ')

      paths.push({ d, tipX: cW - r - 8, tipY: y2 })
    }

    setRowBreaks(breaks)
    setSvgPaths(paths)
  }, [destinations.length])

  useEffect(() => {
    const t = setTimeout(measure, 60)
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { clearTimeout(t); ro.disconnect() }
  }, [measure, destinations])

  return (
    <div ref={containerRef} className="relative py-3">
      <div className="flex flex-wrap items-center gap-y-8">
        {destinations.map((dest, i) => {
          const count = (dest.itineraryItems ?? []).length
          const isActive = activeId === dest.id
          return (
            <Fragment key={dest.id}>
              <div
                ref={(el) => { chipRefs.current[i] = el }}
                onClick={() => onSelect(dest.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 cursor-pointer transition-all select-none ${
                  isActive
                    ? 'bg-accent border-accent text-cream shadow-sm'
                    : 'bg-card border-border text-ink hover:border-accent'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shrink-0 ${
                  isActive ? 'bg-cream/20 text-cream' : 'bg-accent text-cream'
                }`}>
                  {i + 1}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">{dest.name}</span>
                {count > 0 && (
                  <span className={`font-mono text-[9px] rounded-full px-1.5 py-0.5 ${
                    isActive ? 'bg-cream/20 text-cream' : 'bg-accent/10 text-accent'
                  }`}>
                    {count}
                  </span>
                )}
              </div>
              {i < destinations.length - 1 && !rowBreaks.has(i) && (
                <span className="font-mono text-muted px-2 select-none">→</span>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* SVG overlay: U-curves at row wraps */}
      {svgPaths.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          {svgPaths.map((p, i) => (
            <g key={i}>
              <path d={p.d} stroke="#e2dfd7" strokeWidth="1.5" fill="none" />
              {/* Left-pointing arrowhead */}
              <polygon
                points={`${p.tipX},${p.tipY} ${p.tipX + 7},${p.tipY - 4} ${p.tipX + 7},${p.tipY + 4}`}
                fill="#e2dfd7"
              />
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

type Props = { destinations: Destination[]; onUpdate: () => void }

export default function ItineraryTab({ destinations, onUpdate }: Props) {
  const [activeId, setActiveId] = useState<string | null>(destinations[0]?.id ?? null)

  useEffect(() => {
    if (!activeId && destinations.length > 0) setActiveId(destinations[0].id)
  }, [destinations])

  if (destinations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="font-mono text-sm text-muted">Add stops first to plan your itinerary</p>
      </div>
    )
  }

  const activeDest = destinations.find((d) => d.id === activeId)

  const handleSelect = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-5">
      <RouteFlow destinations={destinations} activeId={activeId} onSelect={handleSelect} />
      {activeDest && <DestinationPanel key={activeDest.id} dest={activeDest} onUpdate={onUpdate} />}
    </div>
  )
}
