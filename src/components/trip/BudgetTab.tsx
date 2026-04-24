'use client'

import { useState } from 'react'
import type { BudgetCategory, BudgetItem } from '@/lib/types'

type Props = {
  tripId: string
  categories: BudgetCategory[]
  onUpdate: () => void
}

function BudgetItemRow({
  item,
  onUpdate,
}: {
  item: BudgetItem
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(item.label)
  const [amount, setAmount] = useState(String(item.amount))

  const togglePaid = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: item.label, amount: item.amount, paid: !item.paid }),
    })
    onUpdate()
  }

  const save = async () => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, amount: parseFloat(amount) || 0, paid: item.paid }),
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
      <div className="flex items-center gap-2 py-1.5">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
          className="w-24 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
        />
        <button onClick={save} className="font-mono text-xs text-accent hover:underline">save</button>
        <button onClick={() => setEditing(false)} className="font-mono text-xs text-muted hover:text-ink">×</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <button
        onClick={togglePaid}
        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          item.paid ? 'bg-accent border-accent' : 'border-border hover:border-accent'
        }`}
      >
        {item.paid && <span className="text-cream text-[10px]">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${item.paid ? 'line-through text-muted' : 'text-ink'}`}>
        {item.label}
      </span>
      <span className={`font-mono text-sm ${item.paid ? 'text-muted' : 'text-ink'}`}>
        ${item.amount.toLocaleString()}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-muted hover:text-ink text-xs font-mono">edit</button>
        <button onClick={remove} className="text-muted hover:text-red-500 text-xs font-mono">del</button>
      </div>
    </div>
  )
}

function CategoryCard({
  category,
  onUpdate,
}: {
  category: BudgetCategory
  onUpdate: () => void
}) {
  const [addingItem, setAddingItem] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const items = category.items ?? []
  const total = items.reduce((s, i) => s + i.amount, 0)
  const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0)

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setLoading(true)
    await fetch(`/api/budget-categories/${category.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: label.trim(), amount: parseFloat(amount) || 0 }),
    })
    setLoading(false)
    setLabel('')
    setAmount('')
    setAddingItem(false)
    onUpdate()
  }

  const deleteCategory = async () => {
    if (!confirm(`Delete "${category.name}" and all its items?`)) return
    await fetch(`/api/budget-categories/${category.id}`, { method: 'DELETE' })
    onUpdate()
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color ?? '#2d5a3d' }} />
          <h4 className="font-medium text-sm text-ink">{category.name}</h4>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-mono text-sm text-ink">${total.toLocaleString()}</span>
            {paid > 0 && (
              <span className="font-mono text-xs text-muted ml-1.5">${paid.toLocaleString()} paid</span>
            )}
          </div>
          <button onClick={deleteCategory} className="text-muted hover:text-red-500 text-sm transition-colors">×</button>
        </div>
      </div>

      <div className="px-4 divide-y divide-border">
        {items.map((item) => (
          <BudgetItemRow key={item.id} item={item} onUpdate={onUpdate} />
        ))}

        {addingItem ? (
          <form onSubmit={addItem} className="flex items-center gap-2 py-2">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Item"
              className="flex-1 border border-border rounded px-2 py-1 text-sm bg-cream focus:outline-none focus:border-accent"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              step="0.01"
              className="w-24 border border-border rounded px-2 py-1 text-sm font-mono bg-cream focus:outline-none focus:border-accent text-right"
            />
            <button type="submit" disabled={loading} className="font-mono text-xs text-accent hover:underline">add</button>
            <button type="button" onClick={() => setAddingItem(false)} className="font-mono text-xs text-muted">×</button>
          </form>
        ) : (
          <button
            onClick={() => setAddingItem(true)}
            className="w-full text-left text-xs font-mono text-muted hover:text-accent py-2.5 transition-colors"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  )
}

export default function BudgetTab({ tripId, categories, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const totalBudget = categories.flatMap((c) => c.items ?? []).reduce((s, i) => s + i.amount, 0)
  const totalPaid = categories.flatMap((c) => c.items ?? []).filter((i) => i.paid).reduce((s, i) => s + i.amount, 0)

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

  return (
    <div className="space-y-4">
      {totalBudget > 0 && (
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div>
            <p className="font-mono text-xs text-muted uppercase tracking-wider mb-1">Total budget</p>
            <p className="font-serif text-3xl text-ink">${totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-muted">
              ${totalPaid.toLocaleString()} paid · ${(totalBudget - totalPaid).toLocaleString()} remaining
            </p>
            <div className="mt-1.5 h-1.5 w-40 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} onUpdate={onUpdate} />
      ))}

      {adding ? (
        <form onSubmit={addCategory} className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name (e.g. Flights)"
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="bg-accent text-cream font-mono text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50"
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
