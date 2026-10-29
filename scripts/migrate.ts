import {
  localDatabaseUrl,
  databaseClient,
  bootstrapLocalRoles,
  applyMigrations,
} from './lib/database.ts';

let client;
try {
  client = databaseClient(localDatabaseUrl());
  await client.connect();
  await bootstrapLocalRoles(client);
  const applied = await applyMigrations(client);
  console.log(`PASS local migrations: ${applied.length} applied`);
  for (const name of applied) console.log(name);
} catch (error) {
  // Driver messages can contain SQL inputs and connection information.
  console.error('Local migration failed. No credentials or SQL input are printed.');
  if (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Z0-9]{5}$/.test(error.code)
  )
    console.error(`SQLSTATE ${error.code}`);
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
}
