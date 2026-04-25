'use client'

import { useState, useEffect } from 'react'
import type { BudgetCategory, BudgetItem, BookingStatus } from '@/lib/types'
import { formatAmount, formatDate, CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'

type Rates = Record<string, number>

function toMYR(amount: number, currency: string, rates: Rates): number {
  if (currency === 'MYR' || !rates[currency]) return amount
  return amount / rates[currency]
}

function effectiveAmount(item: BudgetItem, travelerCount: number): number {
  return item.perPax ? item.amount * travelerCount : item.amount
}

const STATUS_NEXT: Record<BookingStatus, BookingStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
}

function StatusDot({ status, onClick }: { status: BookingStatus; onClick?: () => void }) {
  const base = 'w-3.5 h-3.5 rounded-full border shrink-0 transition-colors'
  if (status === 'done')
    return (
      <button type="button" onClick={onClick}
        className={`${base} bg-accent border-accent flex items-center justify-center`}
        title="Done — click to reset">
        <span className="text-cream text-[8px] font-bold leading-none">✓</span>
      </button>
    )
  if (status === 'in_progress')
    return (
      <button type="button" onClick={onClick}
        className={`${base} border-amber-400 bg-amber-100 flex items-center justify-center`}
        title="In progress — click for done">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </button>
    )
  return (
    <button type="button" onClick={onClick}
      className={`${base} border-border hover:border-accent`}
      title="Pending — click for in progress" />
  )
}

// ── Item row in category card ────────────────────────────────────────────────

function ItemRow({
  item,
  travelerCount,
  rates,
  onUpdate,
}: {
  item: BudgetItem
  travelerCount: number
  rates: Rates
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [currency, setCurrency] = useState(item.itemCurrency)
  const [perPax, setPerPax] = useState(item.perPax)
  const [deadline, setDeadline] = useState(item.deadline ?? '')

  const eff = effectiveAmount(item, travelerCount)
  const myrEquiv = toMYR(eff, item.itemCurrency, rates)
  const showMYR = item.itemCurrency !== 'MYR' && Object.keys(rates).length > 0
  const status = (item.bookingStatus ?? 'pending') as BookingStatus
  const isDone = status === 'done'

  const cycleStatus = async () => {
    if (item.id.startsWith('temp-')) return
    const next = STATUS_NEXT[status]
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label, amount: item.amount, itemCurrency: item.itemCurrency,
        perPax: item.perPax, bookingStatus: next, deadline: item.deadline,
      }),
    })
    onUpdate()
  }

  const save = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label, amount: parseFloat(amount) || 0, itemCurrency: currency,
        perPax, bookingStatus: status, deadline: deadline || null,
      }),
    })
    setEditing(false)
    onUpdate()
  }

  const remove = async () => {
    await fetch(`/api/budget-items/${item.id}`, { method: 'DELETE' })
    onUpdate()
  }

  if (editing) {
    return (
      <div className="border-t border-border bg-accent-light/20 px-3 py-2.5 space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 min-w-28 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number" step="any" placeholder="0"
            className="w-24 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <DatePicker value={deadline} onChange={setDeadline} placeholder="Book by (optional)" className="flex-1 text-xs" />
          <label className="flex items-center gap-1 font-mono text-xs text-muted whitespace-nowrap">
            <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
            per pax
          </label>
          <button onClick={save} className="font-mono text-xs text-accent font-semibold hover:underline">Save</button>
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-border group hover:bg-cream/50 transition-colors">
      <StatusDot status={status} onClick={cycleStatus} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs ${isDone ? 'line-through text-muted' : 'text-ink'}`}>{item.label}</span>
          {item.perPax && travelerCount > 1 && (
            <span className="font-mono text-[9px] text-muted border border-border rounded px-1">×{travelerCount}</span>
          )}
          {item.deadline && (
            <span className="font-mono text-[9px] text-muted border border-border rounded px-1">
              by {formatDate(item.deadline)}
            </span>
          )}
        </div>
        {showMYR && (
          <p className="font-mono text-[9px] text-muted">≈ RM {myrEquiv.toFixed(2)}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-mono text-xs ${isDone ? 'text-muted' : 'text-ink'}`}>
          {formatAmount(eff, item.itemCurrency)}
        </span>
        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-[10px] font-mono">edit</button>
          <button onClick={remove} className="text-muted hover:text-red-500 text-[10px] font-mono">del</button>
        </div>
      </div>
    </div>
  )
}

