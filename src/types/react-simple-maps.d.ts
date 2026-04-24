declare module 'react-simple-maps' {
  import { ComponentType, SVGProps } from 'react'

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: {
      scale?: number
      center?: [number, number]
      rotate?: [number, number, number]
    }
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  interface GeographiesProps {
    geography: string | object
    children: (args: { geographies: Geography[] }) => React.ReactNode
  }

  interface Geography {
    rsmKey: string
    [key: string]: unknown
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
  }

  interface MarkerProps {
    coordinates: [number, number]
    children?: React.ReactNode
  }

  interface LineProps {
    from: [number, number]
    to: [number, number]
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
    strokeLinecap?: string
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const Marker: ComponentType<MarkerProps>
  export const Line: ComponentType<LineProps>
}
