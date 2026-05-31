import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { trips, destinations, itineraryItems, budgetCategories, budgetItems, travelers } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? 'sk-f8bde78e0e4c4261a5e8baff1617aa03'
const DEEPSEEK_BASE = 'https://api.deepseek.com'
const CAT_COLORS = ['#2d5a3d', '#5a2d3d', '#2d3d5a', '#5a4e2d', '#4a2d5a', '#2d5a4e', '#5a3d2d']

function extractJson(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return match ? match[1].trim() : raw.trim()
}

type RefinementChange =
  | { type: 'update_trip'; data: { name?: string; description?: string; startDate?: string; endDate?: string; coverEmoji?: string } }
  | { type: 'add_destination'; data: { name: string; country: string; arrival: string | null; departure: string | null; transportMode: string | null; itinerary: { day: number | null; time: string | null; title: string; description: string | null }[] } }
  | { type: 'add_itinerary_items'; destinationName: string; items: { day: number | null; time: string | null; title: string; description: string | null }[] }
  | { type: 'add_budget_items'; categoryName: string; items: { label: string; amount: number; currency: string; perPax: boolean }[] }
  | { type: 'add_travelers'; names: string[] }

type RefinementResult = { summary: string; changes: RefinementChange[] }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { prompt } = await req.json()
  if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  // ── Fetch full trip ──────────────────────────────────────────────────────────
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, id),
    with: {
      destinations: {
        orderBy: (d, { asc }) => [asc(d.order)],
        with: { itineraryItems: { orderBy: (i, { asc }) => [asc(i.order)] } },
      },
      budgetCategories: {
        orderBy: (bc, { asc }) => [asc(bc.order)],
        with: { items: true },
      },
      travelers: { orderBy: (t, { asc }) => [asc(t.order)] },
    },
  })
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // ── Build compact context ───────────────────────────────────────────────────
  const lines: string[] = []
  lines.push(`Trip: "${trip.name}" | ${trip.currency} | ${trip.startDate ?? '?'} → ${trip.endDate ?? '?'}`)
  if (trip.travelers?.length) lines.push(`Travelers: ${trip.travelers.map(t => t.name).join(', ')}`)

  lines.push('\nDestinations:')
  for (const [i, d] of (trip.destinations ?? []).entries()) {
    lines.push(`${i + 1}. ${d.name}${d.country ? `, ${d.country}` : ''} (${d.arrival ?? '?'} → ${d.departure ?? '?'})${d.transportMode ? ` [arrive by ${d.transportMode}]` : ''}`)
    for (const item of d.itineraryItems ?? []) {
      lines.push(`   Day ${item.day ?? '?'} ${item.time ?? ''} – ${item.title}${item.description ? `: ${item.description}` : ''}`)
    }
  }

  lines.push('\nBudget:')
  for (const cat of trip.budgetCategories ?? []) {
    lines.push(`  ${cat.name}:`)
    for (const item of cat.items ?? []) {
      lines.push(`    - ${item.label}: ${item.itemCurrency} ${item.amount}${item.perPax ? '/pax' : ''}`)
    }
  }

  const tripContext = lines.join('\n')

  const systemPrompt = `You are a travel planning assistant helping to refine an existing trip. You will receive the current trip details and a refinement request, then output ONLY a JSON object describing what should change. Today's date is ${new Date().toISOString().slice(0, 10)}.

Output ONLY valid JSON with this structure (no markdown, no explanation):
{
  "summary": "One sentence describing what you changed",
  "changes": [
    { "type": "update_trip", "data": { "name": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "description": "..." } },
    { "type": "add_destination", "data": { "name": "City", "country": "Country", "arrival": "YYYY-MM-DD", "departure": "YYYY-MM-DD", "transportMode": "flight|train|bus|driving|ferry|walking", "itinerary": [{ "day": 1, "time": "09:00", "title": "Activity", "description": "Detail" }] } },
    { "type": "add_itinerary_items", "destinationName": "Exact city name from the trip", "items": [{ "day": 2, "time": "19:00", "title": "Activity", "description": "Detail" }] },
    { "type": "add_budget_items", "categoryName": "Exact category name or new one", "items": [{ "label": "Item", "amount": 100, "currency": "${trip.currency}", "perPax": false }] },
    { "type": "add_travelers", "names": ["Name"] }
  ]
}

Rules:
- Only include change types that are needed for the request
- For add_itinerary_items, destinationName must exactly match a destination already in the trip
- Never remove or modify existing items — only add new ones (except update_trip which can update top-level fields)
- For update_trip, only include fields that should change
- Keep changes focused and realistic`

  // ── Call DeepSeek ────────────────────────────────────────────────────────────
  let result: RefinementResult
  try {
    const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Current trip:\n${tripContext}\n\nRefinement request: ${prompt}` },
        ],
        temperature: 0.5,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('DeepSeek refine error:', res.status, err)
      return NextResponse.json({ error: `AI error: ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    result = JSON.parse(extractJson(raw))
  } catch (err) {
    console.error('refine-trip error:', err)
    return NextResponse.json({ error: 'Failed to generate refinements' }, { status: 500 })
  }

  // ── Apply changes ────────────────────────────────────────────────────────────
  const appliedTypes: string[] = []

  for (const change of result.changes ?? []) {
    try {
      if (change.type === 'update_trip') {
        const d = change.data
        await db.update(trips).set({
          ...(d.name && { name: d.name }),
          ...(d.description !== undefined && { description: d.description }),
          ...(d.startDate !== undefined && { startDate: d.startDate }),
          ...(d.endDate !== undefined && { endDate: d.endDate }),
          ...(d.coverEmoji && { coverEmoji: d.coverEmoji }),
          updatedAt: new Date(),
        }).where(eq(trips.id, id))
        appliedTypes.push('trip details')
      }

      else if (change.type === 'add_travelers') {
        const existing = (trip.travelers ?? []).map(t => t.name.toLowerCase())
        const toAdd = (change.names ?? []).filter(n => !existing.includes(n.toLowerCase()))
        if (toAdd.length) {
          const [{ c }] = await db.select({ c: count() }).from(travelers).where(eq(travelers.tripId, id))
          await db.insert(travelers).values(toAdd.map((name, i) => ({ tripId: id, name, order: Number(c) + i })))
          appliedTypes.push('travelers')
        }
      }

      else if (change.type === 'add_destination') {
        const d = change.data
        const [{ c }] = await db.select({ c: count() }).from(destinations).where(eq(destinations.tripId, id))

        let lat: number | null = null, lng: number | null = null
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${d.name}, ${d.country}`)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'manapigi-travel-planner' }, signal: AbortSignal.timeout(5000) }
          )
          const gd = await geo.json()
          if (gd[0]) { lat = parseFloat(gd[0].lat); lng = parseFloat(gd[0].lon) }
        } catch { /* geocoding optional */ }

        const [dest] = await db.insert(destinations).values({
          tripId: id, name: d.name, country: d.country ?? null,
          lat, lng, arrival: d.arrival ?? null, departure: d.departure ?? null,
          transportMode: d.transportMode ?? null, order: Number(c),
        }).returning()

        if (d.itinerary?.length) {
          await db.insert(itineraryItems).values(
            d.itinerary.map((item, j) => ({
              destinationId: dest.id, day: item.day ?? null, time: item.time ?? null,
              title: item.title, description: item.description ?? null, order: j,
            }))
          )
        }
        appliedTypes.push(`stop: ${d.name}`)
      }

      else if (change.type === 'add_itinerary_items') {
        const dest = (trip.destinations ?? []).find(
          d => d.name.toLowerCase() === change.destinationName?.toLowerCase()
        )
        if (dest) {
          const existing = dest.itineraryItems?.length ?? 0
          await db.insert(itineraryItems).values(
            change.items.map((item, j) => ({
              destinationId: dest.id, day: item.day ?? null, time: item.time ?? null,
              title: item.title, description: item.description ?? null, order: existing + j,
            }))
          )
          appliedTypes.push(`itinerary in ${dest.name}`)
        }
      }

      else if (change.type === 'add_budget_items') {
        const catName = change.categoryName
        let cat = (trip.budgetCategories ?? []).find(
          c => c.name.toLowerCase() === catName?.toLowerCase()
        )
        if (!cat) {
          const [{ c }] = await db.select({ c: count() }).from(budgetCategories).where(eq(budgetCategories.tripId, id))
          const [newCat] = await db.insert(budgetCategories).values({
            tripId: id, name: catName, color: CAT_COLORS[Number(c) % CAT_COLORS.length], order: Number(c),
          }).returning()
          cat = { ...newCat, items: [] }
        }
        await db.insert(budgetItems).values(
          change.items.map(item => ({
            categoryId: cat!.id, label: item.label,
            amount: item.amount ?? 0, itemCurrency: item.currency ?? trip.currency,
            perPax: item.perPax ?? false, bookingStatus: 'pending' as const,
          }))
        )
        appliedTypes.push(`budget: ${catName}`)
      }
    } catch (err) {
      console.error(`Failed applying change type ${change.type}:`, err)
    }
  }

  return NextResponse.json({ summary: result.summary, applied: appliedTypes })
}
