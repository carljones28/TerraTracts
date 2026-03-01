import { pgTable, text, serial, integer, boolean, numeric, json, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { point, geography } from "./postgis-types";

// Enums
export const propertyTypeEnum = pgEnum('property_type', [
  'residential', 
  'commercial', 
  'recreational', 
  'agricultural', 
  'conservation',
  'land',
  'farm',
  'ranch',
  'mountain',
  'waterfront',
  'investment'
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low',
  'moderate',
  'high',
  'severe'
]);

export const userRoleEnum = pgEnum('user_role', [
  'buyer',
  'seller',
  'agent',
  'admin'
]);

export const propertyStatusEnum = pgEnum('property_status', [
  'active',
  'pending',
  'sold',
  'expired'
]);

export const accountStatusEnum = pgEnum('account_status', [
  'active',
  'pending',
  'disabled',
  'unverified'
]);

export const verificationMethodEnum = pgEnum('verification_method', [
  'email',
  'sms',
  'none'
]);

// Land tract types for boundary management
export const tractTypeEnum = pgEnum('tract_type', [
  'primary',      // Main/original tract
  'subdivision',  // Divided from parent tract
  'easement',     // Easement area
  'buildable',    // Buildable zone
  'restricted',   // Restricted/protected area
  'wetland',      // Wetland area
  'timber',       // Timber area
  'pasture',      // Pasture/grazing area
  'cropland',     // Agricultural cropland
  'custom'        // Custom user-defined tract
]);

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isAgent: boolean("is_agent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  
  // Additional fields now in the database
  role: text("role").default('buyer'),
  isEmailVerified: boolean("is_email_verified").default(false),
  isPhoneVerified: boolean("is_phone_verified").default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  lastLogin: timestamp("last_login"),
  
  // These fields are commented out because they don't exist in the database yet
  /*
  phone: text("phone"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  status: accountStatusEnum("status").default('unverified'),
  verificationMethod: verificationMethodEnum("verification_method").default('email'),
  updatedAt: timestamp("updated_at"),
  */
});

// Agent profiles for users who are agents
// Agent expertise categories
export const agentExpertiseEnum = pgEnum('agent_expertise', [
  'water_rights',
  'mineral_rights',
  'conservation_easements',
  'zoning_law',
  'land_development',
  'agricultural',
  'recreational',
  'timber',
  'ranch',
  'usda_loans',
  'rural_financing',
  'boundary_disputes',
  'land_valuation'
]);

// Agent certification types
export const agentCertificationEnum = pgEnum('agent_certification', [
  'licensed_surveyor_partner',
  'usda_loan_certified',
  'conservation_expert',
  'flood_zone_specialist',
  'rural_property_expert',
  'water_resource_specialist'
]);

