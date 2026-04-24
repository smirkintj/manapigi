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
  departure: text('departure'),
  notes: text('notes'),
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
  paid: boolean('paid').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tripsRelations = relations(trips, ({ many }) => ({
  destinations: many(destinations),
  budgetCategories: many(budgetCategories),
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
