'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Destination } from '@/lib/types'

function makeIcon(index: number) {
  return L.divIcon({
    html: `<div style="
      background:#2d5a3d;color:#fff;
      border:2.5px solid #fff;
      border-radius:50%;
      width:26px;height:26px;
      display:flex;align-items:center;justify-content:center;
      font:700 11px/1 Inter,sans-serif;
      box-shadow:0 2px 6px rgba(0,0,0,.25);
    ">${index}</div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  })
}

function BoundsController({ destinations }: { destinations: Destination[] }) {
  const map = useMap()

  useEffect(() => {
    const pts = destinations.filter((d) => d.lat != null && d.lng != null)
    if (pts.length === 0) return
    if (pts.length === 1) {
      map.setView([pts[0].lat!, pts[0].lng!], 10, { animate: true })
      return
    }
    const bounds = L.latLngBounds(pts.map((d) => [d.lat!, d.lng!]))
    map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 12 })
  }, [destinations, map])

  return null
}

type Props = { destinations: Destination[] }

export default function WorldMap({ destinations }: Props) {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)
  const positions = mapped.map((d) => [d.lat!, d.lng!] as [number, number])

  return (
    <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        scrollWheelZoom
      >
        {/* Carto Positron — clean, warm-toned, no API key */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <BoundsController destinations={destinations} />

        {positions.length > 1 && (
          <Polyline
            positions={positions}
            color="#2d5a3d"
            weight={2.5}
            dashArray="7 5"
            opacity={0.85}
          />
        )}

        {mapped.map((d, i) => (
          <Marker key={d.id} position={[d.lat!, d.lng!]} icon={makeIcon(i + 1)}>
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, lineHeight: 1.4 }}>
                <strong style={{ color: '#111' }}>{d.name}</strong>
                {(d.arrival || d.departure) && (
                  <div style={{ color: '#7a7a6e', marginTop: 3, fontSize: 11 }}>
                    {[d.arrival, d.departure].filter(Boolean).join(' → ')}
                  </div>
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
