import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const cache: Record<string, { data: AreaInsight[]; ts: number }> = {}

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

  const apiKey = process.env.GEMINI_API_KEY ?? 'AIzaSyCUXx_9Bqbaw978aKlR5zG-8ZRdvfhfpdQ'

  const key = `${city},${country ?? ''}`.toLowerCase()
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < 6 * 60 * 60 * 1000) {
    return NextResponse.json(cache[key].data)
  }

  const location = country ? `${city}, ${country}` : city
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  try {
    const prompt = `You are a travel expert. For the city "${location}", suggest 4–6 distinct neighborhoods or areas where tourists typically stay. Return ONLY a raw JSON array — no markdown, no code fences, no explanation:

[
  {
    "name": "Area name",
    "vibe": ["keyword1", "keyword2"],
    "best_for": "One sentence on who should stay here",
    "price_tier": "budget",
    "tip": "One practical tip for staying here"
  }
]

price_tier must be one of: budget, mid, luxury.`

    const result = await model.generateContent(prompt)
    const raw = result.response.text()
    const insights: AreaInsight[] = JSON.parse(extractJson(raw))
    cache[key] = { data: insights, ts: now }
    return NextResponse.json(insights)
  } catch (err) {
    console.error('area-insights error:', err)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
