import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const date = searchParams.get('date')
  if (!lat || !lng || !date) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)

  let apiUrl: string
  let historical = false

  if (diffDays > 14) {
    // Use archive API with same calendar date from previous year
    const prev = new Date(date)
    prev.setFullYear(prev.getFullYear() - 1)
    const prevDate = prev.toISOString().split('T')[0]
    apiUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${prevDate}&end_date=${prevDate}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    historical = true
  } else {
    apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&start_date=${date}&end_date=${date}&timezone=auto`
  }

  const res = await fetch(apiUrl)
  const data = await res.json()
  return NextResponse.json({ ...data, historical })
}
