'use client'

import React from 'react'
import { Icon } from './icons'
import { ShootingStarLayer } from './celestial'

interface Bullet {
  tone: 'warn' | 'ok' | 'tip'
  text: string
}

interface PlanStep {
  step: number
  title: string
  amount: number
  status: 'Done' | 'Recommended' | 'Optional'
  note: string
}

const COACH_DATA = {
  summary: "You're 63% through your salary on day 16 of 31 — pacing 3% above plan. Shopping is the only real outlier; the rest of your envelope is healthy.",
  bullets: [
    { tone: 'warn' as const, text: "Shopping is +257% vs your 3-month average. The two biggest hits were discretionary." },
    { tone: 'ok' as const, text: "Groceries and Transport are tracking under budget — keep doing what you're doing." },
    { tone: 'tip' as const, text: "If you skip the next big-ticket purchase, you'll close May with ~RM 1,800 leftover to deploy." },
  ] satisfies Bullet[],
  plan: [
    { step: 1, title: 'Clear credit card balance', amount: 0, status: 'Done' as const, note: 'No revolving balance this cycle. Nice.' },
    { step: 2, title: 'Emergency fund top-up', amount: 1200, status: 'Recommended' as const, note: 'Brings buffer to 4.1× monthly expenses. Target is 6×.' },
    { step: 3, title: 'ASB / Fixed Deposit', amount: 400, status: 'Optional' as const, note: 'Park here once emergency fund hits target.' },
    { step: 4, title: 'Index fund (growth)', amount: 200, status: 'Optional' as const, note: 'Dollar-cost average into a global index.' },
  ] satisfies PlanStep[],
}

const BULLET_COLORS = {
  warn: '#fbbf24',
  ok: '#a3e635',
  tip: '#7a7a78',
}

const STATUS_STYLES: Record<PlanStep['status'], { color: string; label: string }> = {
  Done: { color: '#a3e635', label: '✓ DONE' },
  Recommended: { color: '#a3e635', label: 'RECOMMENDED' },
  Optional: { color: '#5b5b59', label: 'OPTIONAL' },
}

export default function AICoachCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #1a1a1a',
        background: 'linear-gradient(180deg, #0f0f0f 0%, #0d0d0d 100%)',
        padding: '24px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ShootingStarLayer />

      {/* Lime glow */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: '#a3e635',
          opacity: 0.05,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: '1px solid rgba(163,230,53,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a3e635',
              }}
            >
              <Icon name="ai" width={15} height={15} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f4', fontFamily: '"Geist", -apple-system, sans-serif' }}>
              AI Coach
            </span>
            <span
              style={{
                fontSize: 9,
                fontFamily: '"JetBrains Mono", monospace',
                color: '#a3e635',
                border: '1px solid rgba(163,230,53,0.4)',
                borderRadius: 4,
                padding: '2px 6px',
                letterSpacing: '0.08em',
              }}
            >
              GENERATED
            </span>
          </div>
          <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#5b5b59', letterSpacing: '0.06em' }}>
            UPDATED 2 HOURS AGO · MODEL CLAUDE-SONNET
          </span>
        </div>
        <button
          style={{
            background: 'transparent',
            border: '1px solid #1f1f1f',
            borderRadius: 8,
            color: '#7a7a78',
            fontSize: 12,
            fontFamily: '"Geist", -apple-system, sans-serif',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Regenerate
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 24,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Left */}
        <div>
          <p
            style={{
              fontSize: 16,
              fontFamily: '"Geist", -apple-system, sans-serif',
              color: '#d0d0cf',
              lineHeight: 1.55,
              margin: '0 0 16px',
            }}
          >
            {COACH_DATA.summary}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COACH_DATA.bullets.map((bullet, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: BULLET_COLORS[bullet.tone],
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13.5, color: '#a0a09e', fontFamily: '"Geist", -apple-system, sans-serif', lineHeight: 1.5 }}>
                  {bullet.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: '#5b5b59', letterSpacing: '0.08em' }}>
              WHERE TO DEPLOY SURPLUS
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {COACH_DATA.plan.map((step) => {
              const isRec = step.status === 'Recommended'
              const isDone = step.status === 'Done'
              const statusStyle = STATUS_STYLES[step.status]

              return (
                <div
                  key={step.step}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: isRec ? '1px solid rgba(163,230,53,0.2)' : '1px solid transparent',
                    background: isRec ? 'rgba(163,230,53,0.04)' : 'transparent',
                  }}
                >
                  {/* Step number */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: isDone ? 'rgba(163,230,53,0.12)' : '#161616',
                      border: isDone ? '1px solid rgba(163,230,53,0.3)' : '1px solid #222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontFamily: '"JetBrains Mono", monospace',
                      color: isDone ? '#a3e635' : '#7a7a78',
                      flexShrink: 0,
                    }}
                  >
                    {step.step}
                  </div>

                  {/* Title + note */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#d0d0cf', fontFamily: '"Geist", -apple-system, sans-serif', display: 'block' }}>
                      {step.title}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#5b5b59', fontFamily: '"Geist", -apple-system, sans-serif' }}>
                      {step.note}
                    </span>
                  </div>

                  {/* Amount / status */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {isDone ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: '"JetBrains Mono", monospace',
                          color: '#a3e635',
                          border: '1px solid rgba(163,230,53,0.3)',
                          borderRadius: 4,
                          padding: '2px 6px',
                        }}
                      >
                        ✓ DONE
                      </span>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f4', fontFamily: '"Geist", -apple-system, sans-serif', display: 'block' }}>
                        RM {step.amount.toLocaleString()}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: statusStyle.color,
                        letterSpacing: '0.06em',
                        display: 'block',
                        marginTop: 2,
                      }}
                    >
                      {isDone ? '' : statusStyle.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