export const agentProfiles = pgTable("agent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  brokerage: text("brokerage"),
  licenseNumber: text("license_number"),
  yearLicensed: text("year_licensed"),
  specialtyAreas: json("specialty_areas").$type<string[] | null>().default([]),
  expertiseCategories: json("expertise_categories").$type<string[] | null>().default([]),
  statesLicensed: json("states_licensed").$type<string[] | null>().default([]),
  serviceAreas: json("service_areas").$type<string[] | null>().default([]),
  bio: text("bio"),
  website: text("website"),
  facebook: text("facebook"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  linkedin: text("linkedin"),
  languages: json("languages").$type<string[] | null>().default(['English']),
  averageRating: numeric("average_rating").default('0'),
  totalReviews: integer("total_reviews").default(0),
  totalTransactions: integer("total_transactions").default(0),
  totalAcresSold: numeric("total_acres_sold").default('0'),
  responseTime: integer("response_time"), // Average response time in hours
  featuredAgent: boolean("featured_agent").default(false),
  verificationStatus: boolean("verification_status").default(false),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  boundarySpecialtyArea: geography("boundary_specialty_area"), // Geographic polygon of specialty area
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const landProperties = pgTable("land_properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  acreage: numeric("acreage").notNull(), // in acres
  location: text("location").notNull(),
  state: text("state").notNull(),
  streetAddress: text("street_address"), // Full street address like "123 County Road 242"
  zipCode: text("zip_code"), // ZIP code like "76870"
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  // PostGIS geospatial data
  coordinates: point("coordinates"), // POINT geometry type for exact location
  boundary: geography("boundary"), // GEOGRAPHY type for property boundary (polygon)
  propertyType: propertyTypeEnum("property_type").notNull(),
  zoning: text("zoning"),
  terrainType: text("terrain_type"),
  vegetation: text("vegetation"),
  waterResources: text("water_resources"),
  roadAccess: text("road_access"),
  utilities: json("utilities").$type<string[] | null>().default([]), // array of utility features
  amenities: json("amenities").$type<string[] | null>().default([]), // array of amenity features
  features: json("features").$type<string[] | null>().default([]), // Additional property features
  images: json("images").$type<string[] | null>().default([]), // array of image URLs
  video_url: text("video_url"), // URL to property video tour in snake_case (database field)
  // video_url is the database column name, we'll handle the camelCase conversion at the application level
  documents: json("documents").$type<Array<{name: string, url: string, type: string}> | null>().default([]), // Array of property documents
  isWaterfront: boolean("is_waterfront").default(false),
  isMountainView: boolean("is_mountain_view").default(false),
  featured: boolean("is_featured").default(false),
  status: propertyStatusEnum("status").default('active').notNull(),
  views: integer("views").default(0),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  sqft: integer("sqft"),
  ownerId: integer("owner_id").references(() => users.id), // Property owner
  listingAgentId: integer("listing_agent_id").references(() => users.id), // Agent listing the property
  agentName: text("agent_name"), // Listing agent name (denormalized for display)
  agentCompany: text("agent_company"), // Real estate company/brokerage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User saved searches for properties
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  criteria: json("criteria").notNull(), // Search criteria as JSON
  notifyEmail: boolean("notify_email").default(false),
  notifyFrequency: text("notify_frequency").default('weekly'), // daily, weekly, monthly
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  propertyId: integer("property_id").references(() => landProperties.id).notNull(),
  notes: text("notes"), // User notes about the property
  createdAt: timestamp("created_at").defaultNow(),
});

// Visual memory pins for property bookmarks
export const visualPins = pgTable("visual_pins", {
  id: serial("id").primaryKey(),
  favoriteId: integer("favorite_id").references(() => favorites.id).notNull(),
  imageIndex: integer("image_index").notNull(), // Index of the image in the property's images array
  xPosition: numeric("x_position").notNull(), // X coordinate (percentage, 0-100)
  yPosition: numeric("y_position").notNull(), // Y coordinate (percentage, 0-100)
  pinColor: text("pin_color").default("red"), // Color of the pin 
  label: text("label"), // Optional label for the pin
  note: text("note"), // Longer note about what's important at this location
  createdAt: timestamp("created_at").defaultNow(),
});

// Property notes and communication
export const propertyNotes = pgTable("property_notes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => landProperties.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inquiries from buyers to sellers/agents
export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => landProperties.id),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default('new').notNull(), // new, read, replied, archived
  createdAt: timestamp("created_at").defaultNow(),
});

