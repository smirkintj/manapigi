import { NextResponse } from 'next/server'

// 1-hour in-memory cache (per serverless instance)
let cache: { rates: Record<string, number>; ts: number } | null = null

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.ts < 60 * 60 * 1000) {
    return NextResponse.json(cache.rates)
  }

  try {
    // Returns how many of each currency = 1 MYR
    const res = await fetch('https://api.frankfurter.app/latest?from=MYR', {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    const rates: Record<string, number> = { MYR: 1, ...data.rates }
    cache = { rates, ts: now }
    return NextResponse.json(rates)
  } catch {
    // Fallback approximate rates (mid-2025 estimates)
    const fallback: Record<string, number> = {
      MYR: 1, JPY: 33.5, USD: 0.215, EUR: 0.198, SGD: 0.29,
      IDR: 3400, THB: 7.8, AUD: 0.335, GBP: 0.17, CNY: 1.56,
      KRW: 296, TWD: 6.95, HKD: 1.68,
    }
    return NextResponse.json(fallback)
  }
}
