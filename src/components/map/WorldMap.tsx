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

type Props = {
  destinations: Destination[]
}

export default function WorldMap({ destinations }: Props) {
  const mapped = destinations.filter((d) => d.lat != null && d.lng != null)

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-accent-light">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 140, center: [0, 10] }}
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
