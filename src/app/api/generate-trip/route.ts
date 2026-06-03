import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
  trips, destinations, itineraryItems,
  budgetCategories, budgetItems, travelers, accommodations,
} from '@/db/schema'
import { nanoid } from 'nanoid'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? 'sk-f8bde78e0e4c4261a5e8baff1617aa03'
const DEEPSEEK_BASE = 'https://api.deepseek.com'
const CAT_COLORS = ['#2d5a3d', '#5a2d3d', '#2d3d5a', '#5a4e2d', '#4a2d5a', '#2d5a4e', '#5a3d2d']

type GeneratedAccommodation = {
  name: string
  type: 'hotel' | 'airbnb' | 'hostel' | 'guesthouse' | 'other'
  checkIn: string | null
  checkOut: string | null
  notes: string | null
}

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
    arrivalTime: string | null
    departure: string | null
    departureTime: string | null
    transportMode: string | null
    accommodation: GeneratedAccommodation | null
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

  const systemPrompt = `You are an expert travel planner. Generate a fully detailed, realistic trip plan as a single JSON object. Today's date is ${new Date().toISOString().slice(0, 10)}.

Return ONLY valid JSON — no markdown, no code fences. Use this exact structure:

{
  "name": "Trip name",
  "coverEmoji": "single emoji",
  "description": "2-sentence overview",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "travelers": ["Name1", "Name2"],
  "destinations": [
    {
      "name": "City",
      "country": "Country",
      "arrival": "YYYY-MM-DD",
      "arrivalTime": "HH:MM",
      "departure": "YYYY-MM-DD",
      "departureTime": "HH:MM",
      "transportMode": "flight|train|bus|driving|ferry|walking",
      "accommodation": {
        "name": "Specific hotel/hostel name",
        "type": "hotel|airbnb|hostel|guesthouse|other",
        "checkIn": "YYYY-MM-DD",
        "checkOut": "YYYY-MM-DD",
        "notes": "Practical notes: area, nearest station, check-in tips"
      },
      "itinerary": [
        {
          "day": 1,
          "time": "09:00",
          "title": "Specific activity name",
          "description": "Specific detail: exact venue name, how to get there (train line, stop name, fare), cost/entrance fee, insider tips"
        }
      ]
    }
  ],
  "budgetCategories": [
    {
      "name": "Flights",
      "items": [{ "label": "Airline + route (e.g. AirAsia KUL→NRT)", "amount": 1200, "currency": "${currency}", "perPax": true }]
    },
    {
      "name": "Accommodation",
      "items": [{ "label": "Hotel name + nights", "amount": 800, "currency": "${currency}", "perPax": false }]
    },
    {
      "name": "Local Transport",
      "items": [
        { "label": "Specific pass or card (e.g. JR Pass 7-day)", "amount": 320, "currency": "${currency}", "perPax": true },
        { "label": "Specific route (e.g. Shinkansen Tokyo→Kyoto)", "amount": 180, "currency": "${currency}", "perPax": true }
      ]
    },
    {
      "name": "Entrance Fees",
      "items": [{ "label": "Specific attraction (e.g. teamLab Planets)", "amount": 85, "currency": "${currency}", "perPax": true }]
    },
    {
      "name": "Food & Drinks",
      "items": [{ "label": "Daily food budget estimate", "amount": 150, "currency": "${currency}", "perPax": true }]
    }
  ]
}

Critical rules:
- ALWAYS include arrival and departure dates for every destination — weather depends on this
- Itinerary descriptions must name specific venues, the exact train line and stop, and the cost/fare
- Budget items must be specific (not "food in Tokyo" but "Tsukiji breakfast + ramen lunches + izakaya dinners avg")
- Entrance fees as separate line items per attraction
- Transport costs broken out per leg (each shinkansen, ferry, bus individually)
- Accommodation notes must include nearest transit station
- Currency for all amounts: "${currency}" unless user specifies otherwise
- If travelers not specified: use ["Traveler 1"] for solo or ["Traveler 1", "Traveler 2"] for couple`

  let generated: GeneratedTrip
  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(90000),
    })

    if (!res.ok) {
      console.error('DeepSeek error:', res.status, await res.text())
      return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    generated = JSON.parse(extractJson(raw))
  } catch (err) {
    console.error('generate-trip error:', err)
    return NextResponse.json({ error: 'Failed to generate trip plan' }, { status: 500 })
  }

  // ── Persist ──────────────────────────────────────────────────────────────────
  const [trip] = await db.insert(trips).values({
    name: generated.name,
    description: generated.description ?? null,
    coverEmoji: generated.coverEmoji ?? '✈️',
    currency,
    startDate: generated.startDate ?? null,
    endDate: generated.endDate ?? null,
    shareToken: nanoid(12),
  }).returning()

  if (generated.travelers?.length) {
    await db.insert(travelers).values(
      generated.travelers.map((name, i) => ({ tripId: trip.id, name, order: i }))
    )
  }

  for (let i = 0; i < (generated.destinations ?? []).length; i++) {
    const d = generated.destinations[i]

    let lat: number | null = null, lng: number | null = null
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${d.name}, ${d.country}`)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'manapigi-travel-planner' }, signal: AbortSignal.timeout(5000) }
      )
      const gd = await geo.json()
      if (gd[0]) { lat = parseFloat(gd[0].lat); lng = parseFloat(gd[0].lon) }
    } catch { /* optional */ }

    const [dest] = await db.insert(destinations).values({
      tripId: trip.id,
      name: d.name,
      country: d.country ?? null,
      lat, lng,
      arrival: d.arrival ?? null,
      arrivalTime: d.arrivalTime ?? null,
      departure: d.departure ?? null,
      departureTime: d.departureTime ?? null,
      transportMode: d.transportMode ?? null,
      order: i,
    }).returning()

    if (d.accommodation) {
      await db.insert(accommodations).values({
        tripId: trip.id,
        destinationId: dest.id,
        name: d.accommodation.name,
        type: d.accommodation.type ?? 'hotel',
        checkIn: d.accommodation.checkIn ?? d.arrival ?? null,
        checkOut: d.accommodation.checkOut ?? d.departure ?? null,
        notes: d.accommodation.notes ?? null,
        order: i,
      })
    }

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
        cat.items.map(item => ({
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
