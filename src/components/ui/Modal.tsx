'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[201] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="font-serif text-xl text-ink">{title}</h2>
              <button onClick={onClose} className="text-muted hover:text-ink transition-colors text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
