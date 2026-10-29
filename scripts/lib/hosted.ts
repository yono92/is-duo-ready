export interface HostedArguments {
  apply?: boolean;
  target: string;
  'project-ref': string;
  config?: string;
  source?: string;
}
export type HostedEnvironment = Record<string, string | undefined> & {
  DATABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
};
import { readFileSync, statSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { validateEnvironment } from './environment.ts';

export function hostedArguments(args = process.argv.slice(2)) {
  const result: Partial<HostedArguments> = {};
  for (const arg of args) {
    if (arg === '--apply') result.apply = true;
    else if (/^--(target|project-ref|config|source)=.+$/.test(arg)) {
      const split = arg.indexOf('=');
      const name = arg.slice(2, split) as 'target' | 'project-ref' | 'config' | 'source';
      if (result[name]) throw new Error('Duplicate argument.');
      result[name] = arg.slice(split + 1);
    } else
      throw new Error(
        'Use --target=preview|production --project-ref=ref [--config=file] [--source=file] [--apply].',
      );
  }
  if (
    !['preview', 'production'].includes(result.target ?? '') ||
    !/^[a-z0-9]+$/.test(result['project-ref'] ?? '')
  )
    throw new Error('Explicit hosted target and project-ref are required.');
  return result as HostedArguments;
}

export function loadHosted(args: HostedArguments) {
  // Never use .env.production.local: Next would load hosted credentials into local builds.
  const file = args.config || `.env.hosted.${args.target}.local`;
  let env;
  try {
    if (statSync(file).mode & 0o077) throw new Error('permissions');
    env = parseEnv(readFileSync(file, 'utf8'));
  } catch {
    throw new Error(
      'Hosted configuration must exist as a private 0600 file; no values were printed.',
    );
  }
  const result = validateEnvironment(env, args.target);
  if (
    !env.DATABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SECRET_KEY ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error('Hosted connection configuration is incomplete.');
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  if (new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !== `${args['project-ref']}.supabase.co`)
    throw new Error('Explicit project-ref does not match configuration.');
  return env as HostedEnvironment;
}
