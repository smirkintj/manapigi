import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const cache: Record<string, { data: AreaInsight[]; ts: number }> = {}

export type AreaInsight = {
  name: string
  vibe: string[]
  best_for: string
  price_tier: 'budget' | 'mid' | 'luxury'
  tip: string
}

function extractJson(raw: string): string {
  // Strip markdown code fences if Claude wraps the response
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const city = searchParams.get('city')?.trim()
  const country = searchParams.get('country')?.trim()

  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const key = `${city},${country ?? ''}`.toLowerCase()
  const now = Date.now()
  if (cache[key] && now - cache[key].ts < 6 * 60 * 60 * 1000) {
    return NextResponse.json(cache[key].data)
  }

  const location = country ? `${city}, ${country}` : city
  const client = new Anthropic({ apiKey })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
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
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const insights: AreaInsight[] = JSON.parse(extractJson(raw))
    cache[key] = { data: insights, ts: now }
    return NextResponse.json(insights)
  } catch (err) {
    console.error('area-insights error:', err)
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
  }
}
