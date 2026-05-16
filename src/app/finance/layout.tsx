import { GeistSans } from 'geist/font/sans'

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={GeistSans.className}
      style={{
        background: '#0d0d0d',
        minHeight: '100vh',
        color: '#f5f5f4',
      }}
      data-finance
    >
      {children}
    </div>
  )
}
