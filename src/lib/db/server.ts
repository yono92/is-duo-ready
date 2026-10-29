import 'server-only';
import { Pool, type PoolClient } from 'pg';
import { withActor } from './transaction.ts';
import { liveHostedSession } from '@/lib/admin/hosted-session.ts';
import { connectionOptions } from './connection.ts';

const globalDb = globalThis as unknown as { duoPool?: Pool };
function pool() {
  if (globalDb.duoPool) return globalDb.duoPool;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('Database is not configured.');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('Invalid database configuration.');
  const instance = new Pool({
    ...connectionOptions(connectionString),
    max: 5,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  });
  // Never emit connection strings or driver details to the browser or log.
  instance.on('error', () => {});
  globalDb.duoPool = instance;
  return instance;
}

export async function database<T>(
  actor: string | null,
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  try {
    return await withActor(pool(), actor, action);
  } catch (error) {
    // PostgreSQL details can contain submitted private values. Keep only a safe error code.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      /^[A-Z0-9_]+$/.test(String(error.code))
    ) {
      throw Object.assign(new Error('Database operation failed.'), { code: error.code });
    }
    throw error;
  }
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

// The verified server session is checked through the server connection, never an exposed RPC.
export async function hostedSessionActive(sessionId: string, actor: string) {
  try {
    return await liveHostedSession(pool(), sessionId, actor);
  } catch {
    throw new Error('Hosted session verification unavailable.');
  }
}
