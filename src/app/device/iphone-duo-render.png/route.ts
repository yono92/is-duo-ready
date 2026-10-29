import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (process.env.VERCEL !== undefined) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(
      join(process.cwd(), 'assets', 'development', 'iphone-duo-render.png'),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
