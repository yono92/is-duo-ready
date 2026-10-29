import { AdminError, assertAdmin } from '@/lib/admin/auth';
import { collectionOverview } from '@/lib/operations/repository';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  try {
    const actor = await assertAdmin();
    return Response.json(await collectionOverview(actor), { headers });
  } catch (error) {
    const code = error instanceof AdminError ? error.code : 'unavailable';
    const status = code === 'authRequired' ? 401 : code === 'forbidden' ? 403 : 503;
    return Response.json({ error: code }, { status, headers });
  }
}
