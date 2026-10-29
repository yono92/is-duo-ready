import 'server-only';
import { database } from '@/lib/db/server';
import { iconStorage } from './storage.ts';

export async function iconResponse(id: string, actor: string | null) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
    return new Response(null, { status: 404, headers });
  try {
    const asset = await database(
      actor,
      async (db) =>
        (
          await db.query<{
            storage_path: string;
            content_type: string;
          }>('SELECT storage_path,content_type FROM public.app_icon_assets WHERE app_id=$1', [id])
        ).rows[0],
    );
    if (!asset) return new Response(null, { status: 404, headers });
    const bytes = await iconStorage().read(asset.storage_path);
    return new Response(new Uint8Array(bytes), {
      headers: { ...headers, 'Content-Type': asset.content_type },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
