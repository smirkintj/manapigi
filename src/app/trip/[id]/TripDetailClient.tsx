'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Trip } from '@/lib/types'
import DestinationSidebar from '@/components/trip/DestinationSidebar'
import TripTabs from '@/components/trip/TripTabs'

type Props = {
  initialTrip: Trip
}

export default function TripDetailClient({ initialTrip }: Props) {
  const [trip, setTrip] = useState<Trip>(initialTrip)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(trip.name)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const refreshTrip = async () => {
    const res = await fetch(`/api/trips/${trip.id}`)
    const updated = await res.json()
    setTrip(updated)
  }

  const saveName = async () => {
    if (!name.trim()) return
    await fetch(`/api/trips/${trip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: trip.description, coverEmoji: trip.coverEmoji, notes: trip.notes }),
    })
    setTrip((t) => ({ ...t, name: name.trim() }))
    setEditingName(false)
  }

  const copyShare = async () => {
    const url = `${window.location.origin}/share/${trip.shareToken}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const deleteTrip = async () => {
    if (!confirm(`Delete "${trip.name}"? This can't be undone.`)) return
    await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top header */}
      <header className="border-b border-border bg-cream/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link href="/" className="font-mono text-xs text-muted hover:text-ink transition-colors">
            ← trips
          </Link>
          <span className="text-border">·</span>

          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(trip.name); setEditingName(false) } }}
              className="font-serif text-lg text-ink bg-transparent border-b border-accent focus:outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="font-serif text-lg text-ink hover:text-muted transition-colors text-left"
            >
              {trip.name}
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={copyShare}
              className="font-mono text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
            >
              {copied ? '✓ Copied!' : 'Share link'}
            </button>
            <button
              onClick={deleteTrip}
              className="font-mono text-xs text-muted hover:text-red-500 transition-colors px-2"
              title="Delete trip"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 overflow-hidden">
        <DestinationSidebar
          tripId={trip.id}
          destinations={trip.destinations ?? []}
          onUpdate={refreshTrip}
        />
        <main className="flex-1 overflow-hidden flex flex-col bg-cream">
          <TripTabs trip={trip} onUpdate={refreshTrip} />
        </main>
      </div>
    </div>
  )
}
