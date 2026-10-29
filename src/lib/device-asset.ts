import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const deviceAsset =
  process.env.VERCEL !== undefined ||
  !existsSync(join(process.cwd(), 'assets', 'development', 'iphone-duo-render.png'))
    ? null
    : ({
        src: '/device/iphone-duo-render.png',
        width: 1536,
        height: 1024,
        placeholder: false,
        sourceRecord: 'docs/assets.md',
      } as const);
