'use client'

import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <h2 className="font-serif text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  )
}
