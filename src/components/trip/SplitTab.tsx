'use client'

import type { BudgetCategory, BudgetItem, Traveler } from '@/lib/types'

type Settlement = { from: string; to: string; amount: number }

function getSharerId(item: BudgetItem, travelers: Traveler[]): string[] {
  if (!item.sharedWith) return travelers.map((t) => t.name)
  try {
    const parsed = JSON.parse(item.sharedWith) as string[]
    return parsed.filter((n) => travelers.some((t) => t.name === n))
  } catch {
    return travelers.map((t) => t.name)
  }
}

function calcSplit(travelers: Traveler[], items: BudgetItem[]) {
  const paid: Record<string, number> = {}
  const share: Record<string, number> = {}
  const personCosts: Record<string, number> = {}
  travelers.forEach((t) => { paid[t.name] = 0; share[t.name] = 0; personCosts[t.name] = 0 })

  items.forEach((item) => {
    const sharers = getSharerId(item, travelers)
    const n = sharers.length || 1
    const perShare = item.perPax ? item.amount : item.amount / n
    const totalPaid = item.perPax ? item.amount * n : item.amount

    sharers.forEach((name) => {
      share[name] = (share[name] ?? 0) + perShare
      personCosts[name] = (personCosts[name] ?? 0) + perShare
    })
    if (item.paidBy && paid[item.paidBy] !== undefined) {
      paid[item.paidBy] += totalPaid
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

  return { balances, settlements, personCosts }
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
  const assignedItems = allItems.filter((i) => i.paidBy)
  const { balances, settlements, personCosts } = calcSplit(travelers, assignedItems)

  const updateItem = async (item: BudgetItem, paidBy: string | null, sharedWith: string | null) => {
    await fetch(`/api/budget-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: item.label, amount: item.amount, itemCurrency: item.itemCurrency,
        perPax: item.perPax, bookingStatus: item.bookingStatus,
        deadline: item.deadline, accommodationId: item.accommodationId,
        paidBy, sharedWith,
      }),
    })
    onUpdate()
  }

  const toggleSharer = (item: BudgetItem, name: string) => {
    const current = getSharerId(item, travelers)
    let next: string[]
    if (current.includes(name)) {
      next = current.filter((n) => n !== name)
      if (next.length === 0) return // need at least one
    } else {
      next = [...current, name]
    }
    const allIn = next.length === travelers.length
    updateItem(item, item.paidBy ?? null, allIn ? null : JSON.stringify(next))
  }

  return (
    <div className="space-y-5">
      {/* Per-person cost summary */}
      {assignedItems.length > 0 && (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="font-medium text-sm text-ink">Cost per person</p>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {travelers.map((t) => {
              const cost = personCosts[t.name] ?? 0
              const maxCost = Math.max(...travelers.map((x) => personCosts[x.name] ?? 0), 0.01)
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
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(cost / maxCost) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="px-4 pb-3 font-mono text-[10px] text-muted">Amounts in original item currency</p>
        </div>
      )}

      {/* Items per category */}
      {categories.map((cat) => {
        const items = cat.items ?? []
        if (items.length === 0) return null
        return (
          <div key={cat.id} className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-accent-light/10">
              <p className="font-medium text-sm text-ink">{cat.name}</p>
            </div>
            <div className="divide-y divide-border">
              {items.map((item) => {
                const sharers = getSharerId(item, travelers)
                const isAllSharers = sharers.length === travelers.length
                return (
                  <div key={item.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink truncate">{item.label}</p>
                        <p className="font-mono text-xs text-muted">
                          {item.itemCurrency} {item.amount.toLocaleString()}
                          {item.perPax ? ' /pax' : ` ÷ ${sharers.length}`}
                        </p>
                      </div>
                      {readOnly ? (
                        <span className="font-mono text-xs text-muted shrink-0">{item.paidBy ?? '—'}</span>
                      ) : (
                        <select
                          value={item.paidBy ?? ''}
                          onChange={(e) => updateItem(item, e.target.value || null, item.sharedWith ?? null)}
                          className="border border-border rounded px-2 py-1 text-xs bg-cream focus:outline-none focus:border-accent text-muted shrink-0"
                        >
                          <option value="">Who paid?</option>
                          {travelers.map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Shared with toggles */}
                    {!readOnly && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-muted">shared with:</span>
                        {travelers.map((t) => {
                          const included = sharers.includes(t.name)
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleSharer(item, t.name)}
                              title={t.name}
                              className={`w-6 h-6 rounded-full text-[9px] font-mono font-bold transition-colors ${
                                included
                                  ? 'bg-accent text-cream'
                                  : 'bg-border text-muted hover:bg-accent/20'
                              }`}
                            >
                              {t.name[0].toUpperCase()}
                            </button>
                          )
                        })}
                        {!isAllSharers && (
                          <button
                            onClick={() => updateItem(item, item.paidBy ?? null, null)}
                            className="font-mono text-[9px] text-muted hover:text-accent transition-colors"
                          >
                            all
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
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
          {settlements.length > 0 ? (
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
          ) : (
            <p className="px-4 pb-3 font-mono text-xs text-muted">All settled up ✓</p>
          )}
        </div>
      )}
    </div>
  )
}
