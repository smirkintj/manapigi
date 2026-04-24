'use client'

import { useState, useRef } from 'react'

type Props = {
  tripId: string
  notes: string | null
  onUpdate: () => void
}

export default function NotesTab({ tripId, notes, onUpdate }: Props) {
  const [value, setValue] = useState(notes ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = async (text: string) => {
    setStatus('saving')
    await fetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: text }),
    })
    setStatus('saved')
    setTimeout(() => setStatus('idle'), 2000)
    onUpdate()
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setValue(text)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(text), 1200)
  }

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted uppercase tracking-wider">Notes</span>
        {status === 'saving' && <span className="font-mono text-xs text-muted">Saving…</span>}
        {status === 'saved' && <span className="font-mono text-xs text-accent">Saved</span>}
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Jot down anything — visa requirements, packing list, things to try, recommendations from friends…"
        className="flex-1 w-full bg-card border border-border rounded-xl px-4 py-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none leading-relaxed"
      />
    </div>
  )
}
