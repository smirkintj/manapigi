'use client'

import { useState, useEffect } from 'react'
import type { BudgetCategory, BudgetItem, BookingStatus, Accommodation } from '@/lib/types'
import { formatAmount, formatDate, CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils'
import DatePicker from '@/components/ui/DatePicker'
import SwipeRow from '@/components/ui/SwipeRow'

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
        className={`${base} bg-accent border-accent flex items-center justify-center`} title="Done">
        <span className="text-cream text-[8px] font-bold leading-none">✓</span>
      </button>
    )
  if (status === 'in_progress')
    return (
      <button type="button" onClick={onClick}
        className={`${base} border-amber-400 bg-amber-100 flex items-center justify-center`} title="In progress">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </button>
    )
  return (
    <button type="button" onClick={onClick}
      className={`${base} border-border hover:border-accent`} title="Pending" />
  )
}

// ── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  travelerCount,
  rates,
  accommodations,
  onUpdate,
}: {
  item: BudgetItem
  travelerCount: number
  rates: Rates
  accommodations: Accommodation[]
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [currency, setCurrency] = useState(item.itemCurrency)
  const [perPax, setPerPax] = useState(item.perPax)
  const [deadline, setDeadline] = useState(item.deadline ?? '')
  const [accommodationId, setAccommodationId] = useState(item.accommodationId ?? '')

  const status = (item.bookingStatus ?? 'pending') as BookingStatus
  const eff = effectiveAmount(item, travelerCount)
  const myrEquiv = toMYR(eff, item.itemCurrency, rates)
  const showMYR = item.itemCurrency !== 'MYR' && Object.keys(rates).length > 0
  const linkedStay = accommodations.find((a) => a.id === item.accommodationId)

  const cycleStatus = async () => {
    if (item.id.startsWith('temp-')) return
    const next = STATUS_NEXT[status]
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label, amount: item.amount, itemCurrency: item.itemCurrency,
        perPax: item.perPax, bookingStatus: next, deadline: item.deadline,
        accommodationId: item.accommodationId,
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
        accommodationId: accommodationId || null,
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
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)}
            className="flex-1 min-w-28 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent" />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="any"
            className="w-24 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right" />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <DatePicker value={deadline} onChange={setDeadline} placeholder="Book by (optional)" className="flex-1 text-xs" />
          <label className="flex items-center gap-1 font-mono text-xs text-muted whitespace-nowrap">
            <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
            per pax
          </label>
        </div>
        {accommodations.length > 0 && (
          <select value={accommodationId} onChange={(e) => setAccommodationId(e.target.value)}
            className="w-full border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent text-muted">
            <option value="">Link to stay (optional)</option>
            {accommodations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          <button onClick={save} className="font-mono text-xs text-accent font-semibold hover:underline">Save</button>
        </div>
      </div>
    )
  }

  return (
    <SwipeRow onEdit={() => setEditing(true)} onDelete={remove}>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border hover:bg-cream/50 transition-colors">
        <StatusDot status={status} onClick={cycleStatus} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs ${status === 'done' ? 'line-through text-muted' : 'text-ink'}`}>{item.label}</span>
            {item.perPax && travelerCount > 1 && (
              <span className="font-mono text-[9px] text-muted border border-border rounded px-1">×{travelerCount}</span>
            )}
            {item.deadline && (
              <span className="font-mono text-[9px] text-muted border border-border rounded px-1">by {formatDate(item.deadline)}</span>
            )}
            {linkedStay && (
              <span className="font-mono text-[9px] text-accent/70 border border-accent/20 rounded px-1">{linkedStay.name}</span>
            )}
          </div>
          {showMYR && <p className="font-mono text-[9px] text-muted">≈ RM {myrEquiv.toFixed(2)}</p>}
        </div>
        {/* Amount fades on desktop hover; buttons overlay in its place */}
        <div className="relative shrink-0">
          <span className={`font-mono text-xs sm:group-hover:invisible ${status === 'done' ? 'text-muted' : 'text-ink'}`}>
            {formatAmount(eff, item.itemCurrency)}
          </span>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hidden sm:flex gap-1.5 transition-opacity">
            <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-[10px] font-mono">edit</button>
            <button onClick={remove} className="text-muted hover:text-red-500 text-[10px] font-mono">del</button>
          </div>
        </div>
      </div>
    </SwipeRow>
  )
}

// ── Category card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  defaultCurrency,
  travelerCount,
  rates,
  accommodations,
  onUpdate,
}: {
  category: BudgetCategory
  defaultCurrency: string
  travelerCount: number
  rates: Rates
  accommodations: Accommodation[]
  onUpdate: () => void
}) {
  const [localItems, setLocalItems] = useState<BudgetItem[]>(category.items ?? [])
  const [addingItem, setAddingItem] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [itemCurrency, setItemCurrency] = useState(defaultCurrency)
  const [perPax, setPerPax] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [accommodationId, setAccommodationId] = useState('')

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
      accommodationId: accommodationId || null,
    }
    setLocalItems((prev) => [...prev, optimistic])
    setLabel(''); setAmount(''); setItemCurrency(defaultCurrency)
    setPerPax(false); setDeadline(''); setAccommodationId('')
    setAddingItem(false)

    await fetch(`/api/budget-categories/${category.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: optimistic.label, amount: optimistic.amount,
        itemCurrency: optimistic.itemCurrency, perPax: optimistic.perPax,
        deadline: optimistic.deadline, accommodationId: optimistic.accommodationId,
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

      {localItems.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          travelerCount={travelerCount}
          rates={rates}
          accommodations={accommodations}
          onUpdate={onUpdate}
        />
      ))}

      {addingItem ? (
        <form onSubmit={addItem} className="border-t border-border px-3 py-2.5 space-y-2 bg-cream/40">
          <div className="flex gap-1.5 items-center">
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Item"
              className="flex-1 border border-border rounded px-2 py-1 text-xs bg-cream focus:outline-none focus:border-accent" />
            <select value={itemCurrency} onChange={(e) => setItemCurrency(e.target.value)}
              className="border border-border rounded px-1.5 py-1 text-[10px] font-mono bg-cream focus:outline-none focus:border-accent">
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" type="number" step="any"
              className="w-20 border border-border rounded px-2 py-1 text-xs font-mono bg-cream focus:outline-none focus:border-accent text-right" />
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            <DatePicker value={deadline} onChange={setDeadline} placeholder="Book by" className="flex-1 text-[10px]" />
            <label className="flex items-center gap-1 font-mono text-[10px] text-muted whitespace-nowrap">
              <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
              /pax
            </label>
          </div>
          {accommodations.length > 0 && (
            <select value={accommodationId} onChange={(e) => setAccommodationId(e.target.value)}
              className="w-full border border-border rounded px-2 py-1 text-[10px] font-mono bg-cream focus:outline-none focus:border-accent text-muted">
              <option value="">Link to stay (optional)</option>
              {accommodations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <div className="flex gap-1.5 justify-end">
            <button type="submit" disabled={!label.trim()}
              className="bg-accent text-cream font-mono text-[10px] px-2.5 py-1 rounded hover:bg-accent/90 disabled:opacity-50">Add</button>
            <button type="button" onClick={() => setAddingItem(false)} className="text-muted font-mono text-[10px]">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAddingItem(true)}
          className="w-full text-left px-3 py-2 font-mono text-[10px] text-muted hover:text-accent border-t border-border transition-colors">
          + Add item
        </button>
      )}
    </div>
  )
}

// ── Purchase tracker ──────────────────────────────────────────────────────────

type TrackedItem = BudgetItem & { categoryName: string }

function PurchaseTracker({
  categories,
  accommodations,
  travelerCount,
  rates,
  onUpdate,
}: {
  categories: BudgetCategory[]
  accommodations: Accommodation[]
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
        accommodationId: item.accommodationId,
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
          const status = (item.bookingStatus ?? 'pending') as BookingStatus
          const eff = effectiveAmount(item, travelerCount)
          const myrEquiv = toMYR(eff, item.itemCurrency, rates)
          const showMYR = item.itemCurrency !== 'MYR' && Object.keys(rates).length > 0
          const linkedStay = accommodations.find((a) => a.id === item.accommodationId)
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream/50 transition-colors">
              <StatusDot status={status} onClick={() => cycleStatus(item)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm ${status === 'done' ? 'line-through text-muted' : 'text-ink'}`}>
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted">{item.categoryName}</span>
                  {linkedStay && (
                    <span className="font-mono text-[10px] text-accent/70 border border-accent/20 rounded px-1">{linkedStay.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.deadline && (
                    <span className="font-mono text-[10px] text-muted">by {formatDate(item.deadline)}</span>
                  )}
                  <span className={`font-mono text-[10px] font-medium ${
                    status === 'done' ? 'text-accent' :
                    status === 'in_progress' ? 'text-amber-600' : 'text-muted'
                  }`}>{STATUS_LABEL[status]}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm text-ink">{formatAmount(eff, item.itemCurrency)}</p>
                {showMYR && <p className="font-mono text-[10px] text-muted">≈ RM {myrEquiv.toFixed(0)}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Budget tab ────────────────────────────────────────────────────────────────

type Props = {
  tripId: string
  tripCurrency: string
  categories: BudgetCategory[]
  travelerCount: number
  accommodations: Accommodation[]
  onUpdate: () => void
  onCurrencyChange: (currency: string) => void
}

export default function BudgetTab({
  tripId, tripCurrency, categories, travelerCount, accommodations, onUpdate, onCurrencyChange,
}: Props) {
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
    <div>
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
          <select value={tripCurrency} onChange={(e) => saveCurrency(e.target.value)}
            className="border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent">
            {CURRENCIES.map((c) => <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>)}
          </select>
        </div>
      </div>

      {/* Purchase tracker */}
      <PurchaseTracker
        categories={categories}
        accommodations={accommodations}
        travelerCount={travelerCount}
        rates={rates}
        onUpdate={onUpdate}
      />

      {/* 2-col category grid */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-5">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              defaultCurrency={tripCurrency}
              travelerCount={travelerCount}
              rates={rates}
              accommodations={accommodations}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Add category */}
      {adding ? (
        <form onSubmit={addCategory} className="flex gap-2">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flights, Food, Activities"
            className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:border-accent" />
          <button type="submit" disabled={!name.trim() || loading}
            className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-xl hover:bg-accent/90 disabled:opacity-50">
            {loading ? '…' : 'Add'}
          </button>
          <button type="button" onClick={() => { setAdding(false); setName('') }}
            className="font-mono text-sm text-muted hover:text-ink px-2">Cancel</button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full border border-dashed border-border rounded-xl py-3 text-sm font-mono text-muted hover:border-accent hover:text-accent transition-colors">
          + Add category
        </button>
      )}
    </div>
  )
}
