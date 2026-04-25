'use client'

import { useState, useEffect } from 'react'
import type { OptionGroup, OptionChoice } from '@/lib/types'
import { formatAmount, CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils'

const CATEGORIES = [
  { value: 'flight', label: 'Flight' },
  { value: 'accommodation', label: 'Stay' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
] as const

const CAT_STYLE: Record<string, string> = {
  flight: 'bg-blue-50 text-blue-700 border-blue-200',
  accommodation: 'bg-amber-50 text-amber-700 border-amber-200',
  transport: 'bg-purple-50 text-purple-700 border-purple-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
}

function ChoiceRow({
  choice,
  readOnly,
  onUpdate,
}: {
  choice: OptionChoice
  readOnly: boolean
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(choice.label)
  const [amount, setAmount] = useState(String(choice.amount))
  const [currency, setCurrency] = useState(choice.currency)
  const [timing, setTiming] = useState(choice.timing ?? '')
  const [notes, setNotes] = useState(choice.notes ?? '')

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
      <div className="border border-accent/20 rounded-lg p-3 space-y-2 bg-accent-light/20">
        <div className="flex gap-2">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Option label (e.g. AirAsia AA123)"
            className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border border-border rounded px-2 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="any"
            placeholder="0"
            className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
          />
        </div>
        <input
          value={timing}
          onChange={(e) => setTiming(e.target.value)}
          placeholder="Timing / schedule (e.g. 08:30–13:45, 5h 15m)"
          className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (layovers, luggage, location, etc.)"
          rows={2}
          className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="bg-accent text-cream font-mono text-xs px-3 py-1 rounded hover:bg-accent/90">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 group py-3 border-t border-border first:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-medium text-ink">{choice.label}</p>
          {choice.timing && (
            <span className="font-mono text-xs text-muted">{choice.timing}</span>
          )}
        </div>
        {choice.notes && (
          <p className="text-xs text-muted mt-0.5">{choice.notes}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold text-ink">
          {formatAmount(choice.amount, choice.currency)}
        </p>
        {choice.currency !== 'MYR' && (
          <p className="font-mono text-[10px] text-muted">
            {CURRENCY_SYMBOLS[choice.currency] ?? choice.currency}{choice.amount.toLocaleString()}
          </p>
        )}
      </div>
      {!readOnly && (
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity shrink-0 pt-0.5">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-xs font-mono">edit</button>
          <button onClick={remove} className="text-muted hover:text-red-500 text-xs font-mono">del</button>
        </div>
      )}
    </div>
  )
}

function GroupCard({
  group,
  readOnly,
  onUpdate,
}: {
  group: OptionGroup
  readOnly: boolean
  onUpdate: () => void
}) {
  const [addingChoice, setAddingChoice] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const [timing, setTiming] = useState('')
  const [notes, setNotes] = useState('')
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
    setLabel('')
    setAmount('')
    setCurrency('MYR')
    setTiming('')
    setNotes('')
    setAddingChoice(false)
    onUpdate()
  }

  const deleteGroup = async () => {
    if (!confirm(`Delete option group "${group.title}"?`)) return
    await fetch(`/api/option-groups/${group.id}`, { method: 'DELETE' })
    onUpdate()
  }

  const catStyle = CAT_STYLE[group.category ?? 'other'] ?? CAT_STYLE.other
  const catLabel = CATEGORIES.find((c) => c.value === group.category)?.label ?? group.category

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="flex items-start justify-between px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={`font-mono text-[10px] font-semibold uppercase tracking-wide border rounded px-1.5 py-0.5 ${catStyle}`}>
            {catLabel}
          </span>
          <p className="font-medium text-sm text-ink">{group.title}</p>
        </div>
        {!readOnly && (
          <button onClick={deleteGroup} className="text-muted hover:text-red-500 text-sm transition-colors shrink-0">×</button>
        )}
      </div>

      <div className="px-4">
        {choices.map((c) => (
          <ChoiceRow key={c.id} choice={c} readOnly={readOnly} onUpdate={onUpdate} />
        ))}

        {!readOnly && (
          addingChoice ? (
            <form onSubmit={addChoice} className="py-3 space-y-2 border-t border-border first:border-0">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Option label"
                  className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border border-border rounded px-2 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  step="any"
                  placeholder="0"
                  className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
                />
              </div>
              <input
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="Timing / schedule (optional)"
                className="w-full border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full border border-border rounded px-2 py-1.5 text-xs bg-cream focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setAddingChoice(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
                <button type="submit" disabled={!label.trim() || loading}
                  className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90 disabled:opacity-50">
                  {loading ? '…' : 'Add option'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingChoice(true)}
              className="w-full text-left font-mono text-xs text-muted hover:text-accent py-3 border-t border-border first:border-0 transition-colors"
            >
              + Add option
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ── Options tab ───────────────────────────────────────────────────────────────

type Props = {
  tripId: string
  optionGroups: OptionGroup[]
  readOnly?: boolean
  onUpdate: () => void
}

export default function OptionsTab({ tripId, optionGroups, readOnly = false, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
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
            Compare flight, stay, and transport options to share with your group
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
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Outbound Flight KUL → NRT"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-cream focus:outline-none focus:border-accent"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-border rounded-lg px-2.5 py-2 text-sm bg-cream focus:outline-none focus:border-accent"
              >
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
          <button
            onClick={() => setAdding(true)}
            className="w-full border border-dashed border-border rounded-xl py-3 text-sm font-mono text-muted hover:border-accent hover:text-accent transition-colors"
          >
            + Add option group
          </button>
        )
      )}
    </div>
  )
}
