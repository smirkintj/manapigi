'use client'

import type { BudgetCategory, BudgetItem, Traveler } from '@/lib/types'

type Settlement = { from: string; to: string; amount: number }

function calcSplit(travelers: Traveler[], items: BudgetItem[]) {
  const n = travelers.length
  if (n === 0) return { paid: {}, share: {}, balances: {}, settlements: [], personCosts: {} }

  const paid: Record<string, number> = {}
  const share: Record<string, number> = {}
  const personCosts: Record<string, number> = {}
  travelers.forEach((t) => { paid[t.name] = 0; share[t.name] = 0; personCosts[t.name] = 0 })

  items.forEach((item) => {
    if (item.individual) {
      // Only for the payer — doesn't affect others' balances
      const payer = item.paidBy
      if (payer && paid[payer] !== undefined) {
        paid[payer] += item.amount
        share[payer] += item.amount
        personCosts[payer] += item.amount
      }
    } else {
      // Shared: split evenly (or per-pax)
      const perPersonShare = item.perPax ? item.amount : item.amount / n
      const totalPaid = item.perPax ? item.amount * n : item.amount
      travelers.forEach((t) => {
        share[t.name] += perPersonShare
        personCosts[t.name] += perPersonShare
      })
      if (item.paidBy && paid[item.paidBy] !== undefined) {
        paid[item.paidBy] += totalPaid
      }
    }
  })

  const balances: Record<string, number> = {}
  travelers.forEach((t) => { balances[t.name] = (paid[t.name] ?? 0) - (share[t.name] ?? 0) })

  const settlements: Settlement[] = []
  const bal = { ...balances }
  for (let i = 0; i < travelers.length * travelers.length; i++) {
    const creditor = Object.entries(bal).reduce((a, b) => b[1] > a[1] ? b : a, ['', -Infinity])
    const debtor = Object.entries(bal).reduce((a, b) => b[1] < a[1] ? b : a, ['', Infinity])
    if (creditor[1] <= 0.005 || debtor[1] >= -0.005) break
    const amount = Math.min(creditor[1], -debtor[1])
    settlements.push({ from: debtor[0], to: creditor[0], amount: Math.round(amount * 100) / 100 })
    bal[creditor[0]] -= amount
    bal[debtor[0]] += amount
  }

  return { paid, share, balances, settlements, personCosts }
}

type Props = {
  categories: BudgetCategory[]
  travelers: Traveler[]
  readOnly?: boolean
  onUpdate: () => void
}

export default function SplitTab({ categories, travelers, readOnly = false, onUpdate }: Props) {
  if (travelers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="font-mono text-sm text-muted">No travelers added yet</p>
        <p className="font-mono text-xs text-muted mt-1">Add people in the sidebar first</p>
      </div>
    )
  }

  const allItems = categories.flatMap((c) => c.items ?? [])
  const assignedItems = allItems.filter((i) => i.paidBy || i.individual)
  const { balances, settlements, personCosts } = calcSplit(travelers, assignedItems)

  const updateItem = async (item: BudgetItem, patch: { paidBy?: string | null; individual?: boolean }) => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label,
        amount: item.amount,
        itemCurrency: item.itemCurrency,
        perPax: item.perPax,
        bookingStatus: item.bookingStatus,
        deadline: item.deadline,
        accommodationId: item.accommodationId,
        paidBy: patch.paidBy !== undefined ? patch.paidBy : (item.paidBy ?? null),
        individual: patch.individual !== undefined ? patch.individual : (item.individual ?? false),
      }),
    })
    onUpdate()
  }

  return (
    <div className="space-y-5">
      {/* Per-person cost summary */}
      {assignedItems.length > 0 && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="font-medium text-sm text-ink">Cost per person</p>
          </div>
          <div className="px-4 py-3 space-y-2">
            {travelers.map((t) => {
              const cost = personCosts[t.name] ?? 0
              const maxCost = Math.max(...travelers.map((x) => personCosts[x.name] ?? 0), 1)
              const pct = Math.round((cost / maxCost) * 100)
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent-light border border-accent/30 flex items-center justify-center shrink-0">
                        <span className="font-mono text-[9px] text-accent font-bold">{t.name[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm text-ink">{t.name}</span>
                    </div>
                    <span className="font-mono text-sm text-ink font-medium">{cost.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="px-4 pb-3 font-mono text-[10px] text-muted">
            Amounts in original item currency
          </p>
        </div>
      )}

      {/* Items list */}
      {categories.map((cat) => {
        const items = cat.items ?? []
        if (items.length === 0) return null
        return (
          <div key={cat.id} className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-accent-light/10">
              <p className="font-medium text-sm text-ink">{cat.name}</p>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm text-ink truncate">{item.label}</p>
                        {item.individual && (
                          <span className="font-mono text-[9px] border border-border rounded px-1 text-muted shrink-0">solo</span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-muted">
                        {item.itemCurrency} {item.amount.toLocaleString()}
                        {item.perPax && !item.individual && ' /pax'}
                      </p>
                    </div>
                    {readOnly ? (
                      <span className="font-mono text-xs text-muted shrink-0">{item.paidBy ?? '—'}</span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1 font-mono text-[10px] text-muted whitespace-nowrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.individual ?? false}
                            onChange={(e) => updateItem(item, { individual: e.target.checked })}
                            className="accent-accent"
                          />
                          solo
                        </label>
                        <select
                          value={item.paidBy ?? ''}
                          onChange={(e) => updateItem(item, { paidBy: e.target.value || null })}
                          className="border border-border rounded px-2 py-1 text-xs bg-cream focus:outline-none focus:border-accent text-muted"
                        >
                          <option value="">Who paid?</option>
                          {travelers.map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {allItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-mono text-sm text-muted">No budget items yet</p>
          <p className="font-mono text-xs text-muted mt-1">Add items in the Budget tab first</p>
        </div>
      )}

      {/* Settlement */}
      {assignedItems.length > 0 && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="font-medium text-sm text-ink">Settlement</p>
          </div>

          <div className="px-4 py-3 space-y-2">
            {travelers.map((t) => {
              const bal = balances[t.name] ?? 0
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-accent-light border border-accent/30 flex items-center justify-center shrink-0">
                      <span className="font-mono text-[9px] text-accent font-bold">{t.name[0].toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-ink">{t.name}</span>
                  </div>
                  <span className={`font-mono text-sm ${bal > 0.005 ? 'text-green-600' : bal < -0.005 ? 'text-red-500' : 'text-muted'}`}>
                    {bal > 0.005 ? '+' : ''}{bal.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>

          {settlements.length > 0 && (
            <div className="border-t border-border px-4 py-3 space-y-1.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">Transfers needed</p>
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium text-ink">{s.from}</span>
                  <span className="font-mono text-xs text-muted">pays</span>
                  <span className="font-medium text-ink">{s.to}</span>
                  <span className="font-mono text-sm font-semibold text-ink ml-auto">{s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {settlements.length === 0 && (
            <p className="px-4 pb-3 font-mono text-xs text-muted">All settled up ✓</p>
          )}
        </div>
      )}
    </div>
  )
}
