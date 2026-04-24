'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'

const EMOJIS = ['✈️', '🗺️', '🏖️', '🏔️', '🌍', '🚂', '🛳️', '🏕️', '🌴', '🗼', '🎡', '🍜']

export default function NewTripButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('✈️')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const reset = () => {
    setName('')
    setDescription('')
    setEmoji('✈️')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null, coverEmoji: emoji }),
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
          <div>
            <label className="font-mono text-xs text-muted block mb-2">Pick an emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    emoji === e
                      ? 'bg-accent-light border-2 border-accent'
                      : 'border border-border hover:bg-cream'
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
              placeholder="Bali 2026"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-cream focus:outline-none focus:border-accent"
            />
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
            <button
              type="button"
              onClick={() => { setOpen(false); reset() }}
              className="font-mono text-sm text-muted hover:text-ink px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Create trip'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
