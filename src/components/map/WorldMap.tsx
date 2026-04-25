'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '@/lib/types'
import { formatDate } from '@/lib/utils'

function makePin(index: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
    <circle cx="15" cy="15" r="13" fill="white" stroke="#2d5a3d" stroke-width="2.5"
      filter="drop-shadow(0 1px 3px rgba(0,0,0,0.18))"/>
    <text x="15" y="19.5" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#2d5a3d">${index}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  })
}

function gcArc(from: [number, number], to: [number, number], steps = 48): [number, number][] {
  const rad = (d: number) => (d * Math.PI) / 180
  const deg = (r: number) => (r * 180) / Math.PI
  const lat1 = rad(from[0]), lon1 = rad(from[1])
  const lat2 = rad(to[0]), lon2 = rad(to[1])
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ))
  if (d < 0.001) return [from, to]
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2)
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    pts.push([deg(Math.atan2(z, Math.sqrt(x * x + y * y))), deg(Math.atan2(y, x))])
  }
  return pts
}

async function fetchOsrmRoute(
  from: [number, number],
  to: [number, number],
  profile: 'driving' | 'foot'
): Promise<[number, number][] | null> {
  try {
    const fromStr = `${from[1]},${from[0]}`
    const toStr = `${to[1]},${to[0]}`
    const res = await fetch(`/api/route?from=${fromStr}&to=${toStr}&profile=${profile}`, {
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const coords = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
    if (!coords) return null
    return coords.map(([lng, lat]) => [lat, lng])
  } catch {
    return null
  }
}

type RouteEntry = { pts: [number, number][]; dashed: boolean }
type RouteMap = Record<string, RouteEntry>

function BoundsController({ destinations }: { destinations: Destination[] }) {
  const map = useMap()
  const key = destinations.filter((d) => d.lat != null).map((d) => d.id).join(',')
  useEffect(() => {
    const pts = destinations.filter((d) => d.lat != null && d.lng != null)
    if (pts.length === 0) return
    if (pts.length === 1) { map.setView([pts[0].lat!, pts[0].lng!], 12, { animate: true }); return }
    map.fitBounds(L.latLngBounds(pts.map((d) => [d.lat!, d.lng!])), { padding: [60, 60], animate: true, maxZoom: 13 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

type Props = { destinations: Destination[] }

export default function WorldMap({ destinations }: Props) {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)
  const [routes, setRoutes] = useState<RouteMap>({})

  const routeKey = mapped.map((d) => `${d.id}:${d.transportMode ?? ''}`).join('|')

  useEffect(() => {
    if (mapped.length < 2) return
    let cancelled = false

    const build = async () => {
      const result: RouteMap = {}
      for (let i = 0; i < mapped.length - 1; i++) {
        if (cancelled) return
        const from = mapped[i]
        const to = mapped[i + 1]
        const mode = to.transportMode
        const key = `${from.id}-${to.id}`
        const fromPt: [number, number] = [from.lat!, from.lng!]
        const toPt: [number, number] = [to.lat!, to.lng!]

        if (mode === 'flight' || mode === 'ferry') {
          result[key] = { pts: gcArc(fromPt, toPt), dashed: true }
        } else if (mode === 'driving' || mode === 'bus' || mode === 'train') {
          const pts = await fetchOsrmRoute(fromPt, toPt, 'driving')
          result[key] = { pts: pts ?? [fromPt, toPt], dashed: false }
        } else if (mode === 'walking') {
          const pts = await fetchOsrmRoute(fromPt, toPt, 'foot')
          result[key] = { pts: pts ?? [fromPt, toPt], dashed: false }
        } else {
          result[key] = { pts: [fromPt, toPt], dashed: false }
        }
      }
      if (!cancelled) setRoutes(result)
    }

    build()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey])

  return (
    <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <BoundsController destinations={destinations} />

        {mapped.length > 1 && mapped.slice(1).map((to, i) => {
          const from = mapped[i]
          const key = `${from.id}-${to.id}`
          const route = routes[key]
          const pts = route?.pts ?? [[from.lat!, from.lng!], [to.lat!, to.lng!]]
          const dashed = route?.dashed ?? false
          return (
            <React.Fragment key={key}>
              <Polyline positions={pts} color="#2d5a3d" weight={5} opacity={0.1} />
              <Polyline
                positions={pts}
                color="#2d5a3d"
                weight={2}
                dashArray={dashed ? '7 5' : undefined}
                opacity={0.72}
              />
            </React.Fragment>
          )
        })}

        {mapped.map((d, i) => (
          <Marker key={d.id} position={[d.lat!, d.lng!]} icon={makePin(i + 1)}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 120 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: '0 0 2px' }}>{d.name}</p>
                {(d.arrival || d.departure) && (
                  <p style={{ fontSize: 11, color: '#7a7a6e', margin: 0 }}>
                    {[d.arrival, d.departure].filter(Boolean).map(formatDate).join(' → ')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {destinations.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none z-10">
          <p className="font-mono text-xs text-muted bg-cream/90 px-3 py-1.5 rounded-full border border-border">
            Add stops to see the route
          </p>
        </div>
      )}
    </div>
  )
}
