import { usageImageResponse } from '@/lib/operations/usage-image-response';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return usageImageResponse((await params).id);
}
