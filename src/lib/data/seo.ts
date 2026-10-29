export function indexingAllowed(env: Record<string, string | undefined>) {
  if (
    env.PUBLIC_INDEXING !== 'true' ||
    env.NODE_ENV !== 'production' ||
    env.VERCEL_ENV !== 'production' ||
    env.DIRECTORY_DATA_SOURCE !== 'postgres'
  )
    return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_SITE_URL ?? '');
    return (
      url.protocol === 'https:' &&
      /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) &&
      !/(?:^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname) &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
