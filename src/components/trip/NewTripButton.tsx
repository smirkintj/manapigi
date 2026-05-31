'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import DatePicker from '@/components/ui/DatePicker'
import { CURRENCIES } from '@/lib/utils'

const QUICK_EMOJIS = ['✈️', '🏖️', '🏔️', '🗺️', '🎌', '🌏', '🚂', '⛵', '🏕️', '🎡']

const EXAMPLE_PROMPTS = [
  '7 days in Japan for 2 people, November 2026, budget RM8000, love food and temples',
  '5 days Bangkok solo trip, January 2026, budget RM3000, street food and nightlife',
  '10 days Europe: Paris, Amsterdam, Berlin for a couple, June 2026, budget USD5000',
]

type Tab = 'manual' | 'ai'

export default function NewTripButton() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('ai')
  const router = useRouter()

  // Manual form state
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✈️')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  // AI state
  const [prompt, setPrompt] = useState('')
  const [aiCurrency, setAiCurrency] = useState('MYR')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiStep, setAiStep] = useState('')

  const reset = () => {
    setName(''); setEmoji('✈️'); setDescription('')
    setCurrency('MYR'); setStartDate(''); setEndDate('')
    setPrompt(''); setAiError(null); setAiStep('')
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return
    setAiLoading(true)
    setAiError(null)
    setAiStep('Drafting your trip with DeepSeek…')
    try {
      const res = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), currency: aiCurrency }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAiError(data.error ?? 'Generation failed. Try again.')
        return
      }
      setAiStep('Done! Opening your trip…')
      setOpen(false)
      reset()
      router.push(`/trip/${data.tripId}`)
    } catch {
      setAiError('Network error. Check your connection and try again.')
    } finally {
      setAiLoading(false)
    }
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
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-accent-light/30 rounded-lg mb-4">
          <button
            onClick={() => setTab('ai')}
            className={`flex-1 font-mono text-xs py-1.5 rounded-md transition-colors ${
              tab === 'ai' ? 'bg-accent text-cream' : 'text-muted hover:text-ink'
            }`}
          >
            ✨ AI Draft
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`flex-1 font-mono text-xs py-1.5 rounded-md transition-colors ${
              tab === 'manual' ? 'bg-accent text-cream' : 'text-muted hover:text-ink'
            }`}
          >
            Manual
          </button>
        </div>

        {tab === 'ai' ? (
          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-muted block mb-1.5">Describe your trip</label>
              <textarea
                autoFocus
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAiGenerate() }}
                placeholder="7 days in Japan for 2 people, November 2026, budget RM8000, love food and temples"
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent resize-none"
              />
              <p className="font-mono text-[10px] text-muted mt-1">
                Include: destinations · duration · number of people · budget · interests · Cmd+Enter to generate
              </p>
            </div>

            <div>
              <label className="font-mono text-xs text-muted block mb-1.5">Base currency for budget</label>
              <select
                value={aiCurrency}
                onChange={(e) => setAiCurrency(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:border-accent"
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Example prompts */}
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] text-muted uppercase tracking-wider">Examples</p>
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="w-full text-left text-xs text-muted border border-border rounded-lg px-3 py-2 hover:border-accent hover:text-ink transition-colors bg-cream/50 leading-relaxed"
                >
                  {ex}
                </button>
              ))}
            </div>

            {aiError && (
              <p className="font-mono text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>
            )}

            {aiLoading && (
              <div className="flex items-center gap-2 py-1">
                <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                <p className="font-mono text-xs text-muted">{aiStep}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setOpen(false); reset() }}
                className="font-mono text-sm text-muted hover:text-ink px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAiGenerate}
                disabled={!prompt.trim() || aiLoading}
                className="bg-accent text-cream font-mono text-sm px-5 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Drafting…' : '✨ Draft my trip'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
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

            <div>
              <label className="font-mono text-xs text-muted block mb-1.5">Dates (optional)</label>
              <div className="flex gap-2">
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Start date" className="flex-1 text-sm" />
                <DatePicker value={endDate} onChange={setEndDate} placeholder="End date" className="flex-1 text-sm" />
              </div>
            </div>

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
        )}
      </Modal>
    </>
  )
}
