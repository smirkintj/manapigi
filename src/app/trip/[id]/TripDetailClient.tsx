'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Trip } from '@/lib/types'
import DestinationSidebar from '@/components/trip/DestinationSidebar'
import TripTabs from '@/components/trip/TripTabs'

const REFINE_EXAMPLES = [
  'Add a day trip to Nikko from Tokyo',
  'Add more dinner recommendations for each stop',
  'Extend the trip by 3 days in Osaka',
  'Add two more travelers: Charlie and Diana',
  'Cut the accommodation budget by 20%',
  'Add a walking tour on day 1 of each city',
]

function RefineModal({
  tripId,
  onClose,
  onApplied,
}: {
  tripId: string
  onClose: () => void
  onApplied: () => void
}) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ summary: string; applied: string[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refine = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`/api/trips/${tripId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setResult(data)
      onApplied()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg flex flex-col gap-4 p-5 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-ink">Refine with AI</h2>
            <p className="font-mono text-xs text-muted mt-0.5">Describe what you want to change or add</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="bg-accent-light/30 border border-accent/20 rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-accent mb-1.5">Applied</p>
              <p className="text-sm text-ink">{result.summary}</p>
              {result.applied.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {result.applied.map((a) => (
                    <span key={a} className="font-mono text-[10px] bg-accent text-cream px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setResult(null); setPrompt('') }}
                className="flex-1 border border-border rounded-lg font-mono text-sm py-2 text-muted hover:text-ink transition-colors"
              >
                Refine more
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-accent text-cream rounded-lg font-mono text-sm py-2 hover:bg-accent/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) refine() }}
                placeholder="e.g. Add more food spots in Tokyo, or extend the trip by 2 days in Osaka…"
                rows={3}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent resize-none"
              />
              <p className="font-mono text-[10px] text-muted mt-1">Cmd+Enter to apply</p>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Examples</p>
              <div className="flex flex-wrap gap-1.5">
                {REFINE_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="font-mono text-[10px] border border-border rounded-full px-2.5 py-1 text-muted hover:border-accent hover:text-accent transition-colors bg-cream/50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="font-mono text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="font-mono text-sm text-muted hover:text-ink px-4 py-2">
                Cancel
              </button>
              <button
                onClick={refine}
                disabled={!prompt.trim() || loading}
                className="bg-accent text-cream font-mono text-sm px-5 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {loading && <span className="w-3 h-3 rounded-full border-2 border-cream border-t-transparent animate-spin" />}
                {loading ? 'Refining…' : '✨ Apply'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function getCountdown(startDate: string | null | undefined, endDate: string | null | undefined) {
  if (!startDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const diffDays = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return { label: `${diffDays}d to go`, variant: 'upcoming' as const }
  if (endDate) {
    const [ey, em, ed] = endDate.split('-').map(Number)
    const end = new Date(ey, em - 1, ed)
    if (today <= end) return { label: 'In progress', variant: 'active' as const }
  } else if (diffDays === 0) {
    return { label: 'Today!', variant: 'active' as const }
  }
  return null
}

export default function TripDetailClient({ initialTrip }: { initialTrip: Trip }) {
  const [trip, setTrip] = useState<Trip>(initialTrip)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(trip.name)
  const [copied, setCopied] = useState(false)
  const [refineOpen, setRefineOpen] = useState(false)
  const router = useRouter()

  const refreshTrip = async () => {
    const res = await fetch(`/api/trips/${trip.id}`)
    setTrip(await res.json())
  }

  const saveName = async () => {
    if (!name.trim()) return
    await fetch(`/api/trips/${trip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: trip.description, coverEmoji: trip.coverEmoji, notes: trip.notes, currency: trip.currency }),
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

  const countdown = getCountdown(trip.startDate, trip.endDate)

  return (
    <div className="flex flex-col h-screen">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') { setName(trip.name); setEditingName(false) }
              }}
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

          {countdown && (
            <span className={`font-mono text-xs px-2 py-0.5 rounded-full shrink-0 ${
              countdown.variant === 'active'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {countdown.label}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setRefineOpen(true)}
              className="font-mono text-xs border border-accent/40 rounded-lg px-3 py-1.5 text-accent hover:bg-accent hover:text-cream transition-colors"
            >
              ✨ Refine
            </button>
            <button
              onClick={copyShare}
              className="font-mono text-xs border border-border rounded-lg px-3 py-1.5 text-muted hover:border-accent hover:text-accent transition-colors"
            >
              {copied ? '✓ Copied!' : 'Share link'}
            </button>
            <button
              onClick={deleteTrip}
              className="font-mono text-xs text-muted hover:text-red-500 transition-colors px-2"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DestinationSidebar
          tripId={trip.id}
          destinations={trip.destinations ?? []}
          travelers={trip.travelers ?? []}
          onUpdate={refreshTrip}
        />
        <main className="flex-1 overflow-hidden flex flex-col bg-cream">
          <TripTabs
            trip={trip}
            onUpdate={refreshTrip}
            onCurrencyChange={(c) => setTrip((t) => ({ ...t, currency: c }))}
          />
        </main>
      </div>

      {refineOpen && (
        <RefineModal
          tripId={trip.id}
          onClose={() => setRefineOpen(false)}
          onApplied={refreshTrip}
        />
      )}
    </div>
  )
}