// ── Category card (compact, 2-col grid) ─────────────────────────────────────

function CategoryCard({
  category,
  defaultCurrency,
  travelerCount,
  rates,
  onUpdate,
}: {
  category: BudgetCategory
  defaultCurrency: string
  travelerCount: number
  rates: Rates
  onUpdate: () => void
}) {
  const [localItems, setLocalItems] = useState<BudgetItem[]>(category.items ?? [])
  const [addingItem, setAddingItem] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [itemCurrency, setItemCurrency] = useState(defaultCurrency)
  const [perPax, setPerPax] = useState(false)
  const [deadline, setDeadline] = useState('')

  useEffect(() => { setLocalItems(category.items ?? []) }, [category.items])

  const myrTotal = localItems.reduce(
    (s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates), 0
  )

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return

    const optimistic: BudgetItem = {
      id: `temp-${Date.now()}`,
      categoryId: category.id,
      label: label.trim(),
      amount: parseFloat(amount) || 0,
      itemCurrency,
      perPax,
      bookingStatus: 'pending',
      deadline: deadline || null,
    }
    setLocalItems((prev) => [...prev, optimistic])
    setLabel(''); setAmount(''); setItemCurrency(defaultCurrency); setPerPax(false); setDeadline('')
    setAddingItem(false)

    await fetch(`/api/budget-categories/${category.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: optimistic.label, amount: optimistic.amount,
        itemCurrency: optimistic.itemCurrency, perPax: optimistic.perPax,
        deadline: optimistic.deadline,
      }),
    })
    onUpdate()
  }

  const deleteCategory = async () => {
    if (!confirm(`Delete "${category.name}"?`)) return
    await fetch(`/api/budget-categories/${category.id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color ?? '#2d5a3d' }} />
          <span className="font-medium text-xs text-ink">{category.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink font-semibold">RM {myrTotal.toFixed(0)}</span>
          <button onClick={deleteCategory} className="text-muted hover:text-red-500 text-sm transition-colors leading-none">×</button>
        </div>
      </div>

      {/* Items */}
      {localItems.map((item) => (
        <ItemRow key={item.id} item={item} travelerCount={travelerCount} rates={rates} onUpdate={onUpdate} />
      ))}

      {/* Add item */}
      {addingItem ? (
        <form onSubmit={addItem} className="border-t border-border px-3 py-2.5 space-y-2 bg-cream/40">
          <div className="flex gap-1.5 items-center">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Item"
              className="flex-1 border border-border rounded px-2 py-1 text-xs bg-cream focus:outline-none focus:border-accent"
            />
            <select
              value={itemCurrency}
              onChange={(e) => setItemCurrency(e.target.value)}
              className="border border-border rounded px-1.5 py-1 text-[10px] font-mono bg-cream focus:outline-none focus:border-accent"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              type="number" step="any"
              className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent text-right"
            />
          </div>
          <div className="flex gap-1.5 items-center">
            <DatePicker value={deadline} onChange={setDeadline} placeholder="Book by (optional)" className="flex-1 text-[10px]" />
            <label className="flex items-center gap-1 font-mono text-[10px] text-muted whitespace-nowrap">
              <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
              /pax
            </label>
            <button type="submit" disabled={!label.trim()}
              className="bg-accent text-cream font-mono text-[10px] px-2.5 py-1 rounded hover:bg-accent/90 disabled:opacity-50">
              Add
            </button>
            <button type="button" onClick={() => setAddingItem(false)} className="text-muted font-mono text-[10px]">×</button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAddingItem(true)}
          className="w-full text-left px-3 py-2 font-mono text-[10px] text-muted hover:text-accent border-t border-border transition-colors"
        >
          + Add item
        </button>
      )}
    </div>
  )
}

// ── Purchase tracker ─────────────────────────────────────────────────────────

type TrackedItem = BudgetItem & { categoryName: string }

