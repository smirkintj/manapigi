import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiCache } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE = 'https://api.deepseek.com'
const TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export type AreaInsight = {
  name: string
  vibe: string[]
  best_for: string
  price_tier: 'budget' | 'mid' | 'luxury'
  tip: string
}

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city = searchParams.get('city')?.trim()
  const country = searchParams.get('country')?.trim()

  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })
  if (!DEEPSEEK_API_KEY) return NextResponse.json({ error: 'AI not configured' }, { status: 503 })

  const cacheKey = `area-insights:${city.toLowerCase()},${(country ?? '').toLowerCase()}`

  // Check DB cache
  try {
    const [row] = await db.select().from(aiCache).where(eq(aiCache.key, cacheKey))
    if (row && new Date(row.expiresAt) > new Date()) {
      return NextResponse.json(JSON.parse(row.data))
    }
  } catch { /* cache miss is fine */ }

  const location = country ? `${city}, ${country}` : city

  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: `You are a travel expert. For the city "${location}", suggest 4–6 distinct neighborhoods or areas where tourists typically stay. Return ONLY a raw JSON array — no markdown, no code fences, no explanation:

[
  {
    "name": "Area name",
    "vibe": ["keyword1", "keyword2"],
    "best_for": "One sentence on who should stay here",
    "price_tier": "budget",
    "tip": "One practical tip for staying here"
  }
]

price_tier must be one of: budget, mid, luxury.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const insights: AreaInsight[] = JSON.parse(extractJson(raw))

    // Upsert to DB cache
    const expiresAt = new Date(Date.now() + TTL_MS)
    try {
      await db.insert(aiCache).values({ key: cacheKey, data: JSON.stringify(insights), expiresAt })
        .onConflictDoUpdate({ target: aiCache.key, set: { data: JSON.stringify(insights), expiresAt } })
    } catch { /* cache write failure is non-fatal */ }

    return NextResponse.json(insights)
  } catch (err) {
    console.error('area-insights error:', err)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