// Resources and content for buyers, sellers, and agents
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // buyer-guide, seller-guide, land-investing, etc.
  targetRole: text("target_role"), // buyer, seller, agent, or null for all
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id),
  featured: boolean("featured").default(false),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications for users
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // inquiry, favorite, price-change, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: text("related_id"), // ID of related item (property, inquiry, etc.)
  relatedType: text("related_type"), // Type of related item
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent certifications
export const agentCertifications = pgTable("agent_certifications", {
  id: serial("id").primaryKey(),
  agentProfileId: integer("agent_profile_id").notNull().references(() => agentProfiles.id),
  name: text("name").notNull(),
  certType: agentCertificationEnum("cert_type").notNull(),
  issuer: text("issuer").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  verificationStatus: boolean("verification_status").default(false),
  verificationDate: timestamp("verification_date"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Land-specific agent reviews
export const agentReviews = pgTable("agent_reviews", {
  id: serial("id").primaryKey(),
  agentProfileId: integer("agent_profile_id").notNull().references(() => agentProfiles.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  propertyId: integer("property_id").references(() => landProperties.id),
  overallRating: integer("overall_rating").notNull(), // 1-5 stars
  boundaryResolutionRating: integer("boundary_resolution_rating"), // 1-5 stars
  soilAssessmentRating: integer("soil_assessment_rating"), // 1-5 stars
  waterRightsKnowledgeRating: integer("water_rights_knowledge_rating"), // 1-5 stars
  zoningExpertiseRating: integer("zoning_expertise_rating"), // 1-5 stars
  ruralFinancingRating: integer("rural_financing_rating"), // 1-5 stars
  negotiationRating: integer("negotiation_rating"), // 1-5 stars
  communicationRating: integer("communication_rating"), // 1-5 stars
  title: text("title").notNull(),
  content: text("content").notNull(),
  response: text("response"),
  responseDate: timestamp("response_date"),
  isVerified: boolean("is_verified").default(false),
  status: text("status").default("published"), // published, pending, rejected
  helpfulCount: integer("helpful_count").default(0),
  reportCount: integer("report_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent transaction history
export const agentTransactions = pgTable("agent_transactions", {
  id: serial("id").primaryKey(),
  agentProfileId: integer("agent_profile_id").notNull().references(() => agentProfiles.id),
  propertyId: integer("property_id").references(() => landProperties.id),
  transactionDate: timestamp("transaction_date").notNull(),
  acreage: numeric("acreage"),
  price: numeric("price"),
  transactionType: text("transaction_type").notNull(), // sale, purchase, lease
  propertyType: propertyTypeEnum("property_type"),
  location: text("location"),
  state: text("state"),
  county: text("county"),
  clientId: integer("client_id").references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  boundaryCoordinates: geography("boundary_coordinates"), // Property boundary
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Q&A Forum
export const agentQuestions = pgTable("agent_questions", {
  id: serial("id").primaryKey(),
  askerId: integer("asker_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[] | null>().default([]), // water-rights, zoning, etc.
  status: text("status").default("open"), // open, answered, closed
  viewCount: integer("view_count").default(0),
  upvoteCount: integer("upvote_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent answers to Q&A questions
export const agentAnswers = pgTable("agent_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => agentQuestions.id),
  agentId: integer("agent_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  upvoteCount: integer("upvote_count").default(0),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal rooms for live agent-client conversations
export const dealRooms = pgTable("deal_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  agentId: integer("agent_id").notNull().references(() => users.id),
  propertyId: integer("property_id").references(() => landProperties.id),
  status: text("status").default("active"), // active, archived, closed
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  attendeeCount: integer("attendee_count").default(0),
  roomType: text("room_type").default("property"), // property, topic, consultation
  accessCode: text("access_code"),
  isPublic: boolean("is_public").default(false),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verification attempts for users
export const verificationAttempts = pgTable("verification_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  method: verificationMethodEnum("method").notNull(),
  code: text("code").notNull(),
  destination: text("destination").notNull(), // email or phone number
  expiresAt: timestamp("expires_at").notNull(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Land tracts for property boundary management (land.id style)
export const landTracts = pgTable("land_tracts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => landProperties.id),
  parentTractId: integer("parent_tract_id"), // Self-reference for land division hierarchy
  name: text("name").notNull(),
  description: text("description"),
  tractType: tractTypeEnum("tract_type").default('primary').notNull(),
  // GeoJSON boundary stored as JSON for easy manipulation
  // Format: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
  boundaryGeoJson: json("boundary_geojson").$type<{
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  } | null>(),
  // Centroid point for map centering
  centroidLat: numeric("centroid_lat"),
  centroidLng: numeric("centroid_lng"),
  // Calculated acreage for this tract
  acreage: numeric("acreage"),
  // Color for map display
  fillColor: text("fill_color").default('#3b82f6'),
  strokeColor: text("stroke_color").default('#1d4ed8'),
  fillOpacity: numeric("fill_opacity").default('0.3'),
  // Metadata for additional properties
  metadata: json("metadata").$type<{
    soilType?: string;
    zoning?: string;
    restrictions?: string[];
    notes?: string;
    [key: string]: any;
  } | null>(),
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  properties: many(landProperties, { relationName: "owner" }),
  listingProperties: many(landProperties, { relationName: "listingAgent" }),
  favorites: many(favorites, { relationName: "user_favorites" }),
  savedSearches: many(savedSearches),
  agentProfile: one(agentProfiles),
  sentInquiries: many(inquiries, { relationName: "fromUser" }),
  receivedInquiries: many(inquiries, { relationName: "toUser" }),
  notifications: many(notifications),
  authoredResources: many(resources),
  verificationAttempts: many(verificationAttempts),
}));

export const agentProfilesRelations = relations(agentProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [agentProfiles.userId],
    references: [users.id],
  }),
  certifications: many(agentCertifications),
  reviews: many(agentReviews),
  transactions: many(agentTransactions),
  dealRooms: many(dealRooms, { relationName: "agentDealRooms" }),
}));

export const agentCertificationsRelations = relations(agentCertifications, ({ one }) => ({
  agentProfile: one(agentProfiles, {
    fields: [agentCertifications.agentProfileId],
    references: [agentProfiles.id],
  }),
}));

export const agentReviewsRelations = relations(agentReviews, ({ one }) => ({
  agentProfile: one(agentProfiles, {
    fields: [agentReviews.agentProfileId],
    references: [agentProfiles.id],
  }),
  reviewer: one(users, {
    fields: [agentReviews.reviewerId],
    references: [users.id],
  }),
  property: one(landProperties, {
    fields: [agentReviews.propertyId],
    references: [landProperties.id],
  }),
}));

export const agentTransactionsRelations = relations(agentTransactions, ({ one }) => ({
  agentProfile: one(agentProfiles, {
    fields: [agentTransactions.agentProfileId],
    references: [agentProfiles.id],
  }),
  property: one(landProperties, {
    fields: [agentTransactions.propertyId],
    references: [landProperties.id],
  }),
  client: one(users, {
    fields: [agentTransactions.clientId],
    references: [users.id],
  }),
}));

export const agentQuestionsRelations = relations(agentQuestions, ({ one, many }) => ({
  asker: one(users, {
    fields: [agentQuestions.askerId],
    references: [users.id],
  }),
  answers: many(agentAnswers),
}));

export const agentAnswersRelations = relations(agentAnswers, ({ one }) => ({
  question: one(agentQuestions, {
    fields: [agentAnswers.questionId],
    references: [agentQuestions.id],
  }),
  agent: one(users, {
    fields: [agentAnswers.agentId],
    references: [users.id],
  }),
}));

export const dealRoomsRelations = relations(dealRooms, ({ one }) => ({
  agent: one(users, {
    fields: [dealRooms.agentId],
    references: [users.id],
    relationName: "agentDealRooms"
  }),
  property: one(landProperties, {
    fields: [dealRooms.propertyId],
    references: [landProperties.id],
  }),
}));

export const landPropertiesRelations = relations(landProperties, ({ one, many }) => ({
  owner: one(users, {
    fields: [landProperties.ownerId],
    references: [users.id],
    relationName: "owner"
  }),
  listingAgent: one(users, {
    fields: [landProperties.listingAgentId],
    references: [users.id],
    relationName: "listingAgent"
  }),
  favorites: many(favorites, { relationName: "property_favorites" }),
  notes: many(propertyNotes),
  inquiries: many(inquiries),
}));

export const favoritesRelations = relations(favorites, ({ one, many }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
    relationName: "user_favorites"
  }),
  property: one(landProperties, {
    fields: [favorites.propertyId],
    references: [landProperties.id],
    relationName: "property_favorites"
  }),
  visualPins: many(visualPins),
}));

export const visualPinsRelations = relations(visualPins, ({ one }) => ({
  favorite: one(favorites, {
    fields: [visualPins.favoriteId],
    references: [favorites.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  property: one(landProperties, {
    fields: [inquiries.propertyId],
    references: [landProperties.id],
  }),
  fromUser: one(users, {
    fields: [inquiries.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  toUser: one(users, {
    fields: [inquiries.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
}));

export const propertyNotesRelations = relations(propertyNotes, ({ one }) => ({
  property: one(landProperties, {
    fields: [propertyNotes.propertyId],
    references: [landProperties.id],
  }),
  user: one(users, {
    fields: [propertyNotes.userId],
    references: [users.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  author: one(users, {
    fields: [resources.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const verificationAttemptsRelations = relations(verificationAttempts, ({ one }) => ({
  user: one(users, {
    fields: [verificationAttempts.userId],
    references: [users.id],
  }),
}));

// Land tracts relations
export const landTractsRelations = relations(landTracts, ({ one }) => ({
  property: one(landProperties, {
    fields: [landTracts.propertyId],
    references: [landProperties.id],
  }),
  parentTract: one(landTracts, {
    fields: [landTracts.parentTractId],
    references: [landTracts.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users, {
  id: undefined,
  createdAt: undefined
});

export const insertAgentProfileSchema = createInsertSchema(agentProfiles, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertLandPropertySchema = createInsertSchema(landProperties, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
}).extend({
  // Allow coordinates to be passed in various formats
  coordinates: z.any().optional().nullable(),
  // Allow boundary to be passed in various formats
  boundary: z.any().optional().nullable(),
  // Allow videoUrl camelCase format even though the database uses snake_case
  videoUrl: z.string().optional().nullable(),
  // Make these fields optional to handle case when boundary is used instead
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
});

export const insertFavoriteSchema = createInsertSchema(favorites, {
  id: undefined,
  createdAt: undefined
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertInquirySchema = createInsertSchema(inquiries, {
  id: undefined,
  createdAt: undefined
});

export const insertPropertyNoteSchema = createInsertSchema(propertyNotes, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertResourceSchema = createInsertSchema(resources, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  id: undefined,
  createdAt: undefined
});

export const insertAgentCertificationSchema = createInsertSchema(agentCertifications, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  verificationDate: undefined
});

export const insertAgentReviewSchema = createInsertSchema(agentReviews, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined,
  responseDate: undefined
});

export const insertAgentTransactionSchema = createInsertSchema(agentTransactions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertAgentQuestionSchema = createInsertSchema(agentQuestions, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertAgentAnswerSchema = createInsertSchema(agentAnswers, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertDealRoomSchema = createInsertSchema(dealRooms, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
});

export const insertVerificationAttemptSchema = createInsertSchema(verificationAttempts, {
  id: undefined,
  verifiedAt: undefined,
  createdAt: undefined
});

export const insertVisualPinSchema = createInsertSchema(visualPins, {
  id: undefined,
  createdAt: undefined
}).extend({
  // Allow decimal/float values for coordinates
  xPosition: z.number(),
  yPosition: z.number()
});

// GeoJSON schema for tract boundaries
const geoJsonPolygonSchema = z.object({
  type: z.enum(["Polygon", "MultiPolygon"]),
  coordinates: z.union([
    z.array(z.array(z.array(z.number()))), // Polygon
    z.array(z.array(z.array(z.array(z.number())))) // MultiPolygon
  ])
});

export const insertLandTractSchema = createInsertSchema(landTracts, {
  id: undefined,
  createdAt: undefined,
  updatedAt: undefined
}).extend({
  boundaryGeoJson: geoJsonPolygonSchema.optional().nullable(),
  acreage: z.string().optional().nullable(),
  centroidLat: z.string().optional().nullable(),
  centroidLng: z.string().optional().nullable(),
  fillOpacity: z.string().optional().nullable(),
  metadata: z.object({
    soilType: z.string().optional(),
    zoning: z.string().optional(),
    restrictions: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).passthrough().optional().nullable()
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAgentProfile = z.infer<typeof insertAgentProfileSchema>;
export type InsertLandProperty = z.infer<typeof insertLandPropertySchema>;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type InsertPropertyNote = z.infer<typeof insertPropertyNoteSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertVerificationAttempt = z.infer<typeof insertVerificationAttemptSchema>;
export type InsertVisualPin = z.infer<typeof insertVisualPinSchema>;
export type InsertAgentCertification = z.infer<typeof insertAgentCertificationSchema>;
export type InsertAgentReview = z.infer<typeof insertAgentReviewSchema>;
export type InsertAgentTransaction = z.infer<typeof insertAgentTransactionSchema>;
export type InsertAgentQuestion = z.infer<typeof insertAgentQuestionSchema>;
export type InsertAgentAnswer = z.infer<typeof insertAgentAnswerSchema>;
export type InsertDealRoom = z.infer<typeof insertDealRoomSchema>;
export type InsertLandTract = z.infer<typeof insertLandTractSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type AgentProfile = typeof agentProfiles.$inferSelect;
export type LandProperty = typeof landProperties.$inferSelect & {
  // Add videoUrl as a nullable property 
  videoUrl: string | null;
  // Ensure the documents property is available with the right type
  documents: Array<{name: string, url: string, type: string}>;
};
export type Favorite = typeof favorites.$inferSelect;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type PropertyNote = typeof propertyNotes.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type VerificationAttempt = typeof verificationAttempts.$inferSelect;
export type VisualPin = typeof visualPins.$inferSelect;
export type AgentCertification = typeof agentCertifications.$inferSelect;
export type AgentReview = typeof agentReviews.$inferSelect;
export type AgentTransaction = typeof agentTransactions.$inferSelect;
export type AgentQuestion = typeof agentQuestions.$inferSelect;
export type AgentAnswer = typeof agentAnswers.$inferSelect;
export type DealRoom = typeof dealRooms.$inferSelect;
export type LandTract = typeof landTracts.$inferSelect;
