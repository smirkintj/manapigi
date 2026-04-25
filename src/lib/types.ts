export type Trip = {
  id: string
  name: string
  description: string | null
  coverEmoji: string | null
  shareToken: string
  notes: string | null
  currency: string
  createdAt: Date | string
  updatedAt: Date | string
  destinations?: Destination[]
  budgetCategories?: BudgetCategory[]
  travelers?: Traveler[]
  accommodations?: Accommodation[]
}

export type Destination = {
  id: string
  tripId: string
  name: string
  country: string | null
  lat: number | null
  lng: number | null
  arrival: string | null
  departure: string | null
  notes: string | null
  transportMode: string | null
  order: number
  itineraryItems?: ItineraryItem[]
}

export type ItineraryItem = {
  id: string
  destinationId: string
  day: number | null
  time: string | null
  title: string
  description: string | null
  order: number
}

export type BudgetCategory = {
  id: string
  tripId: string
  name: string
  color: string | null
  order: number
  items?: BudgetItem[]
}

export type BudgetItem = {
  id: string
  categoryId: string
  label: string
  amount: number
  itemCurrency: string | null
  paid: boolean
}

export type Traveler = {
  id: string
  tripId: string
  name: string
  order: number
}

export type Accommodation = {
  id: string
  tripId: string
  destinationId: string | null
  name: string
  type: string | null
  checkIn: string | null
  checkOut: string | null
  order: number
  rooms?: AccommodationRoom[]
}

export type AccommodationRoom = {
  id: string
  accommodationId: string
  name: string
  guests: string | null
  price: number | null
}
