'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '@/lib/types'
import { formatDate } from '@/lib/utils'

function makePin(index: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
    </filter>
    <path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.716 23.284 0 15 0z"
      fill="#2d5a3d" filter="url(#s)"/>
    <circle cx="15" cy="14" r="7.5" fill="white" opacity="0.95"/>
    <text x="15" y="18.5" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="9.5" font-weight="700" fill="#2d5a3d">${index}</text>
  </svg>`
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -40],
  })
}

function BoundsController({ destinations }: { destinations: Destination[] }) {
  const map = useMap()
  const key = destinations
    .filter((d) => d.lat != null)
    .map((d) => d.id)
    .join(',')

  useEffect(() => {
    const pts = destinations.filter((d) => d.lat != null && d.lng != null)
    if (pts.length === 0) return
    if (pts.length === 1) {
      map.setView([pts[0].lat!, pts[0].lng!], 12, { animate: true })
      return
    }
    const bounds = L.latLngBounds(pts.map((d) => [d.lat!, d.lng!]))
    map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 13 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return null
}

type Props = { destinations: Destination[] }

export default function WorldMap({ destinations }: Props) {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)
  const positions = mapped.map((d) => [d.lat!, d.lng!] as [number, number])

  return (
    <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        {/* CartoDB Voyager — full geography, warm tones, clean labels */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <BoundsController destinations={destinations} />

        {/* Route line — two layers for depth */}
        {positions.length > 1 && (
          <>
            <Polyline positions={positions} color="#2d5a3d" weight={4} opacity={0.15} />
            <Polyline
              positions={positions}
              color="#2d5a3d"
              weight={2}
              dashArray="8 6"
              opacity={0.8}
            />
          </>
        )}

        {mapped.map((d, i) => (
          <Marker key={d.id} position={[d.lat!, d.lng!]} icon={makePin(i + 1)}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 120 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: '0 0 2px' }}>
                  {d.name}
                </p>
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