function PurchaseTracker({
  categories,
  travelerCount,
  rates,
  onUpdate,
}: {
  categories: BudgetCategory[]
  travelerCount: number
  rates: Rates
  onUpdate: () => void
}) {
  const tracked: TrackedItem[] = categories
    .flatMap((c) =>
      (c.items ?? [])
        .filter((i) => i.deadline || i.bookingStatus !== 'pending')
        .map((i) => ({ ...i, categoryName: c.name }))
    )
    .sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return 0
    })

  if (tracked.length === 0) return null

  const cycleStatus = async (item: TrackedItem) => {
    const next = STATUS_NEXT[(item.bookingStatus ?? 'pending') as BookingStatus]
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label, amount: item.amount, itemCurrency: item.itemCurrency,
        perPax: item.perPax, bookingStatus: next, deadline: item.deadline,
      }),
    })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card mb-5">
      <div className="px-4 py-2.5 border-b border-border">
        <span className="font-mono text-[10px] text-muted uppercase tracking-wider">Purchase tracker</span>
      </div>
      <div className="divide-y divide-border">
        {tracked.map((item) => {
          const eff = effectiveAmount(item, travelerCount)
          const myrEquiv = toMYR(eff, item.itemCurrency, rates)
          const showMYR = item.itemCurrency !== 'MYR' && Object.keys(rates).length > 0
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-cream/50 transition-colors">
              <StatusDot status={(item.bookingStatus ?? 'pending') as BookingStatus} onClick={() => cycleStatus(item)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${item.bookingStatus === 'done' ? 'line-through text-muted' : 'text-ink'}`}>
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted">{item.categoryName}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.deadline ? (
                    <span className="font-mono text-[10px] text-muted">
                      by {formatDate(item.deadline)}
                    </span>
                  ) : null}
                  <span className={`font-mono text-[10px] font-medium ${
                    item.bookingStatus === 'done' ? 'text-accent' :
                    item.bookingStatus === 'in_progress' ? 'text-amber-600' : 'text-muted'
                  }`}>
                    {STATUS_LABEL[(item.bookingStatus ?? 'pending') as BookingStatus]}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-ink">{formatAmount(eff, item.itemCurrency)}</p>
                {showMYR && (
                  <p className="font-mono text-[10px] text-muted">≈ RM {myrEquiv.toFixed(0)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Budget tab ───────────────────────────────────────────────────────────────

type Props = {
  tripId: string
  tripCurrency: string
  categories: BudgetCategory[]
  travelerCount: number
  onUpdate: () => void
  onCurrencyChange: (currency: string) => void
}

export default function BudgetTab({ tripId, tripCurrency, categories, travelerCount, onUpdate, onCurrencyChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Rates>({})

  useEffect(() => {
    fetch('/api/exchange-rate').then((r) => r.json()).then(setRates).catch(() => {})
  }, [])

  const allItems = categories.flatMap((c) => c.items ?? [])
  const myrTotal = allItems.reduce(
    (s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates), 0
  )

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await fetch(`/api/trips/${tripId}/budget-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setLoading(false)
    setName('')
    setAdding(false)
    onUpdate()
  }

  const saveCurrency = async (currency: string) => {
    onCurrencyChange(currency)
    await fetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency }),
    })
  }

  return (
    <div className="space-y-0">
      {/* Summary */}
      <div className="flex items-end justify-between gap-4 pb-5 mb-5 border-b border-border">
        <div>
          <p className="font-mono text-xs text-muted uppercase tracking-wider mb-1">Total (RM)</p>
          <p className="font-serif text-4xl text-ink">
            {myrTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {travelerCount > 1 && myrTotal > 0 && (
            <p className="font-mono text-xs text-muted mt-1">
              ≈ RM {(myrTotal / travelerCount).toFixed(2)} per person
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">Default currency</span>
          <select
            value={tripCurrency}
            onChange={(e) => saveCurrency(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchase tracker */}
      <PurchaseTracker
        categories={categories}
        travelerCount={travelerCount}
        rates={rates}
        onUpdate={onUpdate}
      />

      {/* 2-column category grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              defaultCurrency={tripCurrency}
              travelerCount={travelerCount}
              rates={rates}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Add category */}
      {adding ? (
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flights, Food, Activities"
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:border-accent"
          />
          <button type="submit" disabled={!name.trim() || loading}
            className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-xl hover:bg-accent/90 disabled:opacity-50">
            {loading ? '…' : 'Add'}
          </button>
          <button type="button" onClick={() => { setAdding(false); setName('') }}
            className="font-mono text-sm text-muted hover:text-ink px-2">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm font-mono text-muted hover:border-accent hover:text-accent transition-colors"
        >
          + Add category
        </button>
      )}
    </div>
  )
}
