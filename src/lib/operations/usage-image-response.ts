import 'server-only';
import { getUsageScreenshot } from './usage';

export async function usageImageResponse(id: string, actor?: string) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
    return new Response(null, { status: 404, headers });
  try {
    const image = await getUsageScreenshot(id, actor);
    if (!image) return new Response(null, { status: 404, headers });
    return new Response(new Uint8Array(image.bytes), {
      headers: { ...headers, 'Content-Type': image.contentType },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
