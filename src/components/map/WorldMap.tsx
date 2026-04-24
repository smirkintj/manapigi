'use client'

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps'
import type { Destination } from '@/lib/types'

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

type ProjectionConfig = {
  scale: number
  center: [number, number]
}

function getProjectionConfig(destinations: Destination[]): ProjectionConfig {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)

  if (mapped.length === 0) {
    return { scale: 147, center: [0, 10] }
  }

  if (mapped.length === 1) {
    return { scale: 900, center: [mapped[0].lng!, mapped[0].lat!] }
  }

  const lats = mapped.map((d) => d.lat!)
  const lngs = mapped.map((d) => d.lng!)

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const centerLat = (minLat + maxLat) / 2
  const centerLng = (minLng + maxLng) / 2

  // Use the larger span, add padding, then map to scale
  const span = Math.max(maxLat - minLat, maxLng - minLng)
  const padded = span * 1.6 + 4

  let scale: number
  if (padded <= 4) scale = 1800
  else if (padded <= 8) scale = 1100
  else if (padded <= 15) scale = 700
  else if (padded <= 25) scale = 450
  else if (padded <= 40) scale = 300
  else if (padded <= 70) scale = 200
  else if (padded <= 120) scale = 160
  else scale = 147

  return { scale, center: [centerLng, centerLat] }
}

type Props = {
  destinations: Destination[]
}

export default function WorldMap({ destinations }: Props) {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)
  const { scale, center } = getProjectionConfig(destinations)

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-accent-light">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale, center }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#cdd5c4"
                stroke="#f7f5f0"
                strokeWidth={0.6}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {mapped.slice(0, -1).map((d, i) => {
          const next = mapped[i + 1]
          return (
            <Line
              key={`route-${d.id}`}
              from={[d.lng!, d.lat!]}
              to={[next.lng!, next.lat!]}
              stroke="#2d5a3d"
              strokeWidth={1.8}
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          )
        })}

        {mapped.map((d, i) => (
          <Marker key={d.id} coordinates={[d.lng!, d.lat!]}>
            <circle r={6} fill="#2d5a3d" stroke="#f7f5f0" strokeWidth={2} />
            <text
              textAnchor="middle"
              y={-11}
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '9px',
                fontWeight: 600,
                fill: '#111111',
                pointerEvents: 'none',
              }}
            >
              {i + 1}. {d.name}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      {destinations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="font-mono text-xs text-muted bg-cream/80 px-3 py-1.5 rounded-full">
            Add destinations to visualise the route
          </p>
        </div>
      )}
    </div>
  )
}
