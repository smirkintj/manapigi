'use client'

import { useState, useRef, useEffect } from 'react'
import { formatDate } from '@/lib/utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Mo','Tu','We','Th','Fr','Sa','Su']

type Props = {
  value: string // YYYY-MM-DD or ''
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function DatePicker({ value, onChange, placeholder = 'Pick date', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const parts = value ? value.split('-').map(Number) : []
  const [selY, selM, selD] = parts.length === 3 ? parts : [null, null, null]

  const today = new Date()
  const [viewY, setViewY] = useState(selY ?? today.getFullYear())
  const [viewM, setViewM] = useState(selM ? selM - 1 : today.getMonth())

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate()
  const startOffset = (new Date(viewY, viewM, 1).getDay() + 6) % 7 // Mon=0

  const openDrop = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 228) })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false)
    }
    const closeScroll = () => setOpen(false)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', closeScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', closeScroll, true)
    }
  }, [open])

  const prevMonth = () => viewM === 0 ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1)
  const nextMonth = () => viewM === 11 ? (setViewM(0), setViewY(y => y + 1)) : setViewM(m => m + 1)

  const select = (day: number) => {
    const m = String(viewM + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${viewY}-${m}-${d}`)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openDrop}
        className={`border border-border rounded-lg px-2.5 py-1.5 text-left bg-card focus:outline-none focus:border-accent font-mono text-sm ${className}`}
      >
        {value ? (
          <span className="text-ink">{formatDate(value)}</span>
        ) : (
          <span className="text-muted">{placeholder}</span>
        )}
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999 }}
          className="bg-card border border-border rounded-xl shadow-xl p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="font-mono text-sm text-muted hover:text-ink w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream transition-colors">
              ‹
            </button>
            <span className="font-mono text-xs font-semibold text-ink">
              {MONTHS[viewM]} {viewY}
            </span>
            <button type="button" onClick={nextMonth}
              className="font-mono text-sm text-muted hover:text-ink w-7 h-7 flex items-center justify-center rounded-lg hover:bg-cream transition-colors">
              ›
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center font-mono text-[9px] text-muted py-0.5">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startOffset }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const isSelected = selD === day && selM === viewM + 1 && selY === viewY
              const isToday = today.getDate() === day && today.getMonth() === viewM && today.getFullYear() === viewY
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => select(day)}
                  className={`text-center font-mono text-[11px] py-1.5 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-accent text-cream font-bold'
                      : isToday
                      ? 'text-accent font-semibold bg-accent-light'
                      : 'text-ink hover:bg-cream'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }}
              className="mt-3 w-full font-mono text-[10px] text-muted hover:text-red-400 text-center transition-colors py-1">
              Clear date
            </button>
          )}
        </div>
      )}
    </>
  )
}
