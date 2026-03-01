import { 
  users, type User, type InsertUser,
  landProperties, type LandProperty, type InsertLandProperty,
  favorites, type Favorite, type InsertFavorite,
  agentProfiles, type AgentProfile, type InsertAgentProfile,
  savedSearches, type SavedSearch, type InsertSavedSearch,
  resources, type Resource, type InsertResource,
  inquiries, type Inquiry, type InsertInquiry,
  propertyNotes, type PropertyNote, type InsertPropertyNote,
  notifications, type Notification, type InsertNotification,
  verificationAttempts, type VerificationAttempt, type InsertVerificationAttempt,
  visualPins, type VisualPin, type InsertVisualPin,
  agentCertifications, type AgentCertification, type InsertAgentCertification,
  agentReviews, type AgentReview, type InsertAgentReview,
  agentTransactions, type AgentTransaction, type InsertAgentTransaction,
  agentQuestions, type AgentQuestion, type InsertAgentQuestion,
  agentAnswers, type AgentAnswer, type InsertAgentAnswer,
  dealRooms, type DealRoom, type InsertDealRoom,
  landTracts, type LandTract, type InsertLandTract
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, or, SQL, sql, desc, asc, inArray } from "drizzle-orm";
import { getStateAbbreviation, getStateName } from "../shared/state-mapping";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<boolean>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Agent profile methods
  getAgentProfile(userId: number): Promise<AgentProfile | undefined>;
  createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile>;
  updateAgentProfile(userId: number, profileData: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined>;
  getAllAgents(): Promise<(User & { agentProfile?: AgentProfile })[]>;
  
  // Land property methods
  getProperty(id: number): Promise<LandProperty | undefined>;
  getAllProperties(): Promise<LandProperty[]>;
  getPropertiesByState(state: string): Promise<LandProperty[]>;
  getPropertiesByStatus(status: string): Promise<LandProperty[]>;
  getFeaturedProperties(): Promise<LandProperty[]>;
  getPropertiesByType(type: string): Promise<LandProperty[]>;
  getPropertiesByOwner(ownerId: number): Promise<LandProperty[]>;
  getPropertiesByAgent(agentId: number): Promise<LandProperty[]>;
  searchProperties(query: string): Promise<LandProperty[]>;
  createProperty(property: InsertLandProperty): Promise<LandProperty>;
  updateProperty(id: number, propertyData: Partial<InsertLandProperty>): Promise<LandProperty | undefined>;
  incrementPropertyViews(id: number): Promise<boolean>;
  
  // Geospatial methods
  getPropertiesWithinRadius(longitude: number, latitude: number, radiusMiles: number): Promise<LandProperty[]>;
  getPropertiesByBoundingBox(minLong: number, minLat: number, maxLong: number, maxLat: number): Promise<LandProperty[]>;
  getPropertyArea(propertyId: number): Promise<number | null>;
  getPropertiesByFeature(feature: string): Promise<LandProperty[]>;
  
  // Favorites methods
  getFavorite(userId: number, propertyId: number): Promise<Favorite | undefined>;
  getFavoritesByUser(userId: number): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(id: number): Promise<boolean>;
  
  // Visual Pin methods
  getVisualPinsByFavorite(favoriteId: number): Promise<VisualPin[]>;
  createVisualPin(pin: InsertVisualPin): Promise<VisualPin>;
  updateVisualPin(id: number, pinData: Partial<InsertVisualPin>): Promise<VisualPin | undefined>;
  removeVisualPin(id: number): Promise<boolean>;
  
  // Saved searches methods
  getSavedSearch(id: number): Promise<SavedSearch | undefined>;
  getSavedSearchesByUser(userId: number): Promise<SavedSearch[]>;
  createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch>;
  updateSavedSearch(id: number, searchData: Partial<InsertSavedSearch>): Promise<SavedSearch | undefined>;
  removeSavedSearch(id: number): Promise<boolean>;
  
  // Property notes methods
  getPropertyNotes(propertyId: number, userId?: number): Promise<PropertyNote[]>;
  createPropertyNote(note: InsertPropertyNote): Promise<PropertyNote>;
  updatePropertyNote(id: number, noteData: Partial<InsertPropertyNote>): Promise<PropertyNote | undefined>;
  removePropertyNote(id: number): Promise<boolean>;
  
  // Inquiry methods
  getInquiry(id: number): Promise<Inquiry | undefined>;
  getInquiriesByProperty(propertyId: number): Promise<Inquiry[]>;
  getInquiriesByUser(userId: number, isSender: boolean): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<boolean>;
  
  // Resource methods
  getResource(id: number): Promise<Resource | undefined>;
  getResourceBySlug(slug: string): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getResourcesByTargetRole(role: string): Promise<Resource[]>;
  getFeaturedResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resourceData: Partial<InsertResource>): Promise<Resource | undefined>;
  incrementResourceViews(id: number): Promise<boolean>;
  
  // Notification methods
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Verification methods
  createVerificationAttempt(attempt: InsertVerificationAttempt): Promise<VerificationAttempt>;
  getLatestVerificationAttempt(userId: number, method: string): Promise<VerificationAttempt | undefined>;
  markVerificationSuccessful(id: number): Promise<boolean>;
  
  // Enhanced Agent Directory methods
  getAgents(filters?: {
    state?: string;
    propertyType?: string;
    expertise?: string[];
    certifications?: string[];
    minRating?: number;
    minTransactions?: number;
    boundaryFilter?: any;
  }): Promise<(AgentProfile & { user: User })[]>;
  getAgentWithProfile(agentId: number): Promise<(AgentProfile & { user: User }) | undefined>;
  getAgentWithProfileByUserId(userId: number): Promise<(AgentProfile & { user: User }) | undefined>;
  getAgentCertifications(agentId: number): Promise<AgentCertification[]>;
  getAgentReviews(agentId: number): Promise<AgentReview[]>;
  getAgentTransactions(agentId: number): Promise<AgentTransaction[]>;
  getAgentQuestions(): Promise<AgentQuestion[]>;
  getAgentAnsweredQuestions(agentId: number): Promise<(AgentQuestion & { answers: AgentAnswer[] })[]>;
  createAgentCertification(certification: InsertAgentCertification): Promise<AgentCertification>;
  createAgentReview(review: InsertAgentReview): Promise<AgentReview>;
  createAgentTransaction(transaction: InsertAgentTransaction): Promise<AgentTransaction>;
  createAgentQuestion(question: InsertAgentQuestion): Promise<AgentQuestion>;
  createAgentAnswer(answer: InsertAgentAnswer): Promise<AgentAnswer>;
  createDealRoom(dealRoom: InsertDealRoom): Promise<DealRoom>;
  getDealRoomsByAgent(agentId: number): Promise<DealRoom[]>;
  
  // Teams methods
  getTeamStats(): Promise<{
    totalAgents: number;
    totalBrokerages: number;
    avgExperience: number;
    avgRating: number;
    totalSales: number;
  }>;
  getSpecialtiesWithCounts(): Promise<Array<{
    main_specialty: string;
    agent_count: number;
  }>>;
  
  // Land tract methods for property boundaries
  getTractsByProperty(propertyId: number): Promise<LandTract[]>;
  getTract(id: number): Promise<LandTract | undefined>;
  createTract(tract: InsertLandTract): Promise<LandTract>;
  updateTract(id: number, tractData: Partial<InsertLandTract>): Promise<LandTract | undefined>;
  deleteTract(id: number): Promise<boolean>;
  getChildTracts(parentTractId: number): Promise<LandTract[]>;
}

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async updateUserLastLogin(id: number): Promise<boolean> {
    try {
      await db.update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error updating user last login:', error);
      return false;
    }
  }
  
  // Agent profile methods
  async getAgentProfile(userId: number): Promise<AgentProfile | undefined> {
    try {
      const [profile] = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId));
      return profile;
    } catch (error) {
      console.error(`Error fetching agent profile for user ${userId}:`, error);
      return undefined;
    }
  }

  async createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile> {
    try {
      const [newProfile] = await db.insert(agentProfiles).values(profile).returning();
      return newProfile;
    } catch (error) {
      console.error('Error creating agent profile:', error);
      throw error;
    }
  }

  async updateAgentProfile(userId: number, profileData: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined> {
    try {
      const [profile] = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId));
      
      if (!profile) {
        return undefined;
      }
      
      const [updatedProfile] = await db.update(agentProfiles)
        .set(profileData)
        .where(eq(agentProfiles.userId, userId))
        .returning();
      
      return updatedProfile;
    } catch (error) {
      console.error(`Error updating agent profile for user ${userId}:`, error);
      return undefined;
    }
  }

  async getAllAgents(): Promise<(User & { agentProfile?: AgentProfile })[]> {
    try {
      // First get all users who are agents
      const agentUsers = await db.select()
        .from(users)
        .where(eq(users.isAgent, true));
      
      if (agentUsers.length === 0) {
        return [];
      }
      
      // Get all agent profiles
      const profiles = await db.select()
        .from(agentProfiles);
      
      // Map agent profiles to users
      return agentUsers.map(user => {
        const profile = profiles.find(profile => profile.userId === user.id);
        return {
          ...user,
          agentProfile: profile
        };
      });
    } catch (error) {
      console.error('Error fetching all agents:', error);
      return [];
    }
  }
  
  // Enhanced Agent Directory methods
  async getAgents(filters?: {
    state?: string;
    propertyType?: string;
    expertise?: string[];
    certifications?: string[];
    minRating?: number;
    minTransactions?: number;
    boundaryFilter?: any;
  }): Promise<(AgentProfile & { user: User })[]> {
    try {
      // Start with a base query to join agent profiles with users
      let query = db.select({
        agentProfile: agentProfiles,
        user: users,
      }).from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id));
      
      // Apply filters if provided
      if (filters) {
        // Filter by state (using statesLicensed array)
        if (filters.state) {
          const stateAbbr = getStateAbbreviation(filters.state);
          const stateName = getStateName(filters.state);
          // Check for both state abbreviation and full name
          query = query.where(
            or(
              sql`${agentProfiles.statesLicensed}::text LIKE ${'%' + stateAbbr + '%'}`,
              sql`${agentProfiles.statesLicensed}::text LIKE ${'%' + stateName + '%'}`
            )
          );
        }
        
        // Filter by property type expertise
        if (filters.propertyType) {
          query = query.where(
            sql`${agentProfiles.specialtyAreas}::text LIKE ${'%' + filters.propertyType + '%'}`
          );
        }
        
        // Filter by expertise areas (search in both expertiseCategories and specialtyAreas)
        if (filters.expertise && filters.expertise.length > 0) {
          // For array filters, we need to check if any of the expertise areas match
          // Search in both expertiseCategories and specialtyAreas for comprehensive coverage
          const expertiseConditions = filters.expertise.flatMap(exp => [
            sql`${agentProfiles.expertiseCategories}::text ILIKE ${'%' + exp + '%'}`,
            sql`${agentProfiles.specialtyAreas}::text ILIKE ${'%' + exp + '%'}`
          ]);
          query = query.where(or(...expertiseConditions));
        }
        
        // Filter by minimum rating
        if (filters.minRating !== undefined) {
          query = query.where(
            sql`${agentProfiles.averageRating} >= ${filters.minRating}`
          );
        }
        
        // Filter by minimum transactions
        if (filters.minTransactions !== undefined) {
          query = query.where(
            sql`${agentProfiles.totalTransactions} >= ${filters.minTransactions}`
          );
        }
        
        // Boundary filter is complex and would require PostGIS
        // This is a simplified version assuming boundary is a polygon
        if (filters.boundaryFilter && 
            filters.boundaryFilter.type === 'polygon' && 
            filters.boundaryFilter.coordinates) {
          // This would need a proper PostGIS query
          console.log('Boundary filter not fully implemented yet');
        }
      }
      
      const result = await query;
      
      // Transform the result to match the expected return type
      return result.map(({ agentProfile, user }) => ({
        ...agentProfile,
        user
      }));
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async getAgentWithProfile(agentId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    try {
      const [result] = await db.select({
        agentProfile: agentProfiles,
        user: users,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(eq(agentProfiles.id, agentId));
      
      if (!result) return undefined;
      
      return {
        ...result.agentProfile,
        user: result.user
      };
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      return undefined;
    }
  }


  async getAgentWithProfileByUserId(userId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    try {
      const [result] = await db.select({
        agentProfile: agentProfiles,
        user: users,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(eq(agentProfiles.userId, userId));

      if (!result) return undefined;

      return {
        ...result.agentProfile,
        user: result.user
      };
    } catch (error) {
      console.error(`Error fetching agent by user id ${userId}:`, error);
      return undefined;
    }
  }

  async getAgentCertifications(agentId: number): Promise<AgentCertification[]> {
    try {
      return await db.select()
        .from(agentCertifications)
        .where(eq(agentCertifications.agentProfileId, agentId));
    } catch (error) {
      console.error(`Error fetching certifications for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentReviews(agentId: number): Promise<AgentReview[]> {
    try {
      return await db.select()
        .from(agentReviews)
        .where(eq(agentReviews.agentProfileId, agentId))
        .orderBy(desc(agentReviews.createdAt));
    } catch (error) {
      console.error(`Error fetching reviews for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentTransactions(agentId: number): Promise<AgentTransaction[]> {
    try {
      return await db.select()
        .from(agentTransactions)
        .where(eq(agentTransactions.agentProfileId, agentId))
        .orderBy(desc(agentTransactions.transactionDate));
    } catch (error) {
      console.error(`Error fetching transactions for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentQuestions(): Promise<AgentQuestion[]> {
    try {
      return await db.select()
        .from(agentQuestions)
        .orderBy(desc(agentQuestions.createdAt));
    } catch (error) {
      console.error('Error fetching agent questions:', error);
      return [];
    }
  }
  
  async getAgentAnsweredQuestions(agentId: number): Promise<(AgentQuestion & { answers: AgentAnswer[] })[]> {
    try {
      // First get all answers by this agent
      const answers = await db.select()
        .from(agentAnswers)
        .where(eq(agentAnswers.agentProfileId, agentId));
      
      if (answers.length === 0) {
        return [];
      }
      
      // Get the unique question IDs from those answers
      const questionIds = [...new Set(answers.map(a => a.questionId))];
      
      // Get the questions
      const questions = await db.select()
        .from(agentQuestions)
        .where(inArray(agentQuestions.id, questionIds));
      
      // Map answers to each question
      return questions.map(question => {
        const questionAnswers = answers.filter(a => a.questionId === question.id);
        return {
          ...question,
          answers: questionAnswers
        };
      });
    } catch (error) {
      console.error(`Error fetching answered questions for agent ${agentId}:`, error);
      return [];
    }
  }
  
  async createAgentCertification(certification: InsertAgentCertification): Promise<AgentCertification> {
    try {
      const [newCertification] = await db.insert(agentCertifications).values(certification).returning();
      return newCertification;
    } catch (error) {
      console.error('Error creating agent certification:', error);
      throw error;
    }
  }
  
  async createAgentReview(review: InsertAgentReview): Promise<AgentReview> {
    try {
      const [newReview] = await db.insert(agentReviews).values(review).returning();
      
      // Update agent average rating
      await this.updateAgentRating(review.agentProfileId);
      
      return newReview;
    } catch (error) {
      console.error('Error creating agent review:', error);
      throw error;
    }
  }
  
  private async updateAgentRating(agentId: number): Promise<void> {
    try {
      // Get all reviews for the agent
      const reviews = await db.select()
        .from(agentReviews)
        .where(eq(agentReviews.agentProfileId, agentId));
      
      if (reviews.length === 0) {
        return;
      }
      
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0);
      const averageRating = totalRating / reviews.length;
      
      // Update agent profile
      await db.update(agentProfiles)
        .set({ 
          averageRating, 
          reviewCount: reviews.length 
        })
        .where(eq(agentProfiles.id, agentId));
    } catch (error) {
      console.error(`Error updating agent rating for ${agentId}:`, error);
    }
  }
  
  async createAgentTransaction(transaction: InsertAgentTransaction): Promise<AgentTransaction> {
    try {
      const [newTransaction] = await db.insert(agentTransactions).values(transaction).returning();
      
      // Update agent transaction count
      await this.updateAgentTransactionCount(transaction.agentProfileId);
      
      return newTransaction;
    } catch (error) {
      console.error('Error creating agent transaction:', error);
      throw error;
    }
  }
  
  private async updateAgentTransactionCount(agentId: number): Promise<void> {
    try {
      // Count all transactions for this agent
      const result = await db.select({ count: sql`count(*)` })
        .from(agentTransactions)
        .where(eq(agentTransactions.agentProfileId, agentId));
      
      const count = Number(result[0].count);
      
      // Update agent profile
      await db.update(agentProfiles)
        .set({ 
          transactionCount: count
        })
        .where(eq(agentProfiles.id, agentId));
    } catch (error) {
      console.error(`Error updating transaction count for agent ${agentId}:`, error);
    }
  }
  
  async createAgentQuestion(question: InsertAgentQuestion): Promise<AgentQuestion> {
    try {
      const [newQuestion] = await db.insert(agentQuestions).values(question).returning();
      return newQuestion;
    } catch (error) {
      console.error('Error creating agent question:', error);
      throw error;
    }
  }
  
  async createAgentAnswer(answer: InsertAgentAnswer): Promise<AgentAnswer> {
    try {
      const [newAnswer] = await db.insert(agentAnswers).values(answer).returning();
      return newAnswer;
    } catch (error) {
      console.error('Error creating agent answer:', error);
      throw error;
    }
  }
  
  async createDealRoom(dealRoom: InsertDealRoom): Promise<DealRoom> {
    try {
      const [newDealRoom] = await db.insert(dealRooms).values(dealRoom).returning();
      return newDealRoom;
    } catch (error) {
      console.error('Error creating deal room:', error);
      throw error;
    }
  }
  
  async getDealRoomsByAgent(agentId: number): Promise<DealRoom[]> {
    try {
      return await db.select()
        .from(dealRooms)
        .where(eq(dealRooms.agentProfileId, agentId))
        .orderBy(desc(dealRooms.createdAt));
    } catch (error) {
      console.error(`Error fetching deal rooms for agent ${agentId}:`, error);
      return [];
    }
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    // For now, since we don't have a role column in the database,
    // we'll use isAgent to distinguish between regular users and agents
    if (role === 'agent') {
      return await db.select().from(users).where(eq(users.isAgent, true));
    } else {
      return await db.select().from(users).where(eq(users.isAgent, false));
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure fields match the actual database schema
    // Only include fields that exist in the database
    const userData = {
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      first_name: insertUser.firstName ?? null,
      last_name: insertUser.lastName ?? null,
      is_agent: insertUser.isAgent ?? false
      // Do not include fields that don't exist in the database like 'phone'
    };
    
    try {
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Land property methods
  // Helper function to map database properties to application properties
  private mapDbPropertyToAppProperty(property: any): LandProperty {
    if (!property) return property;
    
    // Create a copy of the property
    const mappedProperty = { ...property };
    
    // IMPORTANT: Always set videoUrl (camelCase) from video_url (snake_case)
    // This is required by the LandProperty type interface in schema.ts
    const videoUrl = property.video_url || '';
    
    // Use a default empty string to avoid null/undefined issues
    
    // Always add videoUrl as a regular, enumerable property
    mappedProperty.videoUrl = videoUrl;
    
    // For extra safety, also add it as a defined property
    // This ensures it's always available and correctly typed
    Object.defineProperty(mappedProperty, 'videoUrl', {
      value: videoUrl,
      writable: true,
      enumerable: true, // Make sure it's visible in JSON
      configurable: true
    });
    
    // Make sure documents are always an array, never null or undefined
    if (!mappedProperty.documents) {
      mappedProperty.documents = [];
    } else if (typeof mappedProperty.documents === 'string') {
      // If documents is a string (like JSON string), try to parse it
      try {
        mappedProperty.documents = JSON.parse(mappedProperty.documents);
      } catch (e) {
        console.error(`Error parsing documents for property ${property.id}:`, e);
        mappedProperty.documents = [];
      }
    }
    
    // Ensure documents is always an array
    if (!Array.isArray(mappedProperty.documents)) {
      mappedProperty.documents = [];
    }
    
    // Convert document URLs to relative paths if they're using absolute URLs
    if (Array.isArray(mappedProperty.documents) && mappedProperty.documents.length > 0) {
      mappedProperty.documents = mappedProperty.documents.map(doc => {
        if (doc.url && typeof doc.url === 'string' && (doc.url.startsWith('http://') || doc.url.startsWith('https://'))) {
          // Extract the path part of the URL (after the domain)
          const urlObj = new URL(doc.url);
          const relativePath = urlObj.pathname;
          return { ...doc, url: relativePath };
        }
        return doc;
      });
    }
    
    
    return mappedProperty;
  }

  // Helper function to map an array of database properties
  private mapDbPropertiesToAppProperties(properties: any[]): LandProperty[] {
    return properties.map(property => this.mapDbPropertyToAppProperty(property));
  }

  async getProperty(id: number): Promise<LandProperty | undefined> {
    const [property] = await db.select().from(landProperties).where(eq(landProperties.id, id));
    return this.mapDbPropertyToAppProperty(property);
  }

  async getAllProperties(): Promise<LandProperty[]> {
    const properties = await db.select().from(landProperties)
      .orderBy(desc(landProperties.createdAt));
    return this.mapDbPropertiesToAppProperties(properties);
  }

  async getFeaturedProperties(): Promise<LandProperty[]> {
    // Optimize query by limiting results and ordering by views for better performance
    const properties = await db
      .select()
      .from(landProperties)
      .where(sql`is_featured = true`)
      .orderBy(desc(landProperties.views))
      .limit(12); // Limit to 12 featured properties for faster loading
    
    return this.mapDbPropertiesToAppProperties(properties);
  }

  async getPropertiesByType(type: string): Promise<LandProperty[]> {
    // Add limit for better performance
    const properties = await db.select().from(landProperties)
      .where(eq(landProperties.propertyType, type))
      .orderBy(desc(landProperties.createdAt))
      .limit(30);
    return this.mapDbPropertiesToAppProperties(properties);
  }
  
  async getPropertiesByState(state: string): Promise<LandProperty[]> {
    // Convert to lowercase for case-insensitive comparison
    const lowerState = state.toLowerCase();
    
    // We need to search in the location field since that's where state information is stored
    // in the format "State, USA"
    const properties = await db.select().from(landProperties).where(
      sql`LOWER(${landProperties.location}) LIKE ${`%${lowerState}%`}`
    );
    
    return this.mapDbPropertiesToAppProperties(properties);
  }

  async searchProperties(query: string): Promise<LandProperty[]> {
    // Split query into terms
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    if (terms.length === 0) {
      return [];
    }
    
    // Get all properties first
    const allProperties = await db.select().from(landProperties);
    
    // Score each property based on matches, prioritizing state matches
    const scoredProperties = allProperties.map(property => {
      let score = 0;
      const location = (property.location || '').toLowerCase();
      const state = (property.state || '').toLowerCase();
      const title = (property.title || '').toLowerCase();
      const description = (property.description || '').toLowerCase();
      const propertyType = (property.propertyType || '').toLowerCase();
      
      for (const term of terms) {
        // Try to convert term to state abbreviation (e.g., "montana" -> "MT")
        // Capitalize first letter since getStateAbbreviation expects "Montana" not "montana"
        const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1);
        const stateAbbr = getStateAbbreviation(termCapitalized);
        
        // Exact state match (highest priority) - score 100
        if (state === term || (stateAbbr && state === stateAbbr.toLowerCase())) {
          score += 100;
        }
        // State contains term - score 80
        else if (state.includes(term) || (stateAbbr && state.includes(stateAbbr.toLowerCase()))) {
          score += 80;
        }
        // City/location match - score 50
        else if (location.includes(term)) {
          score += 50;
        }
        // Property type match - score 30
        else if (propertyType.includes(term)) {
          score += 30;
        }
        // Title match - score 20
        else if (title.includes(term)) {
          score += 20;
        }
        // Description match - score 10
        else if (description.includes(term)) {
          score += 10;
        }
      }
      
      return { property, score };
    });
    
    // Filter out properties with score 0 (no matches)
    const matchedProperties = scoredProperties
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)  // Sort by score descending
      .map(item => item.property);
    
    return this.mapDbPropertiesToAppProperties(matchedProperties);
  }
  
  async getPropertiesByOwner(ownerId: number): Promise<LandProperty[]> {
    const properties = await db.select().from(landProperties).where(eq(landProperties.ownerId, ownerId));
    return this.mapDbPropertiesToAppProperties(properties);
  }
  
  async getPropertiesByAgent(agentId: number): Promise<LandProperty[]> {
    const properties = await db.select().from(landProperties).where(eq(landProperties.listingAgentId, agentId));
    return this.mapDbPropertiesToAppProperties(properties);
  }
  
  async updateProperty(id: number, propertyData: Partial<InsertLandProperty>): Promise<LandProperty | undefined> {
    try {
      console.log(`⚙️ Starting property update for ID ${id}`);
      
      // Get the existing property data first for reference
      const [existingProperty] = await db.select().from(landProperties).where(eq(landProperties.id, id));
      
      if (!existingProperty) {
        console.error(`❌ Property ${id} not found for update`);
        return undefined;
      }
      
      let coordinates = null;
      
      // Process coordinates if provided
      if (propertyData.coordinates || propertyData.latitude || propertyData.longitude) {
        try {
          // First attempt: Use coordinates property if available
          if (propertyData.coordinates && typeof propertyData.coordinates === 'object' && 
              'x' in propertyData.coordinates && 'y' in propertyData.coordinates) {
            
            const x = parseFloat(String(propertyData.coordinates.x).trim());
            const y = parseFloat(String(propertyData.coordinates.y).trim());
            
            if (!isNaN(x) && !isNaN(y) && x >= -180 && x <= 180 && y >= -90 && y <= 90) {
              coordinates = { 
                x: parseFloat(x.toFixed(6)), 
                y: parseFloat(y.toFixed(6)) 
              };
              console.log(`Using coordinates from object:`, coordinates);
            }
          }
          // Second attempt: Try lat/lng properties
          else if (propertyData.latitude !== undefined && propertyData.longitude !== undefined) {
            let lat = null;
            let lng = null;
            
            if (typeof propertyData.latitude === 'string') {
              lat = parseFloat(propertyData.latitude.trim());
            } else if (typeof propertyData.latitude === 'number') {
              lat = propertyData.latitude;
            }
            
            if (typeof propertyData.longitude === 'string') {
              lng = parseFloat(propertyData.longitude.trim());
            } else if (typeof propertyData.longitude === 'number') {
              lng = propertyData.longitude;
            }
            
            if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng) &&
                lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
              coordinates = { 
                x: parseFloat(lng.toFixed(6)), 
                y: parseFloat(lat.toFixed(6)) 
              };
              console.log(`Using lat/lng properties:`, coordinates);
            }
          }
        } catch (error) {
          console.error(`Error processing coordinates:`, error);
        }
      }
      
      // If coordinates processing failed, use existing ones
      if (coordinates === null && existingProperty.coordinates) {
        coordinates = existingProperty.coordinates;
        console.log(`Keeping existing coordinates:`, coordinates);
      }
      
      // Prepare update data without coordinates (we'll handle them separately)
      const updateData = { ...propertyData };
      delete updateData.coordinates;
      
      // Update the property
      const [updatedProperty] = await db
        .update(landProperties)
        .set({
          ...updateData,
          updatedAt: new Date(),
          ...(coordinates ? { coordinates } : {})
        })
        .where(eq(landProperties.id, id))
        .returning();
      
      // Handle case where we have lat/lng but coordinates weren't set
      if (!updatedProperty.coordinates && 
          updatedProperty.latitude !== undefined && 
          updatedProperty.longitude !== undefined) {
        try {
          let longitude = 0;
          let latitude = 0;
          
          if (typeof updatedProperty.longitude === 'string') {
            longitude = parseFloat(updatedProperty.longitude);
          } else if (typeof updatedProperty.longitude === 'number') {
            longitude = updatedProperty.longitude;
          }
          
          if (typeof updatedProperty.latitude === 'string') {
            latitude = parseFloat(updatedProperty.latitude);
          } else if (typeof updatedProperty.latitude === 'number') {
            latitude = updatedProperty.latitude;
          }
          
          if (!isNaN(longitude) && !isNaN(latitude) &&
              longitude >= -180 && longitude <= 180 && 
              latitude >= -90 && latitude <= 90) {
            
            const lon = longitude.toFixed(6);
            const lat = latitude.toFixed(6);
            
            // Update coordinates directly using PostGIS
            await db.execute(
              sql`UPDATE land_properties SET coordinates = ST_SetSRID(ST_MakePoint(${lon}::float, ${lat}::float), 4326) WHERE id = ${updatedProperty.id}`
            );
            
            // Get the updated property
            const [finalProperty] = await db
              .select()
              .from(landProperties)
              .where(eq(landProperties.id, updatedProperty.id));
              
            return this.mapDbPropertyToAppProperty(finalProperty);
          }
        } catch (error) {
          console.error('Error updating coordinates after initial update:', error);
        }
      }
      
      // Apply the same videoUrl mapping for all property updates
      return this.mapDbPropertyToAppProperty(updatedProperty);
    } catch (error) {
      console.error('Error updating property:', error);
      return undefined;
    }
  }
  
  async incrementPropertyViews(id: number): Promise<boolean> {
    try {
      await db.execute(sql`
        UPDATE land_properties 
        SET views = views + 1 
        WHERE id = ${id}
      `);
      return true;
    } catch (error) {
      console.error('Error incrementing property views:', error);
      return false;
    }
  }

  async createProperty(insertProperty: InsertLandProperty): Promise<LandProperty> {
    try {
      // Ensure coordinates field uses PostGIS point type if not already set
      let coordinates = null; // Set initially to null
        
      try {
        // Handle longitude/latitude fields - parse them to numbers
        let longitude = null;
        let latitude = null;
        
        // First try to get coordinates from any coordinates property (if it exists)
        if (insertProperty.coordinates) {
          console.log('Extracting from coordinates property:', insertProperty.coordinates);
          
          // Handle array format [longitude, latitude] (MapBox format)
          if (Array.isArray(insertProperty.coordinates)) {
            if (insertProperty.coordinates.length >= 2) {
              longitude = parseFloat(insertProperty.coordinates[0]);
              latitude = parseFloat(insertProperty.coordinates[1]);
              console.log('Using coordinates from array:', longitude, latitude);
            }
          } 
          // Handle string format (possible PostGIS POINT)
          else if (typeof insertProperty.coordinates === 'string') {
            if (insertProperty.coordinates.includes('POINT(')) {
              const coordPart = insertProperty.coordinates.split('POINT(')[1].split(')')[0].trim();
              const coordArray = coordPart.split(' ');
              if (coordArray.length >= 2) {
                longitude = parseFloat(coordArray[0]);
                latitude = parseFloat(coordArray[1]);
                console.log('Using coordinates from POINT string:', longitude, latitude);
              }
            }
          }
          // Handle object format with lat/lng or latitude/longitude properties
          else if (typeof insertProperty.coordinates === 'object') {
            if ('longitude' in insertProperty.coordinates && 'latitude' in insertProperty.coordinates) {
              longitude = parseFloat(insertProperty.coordinates.longitude);
              latitude = parseFloat(insertProperty.coordinates.latitude);
              console.log('Using coordinates from object with longitude/latitude:', longitude, latitude);
            } else if ('lng' in insertProperty.coordinates && 'lat' in insertProperty.coordinates) {
              longitude = parseFloat(insertProperty.coordinates.lng);
              latitude = parseFloat(insertProperty.coordinates.lat);
              console.log('Using coordinates from object with lng/lat:', longitude, latitude);
            } else if ('x' in insertProperty.coordinates && 'y' in insertProperty.coordinates) {
              // PostGIS format sometimes uses x/y
              longitude = parseFloat(insertProperty.coordinates.x);
              latitude = parseFloat(insertProperty.coordinates.y);
              console.log('Using coordinates from object with x/y:', longitude, latitude);
            }
          }
        }
        
        // If coordinates property didn't have valid data, fall back to longitude/latitude fields
        if (isNaN(longitude) || isNaN(latitude)) {
          console.log('Falling back to direct longitude/latitude properties');
          
          if (insertProperty.longitude) {
            // Ensure longitude is a valid number
            longitude = typeof insertProperty.longitude === 'string' 
              ? parseFloat(insertProperty.longitude) 
              : insertProperty.longitude;
              
            // Skip if NaN
            if (isNaN(longitude)) longitude = null;
          }
          
          if (insertProperty.latitude) {
            // Ensure latitude is a valid number
            latitude = typeof insertProperty.latitude === 'string' 
              ? parseFloat(insertProperty.latitude) 
              : insertProperty.latitude;
              
            // Skip if NaN
            if (isNaN(latitude)) latitude = null;
          }
        }
        
        // Only create a point if both longitude and latitude are valid numbers
        if (longitude !== null && latitude !== null && !isNaN(longitude) && !isNaN(latitude)) {
          // Validate coordinate values are within valid ranges
          if (longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90) {
            console.log(`Creating PostGIS point with: longitude=${longitude}, latitude=${latitude}`);
            
            try {
              // Create a PostGIS point using SQL to ensure proper format
              // Convert numbers to strings first for safer SQL handling
              const lon = String(longitude);
              const lat = String(latitude);
              
              const point = await db.execute<{ point: any }>(
                sql`SELECT ST_SetSRID(ST_MakePoint(${lon}::float, ${lat}::float), 4326) as point`
              );
              
              if (Array.isArray(point) && point.length > 0 && point[0].point) {
                coordinates = point[0].point;
                console.log('Successfully created PostGIS point');
              } else {
                console.log('Failed to create PostGIS point, result was empty');
              }
            } catch (err) {
              console.error('Error creating PostGIS point:', err);
            }
          } else {
            console.warn(`Invalid coordinate values: longitude=${longitude}, latitude=${latitude}`);
          }
        }
      } catch (error) {
        console.error('Error creating PostGIS point:', error);
        // Coordinates will remain null in case of error
      }
      
      // Extract video URL from camelCase field only
      let finalVideoUrl = null;
      if (insertProperty.videoUrl !== undefined && insertProperty.videoUrl !== null) {
        finalVideoUrl = insertProperty.videoUrl;
      } else if ((insertProperty as any).video_url !== undefined && (insertProperty as any).video_url !== null) {
        // Fallback to snake_case if present
        finalVideoUrl = (insertProperty as any).video_url;
      }
      
      // The database column name is 'video_url' in snake_case
      // We'll add this field directly in the final property object
      // Create a clean copy without any video URL fields to avoid duplicates
      const { videoUrl, video_url, ...cleanedProperty } = { 
        ...insertProperty, 
        // Explicitly remove video_url from any type to ensure it's not present
        video_url: undefined 
      };
      
      // Ensure all fields match the schema, including PostGIS data
      const propertyData = {
        title: cleanedProperty.title,
        description: cleanedProperty.description,
        // Handle numeric values properly
        price: cleanedProperty.price === '' ? 0 : cleanedProperty.price,
        acreage: cleanedProperty.acreage === '' ? 0 : cleanedProperty.acreage,
        location: cleanedProperty.location,
        state: cleanedProperty.state, // Include the state field
        latitude: cleanedProperty.latitude === '' ? null : cleanedProperty.latitude,
        longitude: cleanedProperty.longitude === '' ? null : cleanedProperty.longitude,
        // Handle PostGIS data
        coordinates: coordinates,
        boundary: cleanedProperty.boundary,
        propertyType: cleanedProperty.propertyType,
        zoning: cleanedProperty.zoning ?? null,
        terrainType: cleanedProperty.terrainType ?? null,
        vegetation: cleanedProperty.vegetation ?? null,
        waterResources: cleanedProperty.waterResources ?? null,
        roadAccess: cleanedProperty.roadAccess ?? null,
        utilities: cleanedProperty.utilities ?? [],
        amenities: cleanedProperty.amenities ?? [],
        images: cleanedProperty.images ?? [],
        // Always include the column name that exists in the database (snake_case)
        // Use empty string instead of null to avoid database issues
        video_url: finalVideoUrl || '',
        // videoUrl is NOT included here to avoid duplicate column error
        isWaterfront: cleanedProperty.isWaterfront ?? false,
        isMountainView: cleanedProperty.isMountainView ?? false,
        featured: cleanedProperty.featured ?? false,
        ownerId: cleanedProperty.ownerId ?? null
      };
      
      // Insert property with PostGIS data
      const [property] = await db.insert(landProperties).values(propertyData as any).returning();
      
      // If coordinates weren't set but we have lat/long, update the coordinates field
      if (!property.coordinates && property.latitude !== undefined && property.longitude !== undefined) {
        try {
          console.log(`Updating property ${property.id} with coordinates: [${property.longitude}, ${property.latitude}]`);
          
          // Parse and validate coordinates properly
          let longitude = 0;
          let latitude = 0;
          
          // Handle longitude - ensure it's a valid number
          if (typeof property.longitude === 'string') {
            longitude = parseFloat(property.longitude.trim());
          } else if (typeof property.longitude === 'number') {
            longitude = property.longitude;
          }
          
          // Handle latitude - ensure it's a valid number
          if (typeof property.latitude === 'string') {
            latitude = parseFloat(property.latitude.trim());
          } else if (typeof property.latitude === 'number') {
            latitude = property.latitude;
          }
          
          // Validate the values before using them
          if (!isNaN(longitude) && !isNaN(latitude) && 
              longitude >= -180 && longitude <= 180 && 
              latitude >= -90 && latitude <= 90) {
              
            // We can directly use PostGIS functions to update the coordinates field
            // Convert to strings for safer SQL handling with fixed precision
            const lon = longitude.toFixed(6);
            const lat = latitude.toFixed(6);
            
            await db.execute(
              sql`UPDATE land_properties SET coordinates = ST_SetSRID(ST_MakePoint(${lon}::float, ${lat}::float), 4326) WHERE id = ${property.id}`
            );
            
            // Fetch the updated property
            const [updatedProperty] = await db.select().from(landProperties).where(eq(landProperties.id, property.id));
            return this.mapDbPropertyToAppProperty(updatedProperty);
          } else {
            console.warn(`Invalid coordinate values for property ${property.id}: longitude=${longitude}, latitude=${latitude}`);
          }
        } catch (error) {
          console.error('Error updating property coordinates:', error);
        }
      }
      
      return this.mapDbPropertyToAppProperty(property);
    } catch (error) {
      console.error('Error creating property with PostGIS data:', error);
      
      // If the error is related to PostGIS, try a simpler insert without the spatial data
      try {
        console.log('Attempting simplified property creation without PostGIS data');
        
        // Get the video URL from either format - use same logic as primary case
        let fallbackVideoUrl = null;
        if (insertProperty.videoUrl !== undefined && insertProperty.videoUrl !== null) {
          fallbackVideoUrl = insertProperty.videoUrl;
        } else if ((insertProperty as any).video_url !== undefined && (insertProperty as any).video_url !== null) {
          // Fallback to snake_case if present
          fallbackVideoUrl = (insertProperty as any).video_url;
        }
        
        // Create a cleaned version without any video URL fields
        const { videoUrl, video_url, ...cleanedProperty } = { 
          ...insertProperty, 
          // Explicitly remove video_url from any type to ensure it's not present
          video_url: undefined 
        };
        
        // Simplified property data without PostGIS fields
        const propertyData = {
          title: cleanedProperty.title,
          description: cleanedProperty.description,
          // Handle numeric values properly (fallback code)
          price: cleanedProperty.price === '' ? 0 : cleanedProperty.price,
          acreage: cleanedProperty.acreage === '' ? 0 : cleanedProperty.acreage,
          location: cleanedProperty.location,
          state: cleanedProperty.state, // Include the state field here too
          latitude: cleanedProperty.latitude === '' ? null : cleanedProperty.latitude,
          longitude: cleanedProperty.longitude === '' ? null : cleanedProperty.longitude,
          propertyType: cleanedProperty.propertyType,
          zoning: cleanedProperty.zoning ?? null,
          terrainType: cleanedProperty.terrainType ?? null,
          vegetation: cleanedProperty.vegetation ?? null,
          waterResources: cleanedProperty.waterResources ?? null,
          roadAccess: cleanedProperty.roadAccess ?? null,
          utilities: cleanedProperty.utilities ?? [],
          amenities: cleanedProperty.amenities ?? [],
          images: cleanedProperty.images ?? [],
          // Always include the column name that exists in the database (snake_case)
          // Use empty string instead of null to avoid database issues
          video_url: fallbackVideoUrl || '',
          isWaterfront: cleanedProperty.isWaterfront ?? false,
          isMountainView: cleanedProperty.isMountainView ?? false,
          featured: cleanedProperty.featured ?? false,
          ownerId: cleanedProperty.ownerId ?? null
        };
        
        const [property] = await db.insert(landProperties).values(propertyData as any).returning();
        return this.mapDbPropertyToAppProperty(property);
      } catch (fallbackError) {
        console.error('Even simplified property creation failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  }

  // Favorites methods
  async getFavorite(userId: number, propertyId: number): Promise<Favorite | undefined> {
    const [favorite] = await db.select().from(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.propertyId, propertyId)
      )
    );
    return favorite;
  }

  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values(insertFavorite).returning();
    return favorite;
  }

  async removeFavorite(id: number): Promise<boolean> {
    const result = await db.delete(favorites).where(eq(favorites.id, id)).returning();
    return result.length > 0;
  }
  
  // Visual Pin methods
  async getVisualPinsByFavorite(favoriteId: number): Promise<VisualPin[]> {
    try {
      const pins = await db
        .select()
        .from(visualPins)
        .where(eq(visualPins.favoriteId, favoriteId));
      return pins;
    } catch (error) {
      console.error("Error getting visual pins by favorite:", error);
      return [];
    }
  }
  
  async createVisualPin(pin: InsertVisualPin): Promise<VisualPin> {
    try {
      const [newPin] = await db
        .insert(visualPins)
        .values(pin)
        .returning();
      return newPin;
    } catch (error) {
      console.error("Error creating visual pin:", error);
      throw error;
    }
  }
  
  async updateVisualPin(id: number, pinData: Partial<InsertVisualPin>): Promise<VisualPin | undefined> {
    try {
      const [updatedPin] = await db
        .update(visualPins)
        .set({
          ...pinData,
          updatedAt: new Date()
        })
        .where(eq(visualPins.id, id))
        .returning();
      return updatedPin;
    } catch (error) {
      console.error("Error updating visual pin:", error);
      return undefined;
    }
  }
  
  async removeVisualPin(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(visualPins)
        .where(eq(visualPins.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error removing visual pin:", error);
      return false;
    }
  }
  
  // Geospatial methods using PostGIS
  async getPropertiesWithinRadius(longitude: number, latitude: number, radiusMiles: number): Promise<LandProperty[]> {
    try {
      // Validate coordinates and radius
      if (isNaN(longitude) || isNaN(latitude) || isNaN(radiusMiles) || 
          !isFinite(longitude) || !isFinite(latitude) || !isFinite(radiusMiles)) {
        console.error(`Invalid coordinates or radius: [${longitude}, ${latitude}], ${radiusMiles}`);
        return [];
      }
      
      // Normalize and validate inputs
      const validLongitude = Math.max(-180, Math.min(180, longitude));
      const validLatitude = Math.max(-90, Math.min(90, latitude));
      const validRadiusMiles = Math.max(0.1, Math.min(500, radiusMiles)); // Set reasonable limits
      
      console.log(`Spatial query - finding properties within ${validRadiusMiles} miles of [${validLongitude}, ${validLatitude}]`);
      
      // First attempt: Use the optimized stored function for better performance
      try {
        const result = await db.execute<LandProperty>(
          sql`SELECT * FROM get_properties_within_distance(${validLongitude}, ${validLatitude}, ${validRadiusMiles})`
        );
        
        if (Array.isArray(result) && result.length > 0) {
          console.log(`Found ${result.length} properties using optimized function`);
          return this.mapDbPropertiesToAppProperties(result);
        }
      } catch (functionError: any) {
        console.warn('PostGIS function error, falling back to direct SQL:', functionError?.message || 'Unknown error');
      }
      
      // Second attempt: Direct PostGIS query
      try {
        // Convert miles to meters for ST_DWithin (which expects meters)
        const distanceMeters = validRadiusMiles * 1609.34;
        
        const result = await db.select().from(landProperties).where(
          sql`ST_DWithin(
            coordinates::geometry, 
            ST_SetSRID(ST_MakePoint(${validLongitude}, ${validLatitude}), 4326),
            ${distanceMeters}
          )`
        );
        
        if (result.length > 0) {
          console.log(`Found ${result.length} properties using direct PostGIS query`);
          return this.mapDbPropertiesToAppProperties(result);
        }
      } catch (postgisError: any) {
        console.warn('Direct PostGIS query failed, falling back to manual calculation:', postgisError?.message || 'Unknown error');
      }
      
      // Final fallback: Calculate distance manually using all properties
      console.log('Using manual Haversine distance calculation as fallback');
      const properties = await this.getAllProperties();
      
      // Calculate distances manually using Haversine formula 
      const distanceProperties = properties.map(property => {
        try {
          const propLat = typeof property.latitude === 'string' 
            ? parseFloat(property.latitude) 
            : property.latitude;
            
          const propLon = typeof property.longitude === 'string' 
            ? parseFloat(property.longitude) 
            : property.longitude;
          
          // Skip invalid coordinates
          if (isNaN(propLat) || isNaN(propLon) || !isFinite(propLat) || !isFinite(propLon)) {
            return { property, distance: Infinity };
          }
          
          // Haversine formula for distance
          const R = 3958.8; // Earth radius in miles
          const dLat = (propLat - validLatitude) * Math.PI / 180;
          const dLon = (propLon - validLongitude) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(validLatitude * Math.PI / 180) * Math.cos(propLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in miles
          
          return { property, distance };
        } catch (err) {
          console.error('Error calculating distance for property:', property.id, err);
          return { property, distance: Infinity };
        }
      });
      
      // Add distance property to each result and include only valid distances
      const result = distanceProperties
        .filter(item => item.distance <= validRadiusMiles)
        .sort((a, b) => a.distance - b.distance)
        .map(item => {
          // Add distance property to the result
          return { 
            ...item.property, 
            distance: parseFloat(item.distance.toFixed(1)) // Round to 1 decimal place
          };
        });
      
      console.log(`Found ${result.length} properties using manual calculation`);
      return result;
    } catch (error) {
      console.error('Unhandled error in getPropertiesWithinRadius:', error);
      return [];
    }
  }
  
  async getPropertiesByBoundingBox(minLong: number, minLat: number, maxLong: number, maxLat: number): Promise<LandProperty[]> {
    try {
      // Use the optimized stored function for better performance
      const result = await db.execute<LandProperty>(
        sql`SELECT * FROM get_properties_in_bbox(${minLong}, ${minLat}, ${maxLong}, ${maxLat})`
      );
      
      if (Array.isArray(result)) {
        return this.mapDbPropertiesToAppProperties(result);
      }
      
      // Fallback to direct SQL query if the function call fails
      const properties = await db.select().from(landProperties).where(
        sql`ST_Within(
          coordinates::geometry, 
          ST_MakeEnvelope(${minLong}, ${minLat}, ${maxLong}, ${maxLat}, 4326)
        )`
      );
      return this.mapDbPropertiesToAppProperties(properties);
    } catch (error) {
      console.error('Error in getPropertiesByBoundingBox:', error);
      
      // Fallback to manual filtering if PostGIS query fails
      const properties = await this.getAllProperties();
      
      return properties.filter(property => {
        const propLat = parseFloat(property.latitude.toString());
        const propLon = parseFloat(property.longitude.toString());
        
        return (
          propLon >= minLong && 
          propLon <= maxLong && 
          propLat >= minLat && 
          propLat <= maxLat
        );
      });
    }
  }
  
  // Saved searches methods
  async getSavedSearch(id: number): Promise<SavedSearch | undefined> {
    const [savedSearch] = await db.select()
      .from(savedSearches)
      .where(eq(savedSearches.id, id));
    
    return savedSearch;
  }
  
  async getSavedSearchesByUser(userId: number): Promise<SavedSearch[]> {
    const userSavedSearches = await db.select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));
    
    return userSavedSearches;
  }
  
  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    const [savedSearch] = await db
      .insert(savedSearches)
      .values(search)
      .returning();
    
    return savedSearch;
  }
  
  async updateSavedSearch(id: number, searchData: Partial<InsertSavedSearch>): Promise<SavedSearch | undefined> {
    const [updatedSearch] = await db
      .update(savedSearches)
      .set(searchData)
      .where(eq(savedSearches.id, id))
      .returning();
    
    return updatedSearch;
  }
  
  async removeSavedSearch(id: number): Promise<boolean> {
    const result = await db
      .delete(savedSearches)
      .where(eq(savedSearches.id, id));
    
    return result.rowCount > 0;
  }
  
  // Additional geospatial method to calculate property area using PostGIS
  async getPropertyArea(propertyId: number): Promise<number | null> {
    try {
      // Get the property
      const property = await this.getProperty(propertyId);
      if (!property || !property.boundary) {
        return null;
      }
      
      // Calculate area using PostGIS
      const [result] = await db.execute<{ area: number }>(
        sql`SELECT ST_Area(${property.boundary}::geography) * 0.000247105 AS area`
      );
      
      return result?.area || null;
    } catch (error) {
      console.error('Error calculating property area:', error);
      return null;
    }
  }
  
  // Find properties with specific geospatial features (e.g., water bodies, mountains)
  async getPropertiesByFeature(feature: string): Promise<LandProperty[]> {
    try {
      // Examples of features: 'water', 'mountain', etc.
      // This would require additional tables/data with natural features 
      // For now, we'll just check waterfront or mountain view flags
      switch (feature.toLowerCase()) {
        case 'water':
        case 'waterfront':
        case 'lake':
        case 'river':
          const properties = await db.select().from(landProperties).where(eq(landProperties.isWaterfront, true));
          return this.mapDbPropertiesToAppProperties(properties);
          
        case 'mountain':
        case 'mountains':
        case 'mountain view':
          const mountainProperties = await db.select().from(landProperties).where(eq(landProperties.isMountainView, true));
          return this.mapDbPropertiesToAppProperties(mountainProperties);
          
        default:
          // If feature is not recognized, fall back to text search
          return await this.searchProperties(feature);
      }
    } catch (error) {
      console.error('Error in getPropertiesByFeature:', error);
      return [];
    }
  }

  // Inquiry methods
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async getInquiriesByProperty(propertyId: number): Promise<Inquiry[]> {
    return await db.select().from(inquiries).where(eq(inquiries.propertyId, propertyId));
  }

  async getInquiriesByUser(userId: number, isSender: boolean): Promise<Inquiry[]> {
    if (isSender) {
      // Get inquiries where user is the sender
      return await db.select().from(inquiries).where(eq(inquiries.fromUserId, userId));
    } else {
      // Get inquiries where user is the recipient
      return await db.select().from(inquiries).where(eq(inquiries.toUserId, userId));
    }
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values(insertInquiry).returning();
    return inquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<boolean> {
    try {
      await db.update(inquiries)
        .set({ status })
        .where(eq(inquiries.id, id));
      return true;
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      return false;
    }
  }
  
  // Verification methods
  async createVerificationAttempt(attempt: InsertVerificationAttempt): Promise<VerificationAttempt> {
    try {
      const [result] = await db.insert(verificationAttempts).values(attempt).returning();
      return result;
    } catch (error) {
      console.error('Error creating verification attempt:', error);
      throw error;
    }
  }
  
  async getLatestVerificationAttempt(userId: number, method: string): Promise<VerificationAttempt | undefined> {
    try {
      const [attempt] = await db
        .select()
        .from(verificationAttempts)
        .where(
          and(
            eq(verificationAttempts.userId, userId),
            eq(verificationAttempts.method, method as any)
          )
        )
        .orderBy(desc(verificationAttempts.createdAt))
        .limit(1);
      
      return attempt;
    } catch (error) {
      console.error('Error fetching latest verification attempt:', error);
      return undefined;
    }
  }
  
  async markVerificationSuccessful(id: number): Promise<boolean> {
    try {
      const now = new Date();
      const result = await db
        .update(verificationAttempts)
        .set({ 
          isVerified: true,
          verifiedAt: now
        })
        .where(eq(verificationAttempts.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error marking verification as successful:', error);
      return false;
    }
  }
  
  async updateUserLastLogin(id: number): Promise<boolean> {
    try {
      const now = new Date();
      const result = await db
        .update(users)
        .set({ lastLogin: now })
        .where(eq(users.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error('Error updating user last login:', error);
      return false;
    }
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    try {
      // If role is "*", return all users
      if (role === '*') {
        return await db.select().from(users);
      }
      
      // For 'agent' role, check both role field and isAgent flag
      if (role === 'agent') {
        return await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.role, 'agent'),
              eq(users.isAgent, true)
            )
          );
      } 
      
      // For 'buyer' role, include users with that role or null role and not agent
      else if (role === 'buyer') {
        return await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.role, 'buyer'),
              and(
                or(
                  eq(users.role, null),
                  eq(users.role, '')
                ),
                eq(users.isAgent, false)
              )
            )
          );
      }
      
      // For all other roles, just check the role field
      return await db
        .select()
        .from(users)
        .where(eq(users.role, role as any));
        
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  // Helper to initialize the database with sample data
  async initializeDatabase() {
    // Check if we already have properties
    const existingProperties = await this.getAllProperties();
    
    if (existingProperties.length === 0) {
      // Import the demo data generator using dynamic import
      const demoDataModule = await import('./demoData');
      const { generateDemoProperties } = demoDataModule;
      
      // Generate properties for all states (5 per state)
      const demoProperties = generateDemoProperties();
      
      // Insert each property
      let count = 0;
      for (const property of demoProperties) {
        await this.createProperty(property);
        count++;
      }
      
      console.log(`Initialized ${count} demo properties across all US states`);
    }
  }

  // Teams methods
  async getTeamStats(): Promise<{
    totalAgents: number;
    totalBrokerages: number;
    avgExperience: number;
    avgRating: number;
    totalSales: number;
  }> {
    try {
      const [stats] = await db.select({
        totalAgents: sql<number>`count(*)::int`,
        totalBrokerages: sql<number>`count(distinct brokerage)::int`,
        avgExperience: sql<number>`avg(years_experience)::float`,
        avgRating: sql<number>`avg(average_rating)::float`,
        totalSales: sql<number>`sum(total_transactions)::int`
      }).from(agentProfiles);
      
      return {
        totalAgents: stats.totalAgents,
        totalBrokerages: stats.totalBrokerages,
        avgExperience: stats.avgExperience,
        avgRating: stats.avgRating,
        totalSales: stats.totalSales
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return {
        totalAgents: 0,
        totalBrokerages: 0,
        avgExperience: 0,
        avgRating: 0,
        totalSales: 0
      };
    }
  }

  async getSpecialtiesWithCounts(): Promise<Array<{
    main_specialty: string;
    agent_count: number;
  }>> {
    try {
      const results = await db.select({
        main_specialty: sql<string>`specialty_areas->>0`,
        agent_count: sql<number>`count(*)::int`
      })
      .from(agentProfiles)
      .where(sql`specialty_areas IS NOT NULL`)
      .groupBy(sql`specialty_areas->>0`)
      .orderBy(sql`count(*) DESC`)
      .limit(10);
      
      return results;
    } catch (error) {
      console.error('Error fetching specialties with counts:', error);
      return [];
    }
  }
  
  // Land tract methods
  async getTractsByProperty(propertyId: number): Promise<LandTract[]> {
    try {
      const tracts = await db.select().from(landTracts)
        .where(and(eq(landTracts.propertyId, propertyId), eq(landTracts.isActive, true)))
        .orderBy(asc(landTracts.createdAt));
      return tracts;
    } catch (error) {
      console.error(`Error fetching tracts for property ${propertyId}:`, error);
      return [];
    }
  }
  
  async getTract(id: number): Promise<LandTract | undefined> {
    try {
      const [tract] = await db.select().from(landTracts).where(eq(landTracts.id, id));
      return tract;
    } catch (error) {
      console.error(`Error fetching tract ${id}:`, error);
      return undefined;
    }
  }
  
  async createTract(tract: InsertLandTract): Promise<LandTract> {
    try {
      const [newTract] = await db.insert(landTracts).values(tract).returning();
      return newTract;
    } catch (error) {
      console.error('Error creating tract:', error);
      throw error;
    }
  }
  
  async updateTract(id: number, tractData: Partial<InsertLandTract>): Promise<LandTract | undefined> {
    try {
      const [updatedTract] = await db.update(landTracts)
        .set({ ...tractData, updatedAt: new Date() })
        .where(eq(landTracts.id, id))
        .returning();
      return updatedTract;
    } catch (error) {
      console.error(`Error updating tract ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteTract(id: number): Promise<boolean> {
    try {
      await db.update(landTracts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(landTracts.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting tract ${id}:`, error);
      return false;
    }
  }
  
  async getChildTracts(parentTractId: number): Promise<LandTract[]> {
    try {
      const tracts = await db.select().from(landTracts)
        .where(and(eq(landTracts.parentTractId, parentTractId), eq(landTracts.isActive, true)))
        .orderBy(asc(landTracts.createdAt));
      return tracts;
    } catch (error) {
      console.error(`Error fetching child tracts for parent ${parentTractId}:`, error);
      return [];
    }
  }
}

// In-memory storage implementation (kept for reference or fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, LandProperty>;
  private favorites: Map<number, Favorite>;
  private visualPins: Map<number, VisualPin>;
  private savedSearches: Map<number, SavedSearch>;
  private agentProfiles: Map<number, AgentProfile>;
  private agentCertifications: Map<number, AgentCertification>;
  private agentReviews: Map<number, AgentReview>;
  private agentTransactions: Map<number, AgentTransaction>;
  private agentQuestions: Map<number, AgentQuestion>;
  private agentAnswers: Map<number, AgentAnswer>;
  private dealRooms: Map<number, DealRoom>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentFavoriteId: number;
  private currentPinId: number;
  private currentSavedSearchId: number;
  private currentAgentProfileId: number;
  private currentAgentCertificationId: number;
  private currentAgentReviewId: number;
  private currentAgentTransactionId: number;
  private currentAgentQuestionId: number;
  private currentAgentAnswerId: number;
  private currentDealRoomId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.favorites = new Map();
    this.visualPins = new Map();
    this.savedSearches = new Map();
    this.agentProfiles = new Map();
    this.agentCertifications = new Map();
    this.agentReviews = new Map();
    this.agentTransactions = new Map();
    this.agentQuestions = new Map();
    this.agentAnswers = new Map();
    this.dealRooms = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentFavoriteId = 1;
    this.currentPinId = 1;
    this.currentSavedSearchId = 1;
    this.currentAgentProfileId = 1;
    this.currentAgentCertificationId = 1;
    this.currentAgentReviewId = 1;
    this.currentAgentTransactionId = 1;
    this.currentAgentQuestionId = 1;
    this.currentAgentAnswerId = 1;
    this.currentDealRoomId = 1;
    
    // Initialize with some sample properties (async)
    this.initializePropertiesAsync();
  }
  
  // Helper to initialize properties asynchronously
  private async initializePropertiesAsync() {
    try {
      await this.initializeProperties();
    } catch (error) {
      console.error('Error initializing properties:', error);
    }
  }

  private async initializeProperties() {
    // Import the demo data generator using dynamic import
    const demoDataModule = await import('./demoData');
    const { generateDemoProperties } = demoDataModule;
    
    // Generate properties for all states (5 per state)
    const demoProperties = generateDemoProperties();
    
    // Add the generated properties to the map
    for (const property of demoProperties) {
      await this.createProperty(property);
    }
    
    // Log the number of properties loaded
    console.log(`Initialized ${this.properties.size} demo properties across all US states`);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Make sure all fields match the User type with proper null handling
    const user: User = { 
      ...insertUser,
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      isAgent: insertUser.isAgent || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Land property methods
  async getProperty(id: number): Promise<LandProperty | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<LandProperty[]> {
    return Array.from(this.properties.values());
  }

  async getFeaturedProperties(): Promise<LandProperty[]> {
    return Array.from(this.properties.values()).filter(
      (property) => property.featured
    );
  }

  async getPropertiesByType(type: string): Promise<LandProperty[]> {
    return Array.from(this.properties.values()).filter(
      (property) => property.propertyType === type
    );
  }
  
  async getPropertiesByState(state: string): Promise<LandProperty[]> {
    const lowerState = state.toLowerCase();
    return Array.from(this.properties.values()).filter(
      (property) => property.location?.toLowerCase().includes(lowerState)
    );
  }

  async searchProperties(query: string): Promise<LandProperty[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.properties.values()).filter(
      (property) => 
        property.title.toLowerCase().includes(lowerQuery) ||
        property.description.toLowerCase().includes(lowerQuery) ||
        property.location.toLowerCase().includes(lowerQuery) ||
        property.propertyType?.toLowerCase().includes(lowerQuery) ||
        property.terrainType?.toLowerCase().includes(lowerQuery) ||
        property.vegetation?.toLowerCase().includes(lowerQuery) ||
        (property.amenities as string[])?.some(amenity => 
          amenity.toLowerCase().includes(lowerQuery)
        )
    );
  }

  async createProperty(insertProperty: InsertLandProperty): Promise<LandProperty> {
    const id = this.currentPropertyId++;
    
    // Make sure all fields match the LandProperty type with proper null handling
    const property: LandProperty = { 
      ...insertProperty,
      id,
      // Ensure proper null handling for optional fields
      coordinates: insertProperty.coordinates || null,
      boundary: insertProperty.boundary || null,
      zoning: insertProperty.zoning || null,
      terrainType: insertProperty.terrainType || null,
      vegetation: insertProperty.vegetation || null,
      waterResources: insertProperty.waterResources || null,
      roadAccess: insertProperty.roadAccess || null,
      utilities: (insertProperty.utilities || []) as string[],
      amenities: (insertProperty.amenities || []) as string[],
      images: (insertProperty.images || []) as string[],
      isWaterfront: insertProperty.isWaterfront ?? false,
      isMountainView: insertProperty.isMountainView ?? false,
      featured: insertProperty.featured ?? false,
      ownerId: insertProperty.ownerId || null,
      createdAt: new Date()
    };
    
    this.properties.set(id, property);
    return property;
  }

  // Favorites methods
  async getFavorite(userId: number, propertyId: number): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(
      (favorite) => favorite.userId === userId && favorite.propertyId === propertyId
    );
  }

  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(
      (favorite) => favorite.userId === userId
    );
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const favorite: Favorite = { ...insertFavorite, id, createdAt: new Date() };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFavorite(id: number): Promise<boolean> {
    return this.favorites.delete(id);
  }
  
  // Visual Pin methods
  async getVisualPinsByFavorite(favoriteId: number): Promise<VisualPin[]> {
    return Array.from(this.visualPins.values()).filter(
      (pin) => pin.favoriteId === favoriteId
    );
  }
  
  async createVisualPin(insertPin: InsertVisualPin): Promise<VisualPin> {
    const id = this.currentPinId++;
    const pin: VisualPin = { 
      ...insertPin, 
      id, 
      createdAt: new Date() 
    };
    this.visualPins.set(id, pin);
    return pin;
  }
  
  async updateVisualPin(id: number, pinData: Partial<InsertVisualPin>): Promise<VisualPin | undefined> {
    const pin = this.visualPins.get(id);
    if (!pin) {
      return undefined;
    }
    
    const updatedPin = {
      ...pin,
      ...pinData,
      updatedAt: new Date()
    };
    
    this.visualPins.set(id, updatedPin);
    return updatedPin;
  }
  
  async removeVisualPin(id: number): Promise<boolean> {
    return this.visualPins.delete(id);
  }
  
  // Saved searches methods
  async getSavedSearch(id: number): Promise<SavedSearch | undefined> {
    return this.savedSearches.get(id);
  }
  
  async getSavedSearchesByUser(userId: number): Promise<SavedSearch[]> {
    return Array.from(this.savedSearches.values())
      .filter(search => search.userId === userId)
      .sort((a, b) => {
        // Sort by creation date (most recent first)
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }
  
  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    const id = this.currentSavedSearchId++;
    const savedSearch: SavedSearch = {
      ...search,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.savedSearches.set(id, savedSearch);
    return savedSearch;
  }
  
  async updateSavedSearch(id: number, searchData: Partial<InsertSavedSearch>): Promise<SavedSearch | undefined> {
    const search = this.savedSearches.get(id);
    if (!search) {
      return undefined;
    }
    
    const updatedSearch = {
      ...search,
      ...searchData,
      updatedAt: new Date()
    };
    
    this.savedSearches.set(id, updatedSearch);
    return updatedSearch;
  }
  
  async removeSavedSearch(id: number): Promise<boolean> {
    return this.savedSearches.delete(id);
  }
  
  // Basic geospatial methods for in-memory storage (non-PostGIS implementation)
  async getPropertiesWithinRadius(longitude: number, latitude: number, radiusMiles: number): Promise<LandProperty[]> {
    // Simple distance calculation using Haversine formula
    function haversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
      const R = 3958.8; // Earth radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in miles
    }
    
    return Array.from(this.properties.values()).filter(property => {
      const propLat = parseFloat(property.latitude.toString());
      const propLon = parseFloat(property.longitude.toString());
      
      const distance = haversineDistance(longitude, latitude, propLon, propLat);
      return distance <= radiusMiles;
    });
  }
  
  async getPropertiesByBoundingBox(minLong: number, minLat: number, maxLong: number, maxLat: number): Promise<LandProperty[]> {
    return Array.from(this.properties.values()).filter(property => {
      const propLat = parseFloat(property.latitude.toString());
      const propLon = parseFloat(property.longitude.toString());
      
      return (
        propLon >= minLong && 
        propLon <= maxLong && 
        propLat >= minLat && 
        propLat <= maxLat
      );
    });
  }
  
  // Simple implementations of the new geospatial methods for the MemStorage class
  async getPropertyArea(propertyId: number): Promise<number | null> {
    // In MemStorage, we don't have actual polygons to calculate area
    // So we'll use the acreage field as the area
    const property = await this.getProperty(propertyId);
    if (!property) {
      return null;
    }
    
    return parseFloat(property.acreage.toString());
  }
  
  async getPropertiesByFeature(feature: string): Promise<LandProperty[]> {
    // In MemStorage, we'll just use the flags and property types
    switch (feature.toLowerCase()) {
      case 'water':
      case 'waterfront':
      case 'lake':
      case 'river':
        return Array.from(this.properties.values()).filter(
          property => property.isWaterfront
        );
        
      case 'mountain':
      case 'mountains':
      case 'mountain view':
        return Array.from(this.properties.values()).filter(
          property => property.isMountainView
        );
        
      default:
        // If feature is not recognized, fall back to text search
        return await this.searchProperties(feature);
    }
  }

  // Verification methods - in-memory implementations
  private verificationAttempts: Map<number, VerificationAttempt> = new Map();
  private currentVerificationId: number = 1;

  async createVerificationAttempt(attempt: InsertVerificationAttempt): Promise<VerificationAttempt> {
    const id = this.currentVerificationId++;
    const verificationAttempt: VerificationAttempt = {
      ...attempt,
      id,
      isVerified: false,
      createdAt: new Date(),
      verifiedAt: null
    };
    this.verificationAttempts.set(id, verificationAttempt);
    return verificationAttempt;
  }
  
  async getLatestVerificationAttempt(userId: number, method: string): Promise<VerificationAttempt | undefined> {
    const userAttempts = Array.from(this.verificationAttempts.values())
      .filter(attempt => attempt.userId === userId && attempt.method === method)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return userAttempts.length > 0 ? userAttempts[0] : undefined;
  }
  
  async markVerificationSuccessful(id: number): Promise<boolean> {
    const attempt = this.verificationAttempts.get(id);
    if (!attempt) {
      return false;
    }
    
    attempt.isVerified = true;
    attempt.verifiedAt = new Date();
    this.verificationAttempts.set(id, attempt);
    return true;
  }
  
  // Inquiry methods for MemStorage
  private inquiries: Map<number, Inquiry> = new Map();
  private currentInquiryId: number = 1;
  
  async getInquiry(id: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async getInquiriesByProperty(propertyId: number): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(
      inquiry => inquiry.propertyId === propertyId
    );
  }

  async getInquiriesByUser(userId: number, isSender: boolean): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(
      inquiry => isSender ? inquiry.fromUserId === userId : inquiry.toUserId === userId
    );
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.currentInquiryId++;
    const inquiry: Inquiry = {
      ...insertInquiry,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertInquiry.status || 'pending'
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<boolean> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) {
      return false;
    }
    
    inquiry.status = status as any;
    inquiry.updatedAt = new Date();
    this.inquiries.set(id, inquiry);
    return true;
  }
  
  async updateUserLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }
    
    user.lastLogin = new Date();
    this.users.set(id, user);
    return true;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    // If role is "*", return all users
    if (role === '*') {
      return Array.from(this.users.values());
    }
    
    // Otherwise filter by role - handle case where role field might be null
    // but isAgent flag is set
    return Array.from(this.users.values()).filter(user => {
      if (user.role) {
        // Use the explicit role if it exists
        return user.role === role;
      } else if (role === 'agent') {
        // For the agent role, check the isAgent flag as fallback
        return user.isAgent === true;
      } else if (role === 'buyer' && !user.isAgent) {
        // Default non-agents to buyer if no role is set
        return true;
      }
      
      return false;
    });
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    
    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Enhanced Agent Directory methods
  async getAgents(filters?: {
    state?: string;
    propertyType?: string;
    expertise?: string[];
    certifications?: string[];
    minRating?: number;
    minTransactions?: number;
    boundaryFilter?: any;
  }): Promise<(AgentProfile & { user: User })[]> {
    // Get all agent profiles
    let agentProfiles = Array.from(this.agentProfiles.values());
    
    // Apply filters if provided
    if (filters) {
      // Filter by state
      if (filters.state) {
        agentProfiles = agentProfiles.filter(profile => 
          profile.state?.toLowerCase() === filters.state?.toLowerCase()
        );
      }
      
      // Filter by property type expertise
      if (filters.propertyType) {
        agentProfiles = agentProfiles.filter(profile => 
          profile.propertySpecialties?.includes(filters.propertyType as any)
        );
      }
      
      // Filter by expertise areas
      if (filters.expertise && filters.expertise.length > 0) {
        agentProfiles = agentProfiles.filter(profile => 
          filters.expertise?.some(exp => profile.expertise?.includes(exp as any))
        );
      }
      
      // Filter by certifications
      if (filters.certifications && filters.certifications.length > 0) {
        const agentIds = Array.from(this.agentCertifications.values())
          .filter(cert => filters.certifications?.includes(cert.certificationType as any))
          .map(cert => cert.agentId);
        
        agentProfiles = agentProfiles.filter(profile => 
          agentIds.includes(profile.id)
        );
      }
      
      // Filter by minimum rating
      if (filters.minRating !== undefined) {
        agentProfiles = agentProfiles.filter(profile => 
          profile.averageRating >= filters.minRating!
        );
      }
      
      // Filter by minimum transactions
      if (filters.minTransactions !== undefined) {
        agentProfiles = agentProfiles.filter(profile => 
          profile.transactionCount >= filters.minTransactions!
        );
      }
      
      // Simple bounding box filter if provided
      if (filters.boundaryFilter && 
          filters.boundaryFilter.type === 'polygon' && 
          filters.boundaryFilter.coordinates) {
        // This would need a proper geo filter implementation
        // For memory storage, we just log this and skip the filter
        console.log('Boundary filter not implemented for in-memory storage');
      }
    }
    
    // Join with user data
    return agentProfiles.map(profile => {
      const user = this.users.get(profile.userId)!;
      return {
        ...profile,
        user
      };
    });
  }

  async getAgentWithProfile(agentId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return undefined;
    }
    
    const user = this.users.get(profile.userId);
    if (!user) {
      return undefined;
    }
    
    return {
      ...profile,
      user
    };
  }

  async getAgentWithProfileByUserId(userId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    const profile = Array.from(this.agentProfiles.values()).find(p => p.userId === userId);
    if (!profile) return undefined;
    const user = this.users.get(userId);
    if (!user) return undefined;
    return { ...profile, user };
  }

  async getAgentCertifications(agentId: number): Promise<AgentCertification[]> {
    return Array.from(this.agentCertifications.values())
      .filter(cert => cert.agentId === agentId);
  }

  async getAgentReviews(agentId: number): Promise<AgentReview[]> {
    return Array.from(this.agentReviews.values())
      .filter(review => review.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAgentTransactions(agentId: number): Promise<AgentTransaction[]> {
    return Array.from(this.agentTransactions.values())
      .filter(transaction => transaction.agentId === agentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getPropertiesByAgent(agentId: number): Promise<LandProperty[]> {
    return Array.from(this.properties.values())
      .filter(property => property.listingAgentId === agentId);
  }

  async getAgentQuestions(): Promise<AgentQuestion[]> {
    return Array.from(this.agentQuestions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAgentAnsweredQuestions(agentId: number): Promise<(AgentQuestion & { answers: AgentAnswer[] })[]> {
    // First get all answers by this agent
    const answers = Array.from(this.agentAnswers.values())
      .filter(answer => answer.agentId === agentId);
    
    // Get the unique question IDs from those answers
    const questionIds = [...new Set(answers.map(answer => answer.questionId))];
    
    if (questionIds.length === 0) {
      return [];
    }
    
    // Get the questions
    const questions = Array.from(this.agentQuestions.values())
      .filter(question => questionIds.includes(question.id));
    
    // Map answers to each question
    return questions.map(question => {
      const questionAnswers = answers.filter(answer => answer.questionId === question.id);
      return {
        ...question,
        answers: questionAnswers
      };
    });
  }

  async createAgentCertification(certification: InsertAgentCertification): Promise<AgentCertification> {
    const id = this.currentAgentCertificationId++;
    const newCertification: AgentCertification = {
      ...certification,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agentCertifications.set(id, newCertification);
    return newCertification;
  }

  async createAgentReview(review: InsertAgentReview): Promise<AgentReview> {
    const id = this.currentAgentReviewId++;
    const newReview: AgentReview = {
      ...review,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agentReviews.set(id, newReview);
    
    // Update agent average rating
    await this.updateAgentRating(newReview.agentId);
    
    return newReview;
  }
  
  private async updateAgentRating(agentId: number): Promise<void> {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return;
    }
    
    // Get all reviews for the agent
    const reviews = Array.from(this.agentReviews.values())
      .filter(review => review.agentId === agentId);
    
    if (reviews.length === 0) {
      return;
    }
    
    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    
    // Update agent profile
    profile.averageRating = averageRating;
    profile.reviewCount = reviews.length;
    profile.updatedAt = new Date();
    
    this.agentProfiles.set(agentId, profile);
  }

  async createAgentTransaction(transaction: InsertAgentTransaction): Promise<AgentTransaction> {
    const id = this.currentAgentTransactionId++;
    const newTransaction: AgentTransaction = {
      ...transaction,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agentTransactions.set(id, newTransaction);
    
    // Update agent transaction count
    await this.updateAgentTransactionCount(newTransaction.agentId);
    
    return newTransaction;
  }
  
  private async updateAgentTransactionCount(agentId: number): Promise<void> {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) {
      return;
    }
    
    // Count all transactions for this agent
    const transactions = Array.from(this.agentTransactions.values())
      .filter(transaction => transaction.agentId === agentId);
    
    // Update agent profile
    profile.transactionCount = transactions.length;
    profile.updatedAt = new Date();
    
    this.agentProfiles.set(agentId, profile);
  }

  async createAgentQuestion(question: InsertAgentQuestion): Promise<AgentQuestion> {
    const id = this.currentAgentQuestionId++;
    const newQuestion: AgentQuestion = {
      ...question,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      upvoteCount: 0
    };
    this.agentQuestions.set(id, newQuestion);
    return newQuestion;
  }

  async createAgentAnswer(answer: InsertAgentAnswer): Promise<AgentAnswer> {
    const id = this.currentAgentAnswerId++;
    const newAnswer: AgentAnswer = {
      ...answer,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      upvoteCount: 0
    };
    this.agentAnswers.set(id, newAnswer);
    return newAnswer;
  }

  async createDealRoom(dealRoom: InsertDealRoom): Promise<DealRoom> {
    const id = this.currentDealRoomId++;
    const newDealRoom: DealRoom = {
      ...dealRoom,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dealRooms.set(id, newDealRoom);
    return newDealRoom;
  }

  async getDealRoomsByAgent(agentId: number): Promise<DealRoom[]> {
    return Array.from(this.dealRooms.values())
      .filter(dealRoom => dealRoom.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  // Agent Profile methods
  async getAgentProfile(userId: number): Promise<AgentProfile | undefined> {
    return Array.from(this.agentProfiles.values())
      .find(profile => profile.userId === userId);
  }

  async createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile> {
    const id = this.currentAgentProfileId++;
    const newProfile: AgentProfile = {
      ...profile,
      id,
      averageRating: 0,
      reviewCount: 0,
      transactionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agentProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateAgentProfile(userId: number, profileData: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined> {
    // First, get the agent profile by userId
    const profile = Array.from(this.agentProfiles.values())
      .find(profile => profile.userId === userId);
    
    if (!profile) {
      return undefined;
    }
    
    // Update the profile
    const updatedProfile = {
      ...profile,
      ...profileData,
      updatedAt: new Date()
    };
    
    this.agentProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  async getAllAgents(): Promise<(User & { agentProfile?: AgentProfile })[]> {
    // Get all users who are agents
    const agentUsers = Array.from(this.users.values())
      .filter(user => user.isAgent === true);
    
    if (agentUsers.length === 0) {
      return [];
    }
    
    // Map agent profiles to users
    return agentUsers.map(user => {
      const profile = Array.from(this.agentProfiles.values())
        .find(profile => profile.userId === user.id);
      
      return {
        ...user,
        agentProfile: profile
      };
    });
  }

  // Enhanced Agent Directory methods
  async getAgents(filters?: {
    state?: string;
    propertyType?: string;
    expertise?: string[];
    certifications?: string[];
    minRating?: number;
    minTransactions?: number;
    boundaryFilter?: any;
  }): Promise<(AgentProfile & { user: User })[]> {
    try {
      // Start with a base query to join agent profiles with users
      let query = db.select({
        agentProfile: agentProfiles,
        user: users,
      }).from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id));
      
      // Apply filters if provided
      if (filters) {
        // Filter by state
        if (filters.state) {
          query = query.where(
            eq(agentProfiles.state, filters.state)
          );
        }
        
        // Filter by property type expertise
        if (filters.propertyType) {
          query = query.where(
            sql`${agentProfiles.propertySpecialties}::text LIKE ${'%' + filters.propertyType + '%'}`
          );
        }
        
        // Filter by expertise areas
        if (filters.expertise && filters.expertise.length > 0) {
          // For array filters, we need to check if any of the expertise areas match
          const expertiseConditions = filters.expertise.map(exp => 
            sql`${agentProfiles.expertise}::text LIKE ${'%' + exp + '%'}`
          );
          query = query.where(or(...expertiseConditions));
        }
        
        // Filter by minimum rating
        if (filters.minRating !== undefined) {
          query = query.where(
            sql`${agentProfiles.averageRating} >= ${filters.minRating}`
          );
        }
        
        // Filter by minimum transactions
        if (filters.minTransactions !== undefined) {
          query = query.where(
            sql`${agentProfiles.totalTransactions} >= ${filters.minTransactions}`
          );
        }
        
        // Boundary filter is complex and would require PostGIS
        // This is a simplified version assuming boundary is a polygon
        if (filters.boundaryFilter && 
            filters.boundaryFilter.type === 'polygon' && 
            filters.boundaryFilter.coordinates) {
          // This would need a proper PostGIS query
          console.log('Boundary filter not fully implemented yet');
        }
      }
      
      const result = await query;
      
      // Transform the result to match the expected return type
      return result.map(({ agentProfile, user }) => ({
        ...agentProfile,
        user
      }));
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async getAgentWithProfile(agentId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    try {
      const [result] = await db.select({
        agentProfile: agentProfiles,
        user: users,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(eq(agentProfiles.id, agentId));
      
      if (!result) return undefined;
      
      return {
        ...result.agentProfile,
        user: result.user
      };
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      return undefined;
    }
  }


  async getAgentWithProfileByUserId(userId: number): Promise<(AgentProfile & { user: User }) | undefined> {
    try {
      const [result] = await db.select({
        agentProfile: agentProfiles,
        user: users,
      })
      .from(agentProfiles)
      .innerJoin(users, eq(agentProfiles.userId, users.id))
      .where(eq(agentProfiles.userId, userId));

      if (!result) return undefined;

      return {
        ...result.agentProfile,
        user: result.user
      };
    } catch (error) {
      console.error(`Error fetching agent by user id ${userId}:`, error);
      return undefined;
    }
  }

  async getAgentCertifications(agentId: number): Promise<AgentCertification[]> {
    try {
      return await db.select()
        .from(agentCertifications)
        .where(eq(agentCertifications.agentId, agentId));
    } catch (error) {
      console.error(`Error fetching certifications for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentReviews(agentId: number): Promise<AgentReview[]> {
    try {
      return await db.select()
        .from(agentReviews)
        .where(eq(agentReviews.agentProfileId, agentId))
        .orderBy(desc(agentReviews.createdAt));
    } catch (error) {
      console.error(`Error fetching reviews for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentTransactions(agentId: number): Promise<AgentTransaction[]> {
    try {
      return await db.select()
        .from(agentTransactions)
        .where(eq(agentTransactions.agentId, agentId))
        .orderBy(desc(agentTransactions.date));
    } catch (error) {
      console.error(`Error fetching transactions for agent ${agentId}:`, error);
      return [];
    }
  }

  async getPropertiesByAgent(agentId: number): Promise<LandProperty[]> {
    try {
      const properties = await db.select()
        .from(landProperties)
        .where(eq(landProperties.listingAgentId, agentId));
      
      return this.mapDbPropertiesToAppProperties(properties);
    } catch (error) {
      console.error(`Error fetching properties for agent ${agentId}:`, error);
      return [];
    }
  }

  async getAgentQuestions(): Promise<AgentQuestion[]> {
    try {
      return await db.select()
        .from(agentQuestions)
        .orderBy(desc(agentQuestions.createdAt));
    } catch (error) {
      console.error('Error fetching agent questions:', error);
      return [];
    }
  }

  async getAgentAnsweredQuestions(agentId: number): Promise<(AgentQuestion & { answers: AgentAnswer[] })[]> {
    try {
      // First get all answers by this agent
      const answers = await db.select()
        .from(agentAnswers)
        .where(eq(agentAnswers.agentId, agentId));
      
      // Get the unique question IDs from those answers
      const questionIds = [...new Set(answers.map(answer => answer.questionId))];
      
      if (questionIds.length === 0) {
        return [];
      }
      
      // Get the questions
      const questions = await db.select()
        .from(agentQuestions)
        .where(inArray(agentQuestions.id, questionIds));
      
      // Map answers to each question
      return questions.map(question => {
        const questionAnswers = answers.filter(answer => answer.questionId === question.id);
        return {
          ...question,
          answers: questionAnswers
        };
      });
    } catch (error) {
      console.error(`Error fetching answered questions for agent ${agentId}:`, error);
      return [];
    }
  }

  async createAgentCertification(certification: InsertAgentCertification): Promise<AgentCertification> {
    try {
      const [newCertification] = await db
        .insert(agentCertifications)
        .values(certification)
        .returning();
      return newCertification;
    } catch (error) {
      console.error('Error creating agent certification:', error);
      throw error;
    }
  }

  async createAgentReview(review: InsertAgentReview): Promise<AgentReview> {
    try {
      const [newReview] = await db
        .insert(agentReviews)
        .values(review)
        .returning();
        
      // Update agent average rating
      await this.updateAgentRating(review.agentProfileId);
      
      return newReview;
    } catch (error) {
      console.error('Error creating agent review:', error);
      throw error;
    }
  }
  
  private async updateAgentRating(agentId: number): Promise<void> {
    try {
      // Get all reviews for the agent
      const reviews = await db.select()
        .from(agentReviews)
        .where(eq(agentReviews.agentProfileId, agentId));
      
      if (reviews.length === 0) return;
      
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + (review.rating || review.overallRating || 0), 0);
      const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
      
      // Update agent profile
      await db.update(agentProfiles)
        .set({ 
          averageRating,
          totalReviews: reviews.length
        })
        .where(eq(agentProfiles.id, agentId));
    } catch (error) {
      console.error(`Error updating rating for agent ${agentId}:`, error);
    }
  }

  async createAgentTransaction(transaction: InsertAgentTransaction): Promise<AgentTransaction> {
    try {
      const [newTransaction] = await db
        .insert(agentTransactions)
        .values(transaction)
        .returning();
        
      // Update agent transaction count
      await this.updateAgentTransactionCount(transaction.agentId);
      
      return newTransaction;
    } catch (error) {
      console.error('Error creating agent transaction:', error);
      throw error;
    }
  }
  
  private async updateAgentTransactionCount(agentId: number): Promise<void> {
    try {
      // Count all transactions for this agent
      const result = await db.select({ count: sql`count(*)` })
        .from(agentTransactions)
        .where(eq(agentTransactions.agentId, agentId));
      
      const transactionCount = Number(result[0].count);
      
      // Update agent profile
      await db.update(agentProfiles)
        .set({ transactionCount })
        .where(eq(agentProfiles.id, agentId));
    } catch (error) {
      console.error(`Error updating transaction count for agent ${agentId}:`, error);
    }
  }

  async createAgentQuestion(question: InsertAgentQuestion): Promise<AgentQuestion> {
    try {
      const [newQuestion] = await db
        .insert(agentQuestions)
        .values(question)
        .returning();
      return newQuestion;
    } catch (error) {
      console.error('Error creating agent question:', error);
      throw error;
    }
  }

  async createAgentAnswer(answer: InsertAgentAnswer): Promise<AgentAnswer> {
    try {
      const [newAnswer] = await db
        .insert(agentAnswers)
        .values(answer)
        .returning();
      return newAnswer;
    } catch (error) {
      console.error('Error creating agent answer:', error);
      throw error;
    }
  }

  async createDealRoom(dealRoom: InsertDealRoom): Promise<DealRoom> {
    try {
      const [newDealRoom] = await db
        .insert(dealRooms)
        .values(dealRoom)
        .returning();
      return newDealRoom;
    } catch (error) {
      console.error('Error creating deal room:', error);
      throw error;
    }
  }

  async getDealRoomsByAgent(agentId: number): Promise<DealRoom[]> {
    try {
      return await db.select()
        .from(dealRooms)
        .where(eq(dealRooms.agentId, agentId))
        .orderBy(desc(dealRooms.createdAt));
    } catch (error) {
      console.error(`Error fetching deal rooms for agent ${agentId}:`, error);
      return [];
    }
  }
  
  // Agent Profile methods
  async getAgentProfile(userId: number): Promise<AgentProfile | undefined> {
    try {
      const [agentProfile] = await db.select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, userId));
      return agentProfile;
    } catch (error) {
      console.error(`Error fetching agent profile for user ${userId}:`, error);
      return undefined;
    }
  }

  async createAgentProfile(profile: InsertAgentProfile): Promise<AgentProfile> {
    try {
      const [newProfile] = await db
        .insert(agentProfiles)
        .values(profile)
        .returning();
      return newProfile;
    } catch (error) {
      console.error('Error creating agent profile:', error);
      throw error;
    }
  }

  async updateAgentProfile(userId: number, profileData: Partial<InsertAgentProfile>): Promise<AgentProfile | undefined> {
    try {
      // First, get the agent profile ID from the userId
      const [existingProfile] = await db.select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, userId));
      
      if (!existingProfile) {
        console.error(`Agent profile not found for user ${userId}`);
        return undefined;
      }
      
      // Update the profile
      const [updatedProfile] = await db
        .update(agentProfiles)
        .set({
          ...profileData,
          updatedAt: new Date()
        })
        .where(eq(agentProfiles.id, existingProfile.id))
        .returning();
      
      return updatedProfile;
    } catch (error) {
      console.error(`Error updating agent profile for user ${userId}:`, error);
      return undefined;
    }
  }

  async getAllAgents(): Promise<(User & { agentProfile?: AgentProfile })[]> {
    try {
      // First get all users who are agents
      const agentUsers = await db.select()
        .from(users)
        .where(eq(users.isAgent, true));
      
      if (agentUsers.length === 0) {
        return [];
      }
      
      // Get all agent profiles
      const agentProfiles = await db.select()
        .from(agentProfiles);
      
      // Map agent profiles to users
      return agentUsers.map(user => {
        const profile = agentProfiles.find(profile => profile.userId === user.id);
        return {
          ...user,
          agentProfile: profile
        };
      });
    } catch (error) {
      console.error('Error fetching all agents:', error);
      return [];
    }
  }

  // Teams methods (stub implementations for MemStorage)
  async getTeamStats(): Promise<{
    totalAgents: number;
    totalBrokerages: number;
    avgExperience: number;
    avgRating: number;
    totalSales: number;
  }> {
    const agents = Array.from(this.agentProfiles.values());
    const brokerages = new Set(agents.map(a => a.brokerage).filter(Boolean));
    
    return {
      totalAgents: agents.length,
      totalBrokerages: brokerages.size,
      avgExperience: agents.reduce((sum, a) => sum + (a.yearsExperience || 0), 0) / Math.max(agents.length, 1),
      avgRating: agents.reduce((sum, a) => sum + (a.averageRating || 0), 0) / Math.max(agents.length, 1),
      totalSales: agents.reduce((sum, a) => sum + (a.totalTransactions || 0), 0)
    };
  }

  async getSpecialtiesWithCounts(): Promise<Array<{
    main_specialty: string;
    agent_count: number;
  }>> {
    const agents = Array.from(this.agentProfiles.values());
    const specialtyCounts = new Map<string, number>();
    
    agents.forEach(agent => {
      if (agent.specialtyAreas && Array.isArray(agent.specialtyAreas) && agent.specialtyAreas.length > 0) {
        const mainSpecialty = agent.specialtyAreas[0];
        specialtyCounts.set(mainSpecialty, (specialtyCounts.get(mainSpecialty) || 0) + 1);
      }
    });
    
    return Array.from(specialtyCounts.entries())
      .map(([main_specialty, agent_count]) => ({ main_specialty, agent_count }))
      .sort((a, b) => b.agent_count - a.agent_count)
      .slice(0, 10);
  }
  
  // Land tract stub methods (MemStorage)
  async getTractsByProperty(_propertyId: number): Promise<LandTract[]> {
    return [];
  }
  
  async getTract(_id: number): Promise<LandTract | undefined> {
    return undefined;
  }
  
  async createTract(_tract: InsertLandTract): Promise<LandTract> {
    throw new Error('MemStorage does not support tract operations');
  }
  
  async updateTract(_id: number, _tractData: Partial<InsertLandTract>): Promise<LandTract | undefined> {
    return undefined;
  }
  
  async deleteTract(_id: number): Promise<boolean> {
    return false;
  }
  
  async getChildTracts(_parentTractId: number): Promise<LandTract[]> {
    return [];
  }
}

// Create and export the storage instance
// Using the database storage implementation for persistence
const storage = new DatabaseStorage();
storage.initializeDatabase()
  .catch(err => console.error('Error initializing database:', err));

export { storage };
