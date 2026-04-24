export type Trip = {
  id: string
  name: string
  description: string | null
  coverEmoji: string | null
  shareToken: string
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
  destinations?: Destination[]
  budgetCategories?: BudgetCategory[]
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
  paid: boolean
}
