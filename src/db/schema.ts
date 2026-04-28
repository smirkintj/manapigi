import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const trips = pgTable('trips', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  coverEmoji: text('cover_emoji').default('✈️'),
  shareToken: text('share_token').notNull().unique(),
  notes: text('notes'),
  currency: text('currency').default('MYR').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const destinations = pgTable('destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  country: text('country'),
  lat: real('lat'),
  lng: real('lng'),
  arrival: text('arrival'),
  arrivalTime: text('arrival_time'),
  departure: text('departure'),
  departureTime: text('departure_time'),
  notes: text('notes'),
  transportMode: text('transport_mode'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const itineraryItems = pgTable('itinerary_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  destinationId: uuid('destination_id')
    .notNull()
    .references(() => destinations.id, { onDelete: 'cascade' }),
  day: integer('day'),
  time: text('time'),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#2d5a3d'),
  order: integer('order').notNull().default(0),
})

export const budgetItems = pgTable('budget_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => budgetCategories.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  amount: real('amount').notNull().default(0),
  itemCurrency: text('item_currency').default('MYR').notNull(),
  perPax: boolean('per_pax').notNull().default(false),
  bookingStatus: text('booking_status').notNull().default('pending'), // pending | in_progress | done
  deadline: text('deadline'), // YYYY-MM-DD, optional
  accommodationId: uuid('accommodation_id').references(() => accommodations.id, { onDelete: 'set null' }),
  paidBy: text('paid_by'),
  sharedWith: text('shared_with'), // JSON string[] of traveler names; null = everyone
  paid: boolean('paid').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const travelers = pgTable('travelers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
})

export const accommodations = pgTable('accommodations', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  destinationId: uuid('destination_id').references(() => destinations.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  type: text('type').default('hotel'),
  checkIn: text('check_in'),
  checkOut: text('check_out'),
  notes: text('notes'),
  order: integer('order').notNull().default(0),
})

export const accommodationRooms = pgTable('accommodation_rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  accommodationId: uuid('accommodation_id')
    .notNull()
    .references(() => accommodations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  guests: text('guests'),
  price: real('price').default(0),
})

export const optionGroups = pgTable('option_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripId: uuid('trip_id')
    .notNull()
    .references(() => trips.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').default('other'), // flight | accommodation | transport | other
  selectedChoiceId: text('selected_choice_id'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const optionChoices = pgTable('option_choices', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => optionGroups.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  amount: real('amount').notNull().default(0),
  currency: text('currency').notNull().default('MYR'),
  timing: text('timing'),
  notes: text('notes'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Relations ──────────────────────────────────────────────────────────────

export const tripsRelations = relations(trips, ({ many }) => ({
  destinations: many(destinations),
  budgetCategories: many(budgetCategories),
  travelers: many(travelers),
  accommodations: many(accommodations),
  optionGroups: many(optionGroups),
}))

export const destinationsRelations = relations(destinations, ({ one, many }) => ({
  trip: one(trips, { fields: [destinations.tripId], references: [trips.id] }),
  itineraryItems: many(itineraryItems),
}))

export const itineraryItemsRelations = relations(itineraryItems, ({ one }) => ({
  destination: one(destinations, {
    fields: [itineraryItems.destinationId],
    references: [destinations.id],
  }),
}))

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  trip: one(trips, { fields: [budgetCategories.tripId], references: [trips.id] }),
  items: many(budgetItems),
}))

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  category: one(budgetCategories, {
    fields: [budgetItems.categoryId],
    references: [budgetCategories.id],
  }),
}))

export const travelersRelations = relations(travelers, ({ one }) => ({
  trip: one(trips, { fields: [travelers.tripId], references: [trips.id] }),
}))

export const accommodationsRelations = relations(accommodations, ({ one, many }) => ({
  trip: one(trips, { fields: [accommodations.tripId], references: [trips.id] }),
  rooms: many(accommodationRooms),
}))

export const accommodationRoomsRelations = relations(accommodationRooms, ({ one }) => ({
  accommodation: one(accommodations, {
    fields: [accommodationRooms.accommodationId],
    references: [accommodations.id],
  }),
}))

export const optionGroupsRelations = relations(optionGroups, ({ one, many }) => ({
  trip: one(trips, { fields: [optionGroups.tripId], references: [trips.id] }),
  choices: many(optionChoices),
}))

export const optionChoicesRelations = relations(optionChoices, ({ one }) => ({
  group: one(optionGroups, { fields: [optionChoices.groupId], references: [optionGroups.id] }),
}))
