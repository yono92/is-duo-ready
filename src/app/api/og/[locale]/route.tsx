import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { seoConfig } from '@/messages/seo';

export const runtime = 'nodejs';

// Original local font files keep both languages independent of a font CDN.
const fonts = Promise.all([
  readFile(join(process.cwd(), 'src/lib/seo/assets/NanumGothic-Regular.ttf')),
  readFile(join(process.cwd(), 'src/lib/seo/assets/NanumGothic-ExtraBold.ttf')),
]);

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'ko' && locale !== 'en') return new Response(null, { status: 404 });
  const copy = seoConfig.locales[locale].image;
  const [regular, bold] = await fonts;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#ffffff',
        color: '#1d1d1f',
        fontFamily: 'Nanum Gothic',
        padding: '54px 64px 42px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, height: 48 }}>
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="18" fill="#0066cc" />
          <path d="M15 17h12v30H15a3 3 0 0 1-3-3V20a3 3 0 0 1 3-3Z" fill="#fff" />
          <path d="M33 17h16a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H33V17Z" fill="#fff" />
          <path
            d="m38 32 4 4 6-8"
            stroke="#0066cc"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ display: 'flex', fontSize: 27, fontWeight: 800, letterSpacing: '-0.8px' }}>
          {seoConfig.siteName}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 680, gap: 25 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.17,
              letterSpacing: '-3.8px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {copy.headline}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 25,
              lineHeight: 1.5,
              color: '#6e6e73',
              letterSpacing: '-0.6px',
            }}
          >
            {copy.description}
          </div>
        </div>
        <svg width="350" height="350" viewBox="0 0 350 350" fill="none">
          <circle cx="175" cy="175" r="175" fill="#f5f5f7" />
          <path d="M45 56h78v238H45a25 25 0 0 1-25-25V81a25 25 0 0 1 25-25Z" fill="#0066cc" />
          <path d="M143 56h162a25 25 0 0 1 25 25v188a25 25 0 0 1-25 25H143V56Z" fill="#0066cc" />
          <path
            d="m188 177 36 36 59-78"
            stroke="#fff"
            strokeWidth="17"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #d2d2d7',
          paddingTop: 25,
          fontSize: 19,
          color: '#6e6e73',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {copy.features.map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0066cc' }} />
              {feature}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', color: '#1d1d1f' }}>
          {new URL(seoConfig.productionOrigin).hostname}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Nanum Gothic', data: regular, style: 'normal', weight: 400 },
        { name: 'Nanum Gothic', data: bold, style: 'normal', weight: 800 },
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
      },
    },
  );
}
