'use client'

import { useState, useRef } from 'react'

type Props = {
  onEdit: () => void
  onDelete: () => void
  children: React.ReactNode
  className?: string
}

export default function SwipeRow({ onEdit, onDelete, children, className = '' }: Props) {
  const [swiped, setSwiped] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY)
    if (dy > 30) return // vertical scroll — ignore
    if (dx > 55) setSwiped(true)
    else if (dx < -20) setSwiped(false)
  }

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Swipe-reveal buttons (touch) */}
      <div className="absolute right-0 inset-y-0 flex">
        <button
          onClick={() => { onEdit(); setSwiped(false) }}
          className="w-14 flex items-center justify-center bg-accent-light text-accent font-mono text-xs font-medium border-l border-border"
        >
          edit
        </button>
        <button
          onClick={onDelete}
          className="w-14 flex items-center justify-center bg-red-50 text-red-500 font-mono text-xs font-medium border-l border-border"
        >
          del
        </button>
      </div>

      {/* Sliding content layer — bg-inherit covers the absolute buttons behind */}
      <div
        className="relative transition-transform duration-200 ease-out bg-inherit"
        style={{ transform: swiped ? 'translateX(-112px)' : 'translateX(0)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (swiped) setSwiped(false) }}
      >
        {children}
      </div>
    </div>
  )
}
