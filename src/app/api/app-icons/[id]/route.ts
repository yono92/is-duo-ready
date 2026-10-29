import { iconResponse } from '@/lib/icons/response';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return iconResponse((await params).id, null);
}
