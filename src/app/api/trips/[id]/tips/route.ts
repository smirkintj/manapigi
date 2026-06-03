import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { trips, destinations, aiCache } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE = 'https://api.deepseek.com'
const TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export type DestinationTip = {
  icon: string
  text: string
}

export type TipsResponse = {
  destination: string
  tips: DestinationTip[]
}[]

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: { destinations: { orderBy: (d, { asc }) => [asc(d.order)] } },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  if (!DEEPSEEK_API_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  const dests = trip.destinations ?? []
  if (!dests.length) return NextResponse.json([])

  const destIds = dests.map(d => d.id).sort().join(',')
  const cacheKey = `tips:${id}:${destIds}`

  // Check DB cache
  try {
    const [row] = await db.select().from(aiCache).where(eq(aiCache.key, cacheKey))
    if (row && new Date(row.expiresAt) > new Date()) {
      return NextResponse.json(JSON.parse(row.data))
    }
  } catch { /* cache miss */ }

  const stopList = dests.map(d => `- ${d.name}${d.country ? `, ${d.country}` : ''}`).join('\n')

  const prompt = `You are an expert travel advisor. For a trip with these stops:
${stopList}

Generate 4–5 practical, specific tips per destination. Tips should cover local transport hacks, must-try food spots (with names), best times to visit key sights, money-saving tricks, cultural etiquette, and safety notes.

Return ONLY a raw JSON array — no markdown, no code fences, no explanation:

[
  {
    "destination": "City name (must match the stop name exactly)",
    "tips": [
      { "icon": "🚇", "text": "Practical tip with specific detail" },
      { "icon": "🍜", "text": "Food tip with specific restaurant or dish name" }
    ]
  }
]

Use relevant emojis: 🚇 transport, 🍜 food, 🏛️ sights, 💴 money, 🌡️ weather, ⚠️ safety, 🛍️ shopping, 📱 apps, 🎫 tickets`

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const tips: TipsResponse = JSON.parse(extractJson(raw))

    // Upsert to DB cache
    const expiresAt = new Date(Date.now() + TTL_MS)
    try {
      await db.insert(aiCache).values({ key: cacheKey, data: JSON.stringify(tips), expiresAt })
        .onConflictDoUpdate({ target: aiCache.key, set: { data: JSON.stringify(tips), expiresAt } })
    } catch { /* non-fatal */ }

    return NextResponse.json(tips)
  } catch (err) {
    console.error('tips error:', err)
    return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 })
  }
}
