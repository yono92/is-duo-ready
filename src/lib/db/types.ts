import type { Client, PoolClient } from 'pg';

export type DatabaseClient = Pick<Client, 'query'>;
export type ActorDatabase = <T>(
  actor: string | null,
  operation: (db: PoolClient) => Promise<T>,
) => Promise<T>;
export type Environment = Record<string, string | undefined>;
