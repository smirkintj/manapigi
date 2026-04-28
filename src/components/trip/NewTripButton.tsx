'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import DatePicker from '@/components/ui/DatePicker'
import { CURRENCIES } from '@/lib/utils'

const QUICK_EMOJIS = ['✈️', '🏖️', '🏔️', '🗺️', '🎌', '🌏', '🚂', '⛵', '🏕️', '🎡']

export default function NewTripButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✈️')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const reset = () => {
    setName(''); setEmoji('✈️'); setDescription('')
    setCurrency('MYR'); setStartDate(''); setEndDate('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        coverEmoji: emoji,
        currency,
        startDate: startDate || null,
        endDate: endDate || null,
      }),
    })
    const trip = await res.json()
    setLoading(false)
    setOpen(false)
    reset()
    router.push(`/trip/${trip.id}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
      >
        + New trip
      </button>

      <Modal open={open} onClose={() => { setOpen(false); reset() }} title="New trip">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji + name */}
          <div className="space-y-2">
            <label className="font-mono text-xs text-muted block">Quick emoji</label>
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    emoji === e ? 'bg-accent/15 border-2 border-accent' : 'bg-cream border border-border hover:border-accent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-mono text-xs text-muted block mb-1.5">Trip name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Japan 2026"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent"
            />
          </div>

          {/* Dates */}
          <div>
            <label className="font-mono text-xs text-muted block mb-1.5">Dates (optional)</label>
            <div className="flex gap-2">
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" className="flex-1 text-sm" />
              <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" className="flex-1 text-sm" />
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="font-mono text-xs text-muted block mb-1.5">Base currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="font-mono text-xs text-muted block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Two weeks exploring..."
              rows={2}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => { setOpen(false); reset() }}
              className="font-mono text-sm text-muted hover:text-ink px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim() || loading}
              className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
