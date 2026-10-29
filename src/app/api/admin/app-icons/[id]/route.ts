import { assertAdmin } from '@/lib/admin/auth';
import { iconResponse } from '@/lib/icons/response';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await assertAdmin();
    return iconResponse((await params).id, actor);
  } catch {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
