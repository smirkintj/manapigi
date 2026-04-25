'use client'

import { useState, useEffect } from 'react'
import type { BudgetCategory, BudgetItem } from '@/lib/types'
import { formatAmount, CURRENCIES, CURRENCY_SYMBOLS } from '@/lib/utils'

type Rates = Record<string, number> // how many of currency = 1 MYR

function toMYR(amount: number, currency: string, rates: Rates): number {
  if (currency === 'MYR' || !rates[currency]) return amount
  // rates[currency] = X units of currency per 1 MYR → so 1 unit = 1/X MYR
  return amount / rates[currency]
}

// ── Item row ────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  tripCurrency,
  rates,
  onUpdate,
}: {
  item: BudgetItem
  tripCurrency: string
  rates: Rates
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))
  const [currency, setCurrency] = useState(item.itemCurrency ?? tripCurrency)

  const effectiveCurrency = item.itemCurrency ?? tripCurrency
  const myrEquiv = toMYR(item.amount, effectiveCurrency, rates)
  const showMYR = effectiveCurrency !== 'MYR' && Object.keys(rates).length > 0

  const save = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        amount: parseFloat(amount) || 0,
        paid: item.paid,
        itemCurrency: currency !== tripCurrency ? currency : null,
      }),
    })
    setEditing(false)
    onUpdate()
  }

  const togglePaid = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label,
        amount: item.amount,
        paid: !item.paid,
        itemCurrency: item.itemCurrency,
      }),
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
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="any"
              className="w-28 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
            />
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
        <span className={`text-sm ${item.paid ? 'line-through text-muted' : 'text-ink'}`}>
          {item.label}
        </span>
      </td>
      <td className="py-2.5 px-2 text-right">
        <div>
          <span className={`font-mono text-sm ${item.paid ? 'text-muted' : 'text-ink'}`}>
            {formatAmount(item.amount, effectiveCurrency)}
          </span>
          {showMYR && (
            <div className="font-mono text-[10px] text-muted">
              ≈ RM {myrEquiv.toFixed(2)}
            </div>
          )}
        </div>
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
  tripCurrency,
  rates,
  onUpdate,
}: {
  category: BudgetCategory
  tripCurrency: string
  rates: Rates
  onUpdate: () => void
}) {
  const [addingItem, setAddingItem] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [itemCurrency, setItemCurrency] = useState(tripCurrency)
  const [loading, setLoading] = useState(false)

  const items = category.items ?? []
  const myrTotal = items.reduce((s, i) => s + toMYR(i.amount, i.itemCurrency ?? tripCurrency, rates), 0)
  const myrPaid = items.filter((i) => i.paid).reduce((s, i) => s + toMYR(i.amount, i.itemCurrency ?? tripCurrency, rates), 0)

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true)
    await fetch(`/api/budget-categories/${category.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: label.trim(),
        amount: parseFloat(amount) || 0,
        itemCurrency: itemCurrency !== tripCurrency ? itemCurrency : null,
      }),
    })
    setLoading(false)
    setLabel('')
    setAmount('')
    setItemCurrency(tripCurrency)
    setAddingItem(false)
    onUpdate()
  }

  const deleteCategory = async () => {
    if (!confirm(`Delete "${category.name}"?`)) return
    await fetch(`/api/budget-categories/${category.id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Category header */}
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

      {/* Items table */}
      <table className="w-full">
        <tbody>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              tripCurrency={tripCurrency}
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
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    type="number"
                    step="any"
                    className="w-28 border border-border rounded px-2 py-1.5 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-accent text-cream font-mono text-xs px-3 py-1.5 rounded hover:bg-accent/90 disabled:opacity-50"
                  >
                    {loading ? '…' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setAddingItem(false)} className="text-muted font-mono text-xs">
                    Cancel
                  </button>
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
  onUpdate: () => void
  onCurrencyChange: (currency: string) => void
}

export default function BudgetTab({ tripId, tripCurrency, categories, onUpdate, onCurrencyChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Rates>({})

  useEffect(() => {
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {})
  }, [])

  const allItems = categories.flatMap((c) => c.items ?? [])
  const myrTotal = allItems.reduce((s, i) => s + toMYR(i.amount, i.itemCurrency ?? tripCurrency, rates), 0)
  const myrPaid = allItems.filter((i) => i.paid).reduce((s, i) => s + toMYR(i.amount, i.itemCurrency ?? tripCurrency, rates), 0)
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
        </div>
        <div className="text-right space-y-2">
          <div className="flex items-center gap-2 justify-end">
            <span className="font-mono text-xs text-muted">Trip currency</span>
            <select
              value={tripCurrency}
              onChange={(e) => saveCurrency(e.target.value)}
              className="border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-cream focus:outline-none focus:border-accent"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOLS[c]} {c}
                </option>
              ))}
            </select>
          </div>
          {myrTotal > 0 && (
            <div>
              <p className="font-mono text-xs text-muted">
                RM {myrPaid.toFixed(2)} paid · RM {(myrTotal - myrPaid).toFixed(2)} remaining
              </p>
              <div className="mt-1.5 h-1.5 w-48 bg-border rounded-full overflow-hidden ml-auto">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => (
        <CategoryCard
          key={cat.id}
          category={cat}
          tripCurrency={tripCurrency}
          rates={rates}
          onUpdate={onUpdate}
        />
      ))}

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
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-xl hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? '…' : 'Add'}
          </button>
          <button type="button" onClick={() => { setAdding(false); setName('') }} className="font-mono text-sm text-muted hover:text-ink px-2">
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
