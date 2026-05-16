import React from 'react'
import SidebarClient from '@/components/finance/SidebarClient'
import TopHeader from '@/components/finance/TopHeader'
import HeroRemaining from '@/components/finance/HeroRemaining'
import StatsColumn from '@/components/finance/StatsColumn'
import CategoriesBlock from '@/components/finance/CategoriesBlock'
import RecentTransactions from '@/components/finance/RecentTransactions'
import AICoachCard from '@/components/finance/AICoachCard'
import RedFlagClient from '@/components/finance/RedFlagClient'

const DEMO = {
  remaining: 4417.60,
  salary: 12000,
  spent: 7582.40,
  daysIn: 31,
  dayOfMonth: 16,
  dailySpend: [120, 45, 380, 60, 0, 540, 90, 220, 75, 1240, 65, 110, 980, 95, 310, 250],
}

export default function FinancePage() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SidebarClient />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <TopHeader remaining={DEMO.remaining} salary={DEMO.salary} />
        <main
          style={{
            padding: '24px 32px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
          }}
        >
          <RedFlagClient />

          {/* Executive row: hero + stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)',
              gap: 16,
            }}
          >
            <HeroRemaining
              remaining={DEMO.remaining}
              salary={DEMO.salary}
              spent={DEMO.spent}
              daysIn={DEMO.daysIn}
              dayOfMonth={DEMO.dayOfMonth}
              dailySpend={DEMO.dailySpend}
            />
            <StatsColumn
              income={DEMO.salary}
              spent={DEMO.spent}
              dayOfMonth={DEMO.dayOfMonth}
              daysIn={DEMO.daysIn}
            />
          </div>

          {/* Categories + Transactions row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)',
              gap: 16,
            }}
          >
            <CategoriesBlock />
            <RecentTransactions />
          </div>

          {/* AI Coach */}
          <AICoachCard />
        </main>
      </div>
    </div>
  )
}
