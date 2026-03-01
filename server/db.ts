import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create a database connection using the DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL!;

// Configure postgres client with optimized connection pooling
const client = postgres(connectionString, {
  max: 10, // Increased connection limit for better performance
  idle_timeout: 60, // Keep connections alive longer
  connect_timeout: 30, // Faster timeout for responsiveness
  prepare: true, // Enable prepared statements for better performance
  onnotice: () => {}, // Suppress notice messages
  transform: postgres.camel, // Auto-convert snake_case to camelCase
});

// Create the drizzle client with the schema
export const db = drizzle(client, { schema });