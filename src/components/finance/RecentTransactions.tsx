'use client'

import React from 'react'
import { formatRM } from '@/lib/finance-utils'
import { CategoryIcon } from './icons'

type CategoryIconName = Parameters<typeof CategoryIcon>[0]['name']

interface Transaction {
  merchant: string
  cat: string
  icon: CategoryIconName
  amount: number
  when: string
  recurring?: boolean
  flagged?: boolean
  income?: boolean
}

const TRANSACTIONS: Transaction[] = [
  { merchant: 'Grab', cat: 'Transport', icon: 'car', amount: -45.00, when: 'Today · 14:22' },
  { merchant: 'Spotify Family', cat: 'Subscriptions', icon: 'play', amount: -19.90, when: 'Today · 09:08', recurring: true },
  { merchant: 'Mid Valley Megamall', cat: 'Shopping', icon: 'bag', amount: -489.00, when: 'Yesterday · 19:41', flagged: true },
  { merchant: 'Starbucks Reserve', cat: 'Food & Dining', icon: 'bowl', amount: -28.50, when: 'Yesterday · 12:30' },
  { merchant: 'Salary — Mei', cat: 'Income', icon: 'income', amount: 12000.00, when: 'May 14 · 08:00', income: true },
  { merchant: 'Shopee Checkout', cat: 'Shopping', icon: 'bag', amount: -262.10, when: 'May 13 · 22:15' },
  { merchant: 'Jaya Grocer KLCC', cat: 'Groceries', icon: 'leaf', amount: -213.40, when: 'May 13 · 18:02' },
  { merchant: 'Shell Bangsar', cat: 'Transport', icon: 'car', amount: -80.00, when: 'May 12 · 07:45' },
]

function TxRow({ tx, isLast }: { tx: Transaction; isLast: boolean }) {
  const isIncome = tx.income

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        gap: 14,
        padding: '12px 4px',
        borderBottom: isLast ? 'none' : '1px solid #141414',
        alignItems: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isIncome ? 'rgba(163,230,53,0.10)' : '#161616',
          border: isIncome ? '1px solid rgba(163,230,53,0.3)' : '1px solid #222',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isIncome ? '#a3e635' : '#a0a09e',
          flexShrink: 0,
        }}
      >
        <CategoryIcon name={tx.icon} width={15} height={15} />
      </div>

      {/* Middle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: '#f5f5f4',
              fontFamily: '"Geist", -apple-system, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tx.merchant}
          </span>
          {tx.recurring && (
            <span
              style={{
                fontSize: 10,
                fontFamily: '"JetBrains Mono", monospace',
                color: '#7a7a78',
                border: '1px solid #222',
                borderRadius: 4,
                padding: '1px 4px',
              }}
            >
              ↺
            </span>
          )}
          {tx.flagged && (
            <span
              style={{
                fontSize: 9,
                fontFamily: '"JetBrains Mono", monospace',
                color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 4,
                padding: '1px 5px',
                letterSpacing: '0.06em',
              }}
            >
              flagged
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#5b5b59',
          }}
        >
          {tx.cat} · {tx.when}
        </span>
      </div>

      {/* Amount */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          fontFamily: '"Geist", -apple-system, sans-serif',
          color: isIncome ? '#a3e635' : '#f5f5f4',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {isIncome ? '+' : '−'} RM {formatRM(Math.abs(tx.amount))}
      </span>
    </div>
  )
}

export default function RecentTransactions() {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #1a1a1a',
        background: '#0d0d0d',
        padding: '20px 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f4', fontFamily: '"Geist", -apple-system, sans-serif', margin: 0 }}>
            Recent activity
          </h2>
          <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#5b5b59', letterSpacing: '0.06em' }}>
            Last 8 transactions
          </span>
        </div>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#a3e635',
            fontSize: 12,
            fontFamily: '"Geist", -apple-system, sans-serif',
            fontWeight: 500,
          }}
        >
          View all →
        </button>
      </div>

      {/* List */}
      <div>
        {TRANSACTIONS.map((tx, i) => (
          <TxRow key={i} tx={tx} isLast={i === TRANSACTIONS.length - 1} />
        ))}
      </div>
    </div>
  )
}
