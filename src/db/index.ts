import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connection = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/harbour', {
  max: 1,
});

export const db = drizzle(connection);
