import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
const internationalize = createMiddleware(routing);
export default async function proxy(request: NextRequest) {
  const privateApi = request.nextUrl.pathname.startsWith('/api/admin/');
  const admin = privateApi || /^\/(ko|en)\/admin(?:\/|$)/.test(request.nextUrl.pathname);
  const updated: { name: string; value: string; options: CookieOptions }[] = [];
  const authHeaders: Record<string, string> = {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (admin && url && key) {
    const client = createServerClient(url, key, {
      cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items, responseHeaders) => {
          for (const item of items) {
            request.cookies.set(item.name, item.value);
            updated.push(item);
          }
          Object.assign(authHeaders, responseHeaders);
        },
      },
    });
    // This refreshes signed cookies. Authorization still happens inside every action.
    await client.auth.getUser();
  }
  const response = privateApi ? NextResponse.next({ request }) : internationalize(request);
  for (const { name, value, options } of updated) response.cookies.set(name, value, options);
  for (const [name, value] of Object.entries(authHeaders)) response.headers.set(name, value);
  if (admin) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}
// Only supported locale routes and the root; unknown prefixes reach localized 404.
export const config = { matcher: ['/', '/(ko|en)/:path*', '/api/admin/:path*'] };
