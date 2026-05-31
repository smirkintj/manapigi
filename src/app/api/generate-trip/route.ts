import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  trips, destinations, itineraryItems,
  budgetCategories, budgetItems, travelers,
} from '@/db/schema'
import { nanoid } from 'nanoid'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? ''
const DEEPSEEK_BASE = 'https://api.deepseek.com'

const CAT_COLORS = ['#2d5a3d', '#5a2d3d', '#2d3d5a', '#5a4e2d', '#4a2d5a', '#2d5a4e', '#5a3d2d']

type GeneratedTrip = {
  name: string
  coverEmoji: string
  description: string
  startDate: string | null
  endDate: string | null
  travelers: string[]
  destinations: Array<{
    name: string
    country: string
    arrival: string | null
    departure: string | null
    transportMode: string | null
    itinerary: Array<{
      day: number | null
      time: string | null
      title: string
      description: string | null
    }>
  }>
  budgetCategories: Array<{
    name: string
    items: Array<{
      label: string
      amount: number
      currency: string
      perPax: boolean
    }>
  }>
}

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

export async function POST(req: Request) {
  const { prompt, currency = 'MYR' } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  const apiKey = DEEPSEEK_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 503 })

  // ── 1. Call DeepSeek ─────────────────────────────────────────────────────────
  const systemPrompt = `You are a travel planning assistant. Given a user's trip idea, generate a detailed, realistic trip plan as a single JSON object. Today's date is ${new Date().toISOString().slice(0, 10)}.

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use this exact structure:

{
  "name": "Short trip name",
  "coverEmoji": "single emoji",
  "description": "1–2 sentence overview",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "travelers": ["Name1", "Name2"],
  "destinations": [
    {
      "name": "City name",
      "country": "Country name",
      "arrival": "YYYY-MM-DD or null",
      "departure": "YYYY-MM-DD or null",
      "transportMode": "flight|driving|train|bus|ferry|walking or null",
      "itinerary": [
        { "day": 1, "time": "09:00", "title": "Activity name", "description": "Brief detail" }
      ]
    }
  ],
  "budgetCategories": [
    {
      "name": "Category (e.g. Flights, Accommodation, Food, Transport, Activities)",
      "items": [
        { "label": "Item name", "amount": 1200, "currency": "${currency}", "perPax": false }
      ]
    }
  ]
}

Rules:
- Use the currency "${currency}" for all budget amounts unless the user specifies otherwise
- Generate 3–6 itinerary items per destination
- Generate realistic budget estimates
- If travelers are not specified, use ["Traveler 1", "Traveler 2"] for a couple or ["Traveler 1"] for solo
- transportMode on a destination = how you GET TO that destination from the previous one`

  let generated: GeneratedTrip
  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('DeepSeek error:', res.status, err)
      return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    generated = JSON.parse(extractJson(raw))
  } catch (err) {
    console.error('generate-trip error:', err)
    return NextResponse.json({ error: 'Failed to generate trip plan' }, { status: 500 })
  }

  // ── 2. Persist everything in DB ──────────────────────────────────────────────
  const [trip] = await db.insert(trips).values({
    name: generated.name,
    description: generated.description ?? null,
    coverEmoji: generated.coverEmoji ?? '✈️',
    currency,
    startDate: generated.startDate ?? null,
    endDate: generated.endDate ?? null,
    shareToken: nanoid(12),
  }).returning()

  // Travelers
  if (generated.travelers?.length) {
    await db.insert(travelers).values(
      generated.travelers.map((name, i) => ({ tripId: trip.id, name, order: i }))
    )
  }

  // Destinations + itinerary
  for (let i = 0; i < (generated.destinations ?? []).length; i++) {
    const d = generated.destinations[i]

    // Geocode via Nominatim
    let lat: number | null = null
    let lng: number | null = null
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${d.name}, ${d.country}`)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'manapigi-travel-planner' }, signal: AbortSignal.timeout(5000) }
      )
      const gd = await geo.json()
      if (gd[0]) { lat = parseFloat(gd[0].lat); lng = parseFloat(gd[0].lon) }
    } catch { /* geocoding optional */ }

    const [dest] = await db.insert(destinations).values({
      tripId: trip.id,
      name: d.name,
      country: d.country ?? null,
      lat,
      lng,
      arrival: d.arrival ?? null,
      departure: d.departure ?? null,
      transportMode: d.transportMode ?? null,
      order: i,
    }).returning()

    if (d.itinerary?.length) {
      await db.insert(itineraryItems).values(
        d.itinerary.map((item, j) => ({
          destinationId: dest.id,
          day: item.day ?? null,
          time: item.time ?? null,
          title: item.title,
          description: item.description ?? null,
          order: j,
        }))
      )
    }
  }

  // Budget
  for (let i = 0; i < (generated.budgetCategories ?? []).length; i++) {
    const cat = generated.budgetCategories[i]
    const [bc] = await db.insert(budgetCategories).values({
      tripId: trip.id,
      name: cat.name,
      color: CAT_COLORS[i % CAT_COLORS.length],
      order: i,
    }).returning()

    if (cat.items?.length) {
      await db.insert(budgetItems).values(
        cat.items.map((item) => ({
          categoryId: bc.id,
          label: item.label,
          amount: item.amount ?? 0,
          itemCurrency: item.currency ?? currency,
          perPax: item.perPax ?? false,
          bookingStatus: 'pending' as const,
        }))
      )
    }
  }

  return NextResponse.json({ tripId: trip.id }, { status: 201 })
}
