import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

let _db: ReturnType<typeof drizzle> | null = null;
let _migrationClient: ReturnType<typeof postgres> | null = null;

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  console.log('Database connection string:', `${connectionString.substring(0, 30)}...`);
  return connectionString;
}

// Lazy initialization for migrations
export function getMigrationClient() {
  if (!_migrationClient) {
    _migrationClient = postgres(getConnectionString(), { max: 1 });
  }
  return _migrationClient;
}

// Lazy initialization for queries
export function getDb() {
  if (!_db) {
    const queryClient = postgres(getConnectionString());
    _db = drizzle(queryClient, { schema });
  }
  return _db;
}

// Export db as a getter
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});

// For backwards compatibility
export const migrationClient = new Proxy({} as ReturnType<typeof postgres>, {
  get(target, prop) {
    return getMigrationClient()[prop as keyof ReturnType<typeof postgres>];
  },
  apply(target, thisArg, args) {
    return getMigrationClient()(...args);
  }
});
