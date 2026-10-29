type Environment = { NODE_ENV?: string; VERCEL?: string; LOCAL_FIXTURES?: string };
export function fixturesAllowed(env: Environment) {
  if (env.VERCEL !== undefined) return false;
  return env.NODE_ENV === 'development' || env.NODE_ENV === 'test' || env.LOCAL_FIXTURES === 'true';
}
