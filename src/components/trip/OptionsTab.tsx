'use client'

import { useState } from 'react'
import type { OptionGroup, OptionChoice } from '@/lib/types'
import { formatAmount, CURRENCIES } from '@/lib/utils'

const CATEGORIES = [
  { value: 'flight',        label: 'Flight' },
  { value: 'accommodation', label: 'Stay' },
  { value: 'transport',     label: 'Transport' },
  { value: 'other',         label: 'Other' },
] as const

// ── Single option row ─────────────────────────────────────────────────────────

function ChoiceRow({
  choice,
  index,
  readOnly,
  onUpdate,
}: {
  choice: OptionChoice
  index: number
  readOnly: boolean
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel]   = useState(choice.label)
  const [amount, setAmount] = useState(String(choice.amount))
  const [currency, setCurrency] = useState(choice.currency)
  const [timing, setTiming] = useState(choice.timing ?? '')
  const [notes, setNotes]   = useState(choice.notes ?? '')

  const save = async () => {
    await fetch(`/api/option-choices/${choice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, amount, currency, timing: timing || null, notes: notes || null }),
    })
    setEditing(false)
    onUpdate()
  }

  const remove = async () => {
    await fetch(`/api/option-choices/${choice.id}`, { method: 'DELETE' })
    onUpdate()
  }

  if (editing) {
    return (
      <div className="bg-accent-light/20 border border-accent/20 rounded-lg p-3 space-y-2 my-1">
        <div className="flex gap-2 flex-wrap">
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. AirAsia AA123)"
            className="flex-1 min-w-40 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent" />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="border border-border rounded px-2 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="any" placeholder="0"
            className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right" />
        </div>
        <input value={timing} onChange={(e) => setTiming(e.target.value)}
          placeholder="Timing (e.g. 08:30–13:45, 5h 15m)"
          className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (layovers, luggage, location…)" rows={2}
          className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none" />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-2.5 border-t border-border first:border-0">
      <span className="font-mono text-xs text-muted w-5 pt-0.5 shrink-0 text-right">{index + 1}.</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink font-medium">{choice.label}</p>
        {choice.timing && <p className="font-mono text-xs text-muted mt-0.5">{choice.timing}</p>}
        {choice.notes  && <p className="text-xs text-muted mt-0.5">{choice.notes}</p>}
      </div>
      <div className="shrink-0 flex items-start gap-3">
        <p className="font-mono text-sm font-semibold text-ink">{formatAmount(choice.amount, choice.currency)}</p>
        {!readOnly && (
          <div className="flex gap-1.5 pt-0.5">
            <button onClick={() => setEditing(true)} className="font-mono text-[10px] text-muted hover:text-ink">edit</button>
            <button onClick={remove} className="font-mono text-[10px] text-muted hover:text-red-500">del</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Option group card ─────────────────────────────────────────────────────────

function GroupCard({
  group,
  readOnly,
  onUpdate,
}: {
  group: OptionGroup
  readOnly: boolean
  onUpdate: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel]   = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const [timing, setTiming] = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)

  const choices = group.choices ?? []

  const addChoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true)
    await fetch(`/api/option-groups/${group.id}/choices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), amount, currency, timing: timing || null, notes: notes || null }),
    })
    setLoading(false)
    setLabel(''); setAmount(''); setCurrency('MYR'); setTiming(''); setNotes('')
    setAdding(false)
    onUpdate()
  }

  const deleteGroup = async () => {
    if (!confirm(`Delete "${group.title}"?`)) return
    await fetch(`/api/option-groups/${group.id}`, { method: 'DELETE' })
    onUpdate()
  }

  const catLabel = CATEGORIES.find((c) => c.value === group.category)?.label ?? 'Other'

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{catLabel}</span>
          <span className="text-border">·</span>
          <p className="font-medium text-sm text-ink">{group.title}</p>
        </div>
        {!readOnly && (
          <button onClick={deleteGroup} className="text-muted hover:text-red-500 text-sm transition-colors">×</button>
        )}
      </div>

      {/* Choices */}
      <div className="px-4">
        {choices.length === 0 && !adding && (
          <p className="font-mono text-xs text-muted py-3">No options yet — add one below</p>
        )}
        {choices.map((c, i) => (
          <ChoiceRow key={c.id} choice={c} index={i} readOnly={readOnly} onUpdate={onUpdate} />
        ))}

        {!readOnly && (
          adding ? (
            <form onSubmit={addChoice} className="border-t border-border py-3 space-y-2 first:border-0">
              <div className="flex gap-2 flex-wrap">
                <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label"
                  className="flex-1 min-w-40 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent" />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="border border-border rounded px-2 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="any" placeholder="0"
                  className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right" />
              </div>
              <input value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="Timing (optional)"
                className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent" />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
                className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAdding(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
                <button type="submit" disabled={!label.trim() || loading}
                  className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90 disabled:opacity-50">
                  {loading ? '…' : 'Add'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAdding(true)}
              className="w-full text-left font-mono text-xs text-muted hover:text-accent py-2.5 border-t border-border first:border-0 transition-colors">
              + Add option
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────────

type Props = {
  tripId: string
  optionGroups: OptionGroup[]
  readOnly?: boolean
  onUpdate: () => void
}

export default function OptionsTab({ tripId, optionGroups, readOnly = false, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle]   = useState('')
  const [category, setCategory] = useState('flight')
  const [loading, setLoading] = useState(false)

  const addGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/option-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category }),
    })
    setLoading(false)
    setTitle('')
    setCategory('flight')
    setAdding(false)
    onUpdate()
  }

  return (
    <div className="space-y-4">
      {optionGroups.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-mono text-sm text-muted">No options yet</p>
          <p className="font-mono text-xs text-muted mt-1">
            Add groups to compare flights, stays, and transport costs with your group
          </p>
        </div>
      )}

      {optionGroups.map((g) => (
        <GroupCard key={g.id} group={g} readOnly={readOnly} onUpdate={onUpdate} />
      ))}

      {!readOnly && (
        adding ? (
          <form onSubmit={addGroup} className="border border-border rounded-xl p-4 space-y-3 bg-card">
            <div className="flex gap-2">
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Outbound Flight KUL → NRT"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:border-accent" />
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="border border-border rounded-lg px-2.5 py-2 text-sm bg-cream focus:outline-none focus:border-accent">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)} className="font-mono text-sm text-muted hover:text-ink">Cancel</button>
              <button type="submit" disabled={!title.trim() || loading}
                className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50">
                {loading ? '…' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full border border-dashed border-border rounded-xl py-3 text-sm font-mono text-muted hover:border-accent hover:text-accent transition-colors">
            + Add option group
          </button>
        )
      )}
    </div>
  )
}
