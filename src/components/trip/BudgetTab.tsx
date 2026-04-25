'use client'

import { useState, useEffect } from 'react'
import type { BudgetCategory, BudgetItem } from '@/lib/types'
import { formatAmount, CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils'

type Rates = Record<string, number>

// rates[currency] = how many units of that currency = 1 MYR
// So 1 unit of currency = 1/rates[currency] MYR
function toMYR(amount: number, currency: string, rates: Rates): number {
  if (currency === 'MYR' || !rates[currency]) return amount
  return amount / rates[currency]
}

function effectiveAmount(item: BudgetItem, travelerCount: number): number {
  return item.perPax ? item.amount * travelerCount : item.amount
}

// ── Item row ────────────────────────────────────────────────────────────────

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

  const eff = effectiveAmount(item, travelerCount)
  const myrEquiv = toMYR(eff, item.itemCurrency, rates)
  const showMYR = item.itemCurrency !== 'MYR' && Object.keys(rates).length > 0

  const save = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, amount: parseFloat(amount) || 0, paid: item.paid, itemCurrency: currency, perPax }),
    })
    setEditing(false)
    onUpdate()
  }

  const togglePaid = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: item.label, amount: item.amount, paid: !item.paid, itemCurrency: item.itemCurrency, perPax: item.perPax }),
    })
    onUpdate()
  }

  const remove = async () => {
    await fetch(`/api/budget-items/${item.id}`, { method: 'DELETE' })
    onUpdate()
  }

  if (editing) {
    return (
      <tr className="border-t border-border bg-accent-light/20">
        <td className="py-2 px-3" colSpan={4}>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="flex-1 min-w-32 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
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
              type="number"
              step="any"
              className="w-28 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
            />
            <label className="flex items-center gap-1 font-mono text-xs text-muted whitespace-nowrap">
              <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
              per pax
            </label>
            <button onClick={save} className="font-mono text-xs text-accent font-semibold hover:underline">Save</button>
            <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-border group hover:bg-cream/60 transition-colors">
      <td className="py-2.5 px-3">
        <button
          onClick={togglePaid}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
            item.paid ? 'bg-accent border-accent' : 'border-border hover:border-accent'
          }`}
        >
          {item.paid && <span className="text-cream text-[9px] font-bold">✓</span>}
        </button>
      </td>
      <td className="py-2.5 px-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${item.paid ? 'line-through text-muted' : 'text-ink'}`}>
            {item.label}
          </span>
          {item.perPax && travelerCount > 1 && (
            <span className="font-mono text-[9px] text-muted border border-border rounded px-1">×{travelerCount}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span className={`font-mono text-sm ${item.paid ? 'text-muted' : 'text-ink'}`}>
          {formatAmount(eff, item.itemCurrency)}
        </span>
        {showMYR && (
          <div className="font-mono text-[10px] text-muted">≈ RM {myrEquiv.toFixed(2)}</div>
        )}
      </td>
      <td className="py-2.5 pl-2 pr-3 w-16">
        <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity justify-end">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-xs font-mono">edit</button>
          <button onClick={remove} className="text-muted hover:text-red-500 text-xs font-mono">del</button>
        </div>
      </td>
    </tr>
  )
}

// ── Category card ───────────────────────────────────────────────────────────

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

  useEffect(() => { setLocalItems(category.items ?? []) }, [category.items])

  const myrTotal = localItems.reduce(
    (s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates),
    0
  )
  const myrPaid = localItems
    .filter((i) => i.paid)
    .reduce((s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates), 0)

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
      paid: false,
    }
    setLocalItems((prev) => [...prev, optimistic])
    setLabel('')
    setAmount('')
    setItemCurrency(defaultCurrency)
    setPerPax(false)
    setAddingItem(false)

    await fetch(`/api/budget-categories/${category.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: optimistic.label,
        amount: optimistic.amount,
        itemCurrency: optimistic.itemCurrency,
        perPax: optimistic.perPax,
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color ?? '#2d5a3d' }} />
          <span className="font-medium text-sm text-ink">{category.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-mono text-sm text-ink font-semibold">RM {myrTotal.toFixed(2)}</span>
            {myrPaid > 0 && (
              <span className="font-mono text-xs text-muted ml-2">RM {myrPaid.toFixed(2)} paid</span>
            )}
          </div>
          <button onClick={deleteCategory} className="text-muted hover:text-red-500 text-sm transition-colors">×</button>
        </div>
      </div>

      <table className="w-full">
        <tbody>
          {localItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              travelerCount={travelerCount}
              rates={rates}
              onUpdate={onUpdate}
            />
          ))}

          {addingItem ? (
            <tr className="border-t border-border bg-accent-light/20">
              <td colSpan={4} className="px-3 py-2">
                <form onSubmit={addItem} className="flex gap-2 items-center flex-wrap">
                  <input
                    autoFocus
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Item description"
                    className="flex-1 min-w-32 border border-border rounded px-2 py-1.5 text-sm bg-cream focus:outline-none focus:border-accent"
                  />
                  <select
                    value={itemCurrency}
                    onChange={(e) => setItemCurrency(e.target.value)}
                    className="border border-border rounded px-2 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    type="number"
                    step="any"
                    className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
                  />
                  <label className="flex items-center gap-1 font-mono text-xs text-muted whitespace-nowrap">
                    <input type="checkbox" checked={perPax} onChange={(e) => setPerPax(e.target.checked)} className="accent-accent" />
                    per pax
                  </label>
                  <button type="submit" className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90">Add</button>
                  <button type="button" onClick={() => setAddingItem(false)} className="text-muted font-mono text-xs">Cancel</button>
                </form>
              </td>
            </tr>
          ) : (
            <tr className="border-t border-border">
              <td colSpan={4} className="px-3 py-2">
                <button
                  onClick={() => setAddingItem(true)}
                  className="text-xs font-mono text-muted hover:text-accent transition-colors"
                >
                  + Add item
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
    (s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates),
    0
  )
  const myrPaid = allItems
    .filter((i) => i.paid)
    .reduce((s, i) => s + toMYR(effectiveAmount(i, travelerCount), i.itemCurrency, rates), 0)
  const paidPct = myrTotal > 0 ? (myrPaid / myrTotal) * 100 : 0

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
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-end justify-between gap-4 pb-5 border-b border-border">
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
        <div className="text-right space-y-2">
          <div className="flex items-center gap-2 justify-end">
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
          {myrTotal > 0 && (
            <div>
              <p className="font-mono text-xs text-muted">
                RM {myrPaid.toFixed(2)} paid · RM {(myrTotal - myrPaid).toFixed(2)} remaining
              </p>
              <div className="mt-1.5 h-1.5 w-48 bg-border rounded-full overflow-hidden ml-auto">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

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
