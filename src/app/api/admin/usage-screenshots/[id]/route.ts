import { assertAdmin } from '@/lib/admin/auth';
import { usageImageResponse } from '@/lib/operations/usage-image-response';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await assertAdmin();
    return usageImageResponse((await params).id, actor);
  } catch {
    return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
