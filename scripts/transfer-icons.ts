import { readFile, stat } from 'node:fs/promises';
import { hostedArguments, loadHosted } from './lib/hosted.ts';
import { validateSnapshot } from './lib/content-transfer.ts';
import { localIconStorage } from '../src/lib/icons/storage.ts';
import { supabaseIconStorage } from '../src/lib/icons/hosted.ts';
try {
  const args = hostedArguments();
  const env = loadHosted(args);
  if (!args.source || (await stat(args.source)).size > 16777216)
    throw new Error('Manifest required; maximum 16 MiB.');
  const snapshot = JSON.parse(await readFile(args.source, 'utf8'));
  validateSnapshot(snapshot);
  const local = localIconStorage({ APP_ICON_STORAGE_DIR: process.env.APP_ICON_STORAGE_DIR });
  const remote = supabaseIconStorage(env);
  const counts = { verified: 0, copied: 0, skipped: 0, failed: 0 };
  for (const asset of snapshot.tables['public.app_icon_assets']) {
    try {
      if (typeof asset.storage_path !== 'string' || typeof asset.byte_size !== 'number')
        throw new Error('Invalid icon manifest row.');
      const bytes = await local.read(asset.storage_path);
      if (bytes.length !== asset.byte_size) throw new Error('Size mismatch.');
      counts.verified++;
      if (!args.apply) continue;
      try {
        await remote.read(asset.storage_path);
        counts.skipped++;
        continue;
      } catch {
        /* repair missing/corrupt object */
      }
      await remote.put(asset.storage_path, bytes);
      if (!(await remote.read(asset.storage_path)).equals(bytes)) throw new Error('Mismatch.');
      counts.copied++;
    } catch {
      counts.failed++;
    }
  }
  console.log(
    JSON.stringify({ target: args.target, mode: args.apply ? 'apply' : 'dry-run', ...counts }),
  );
  if (counts.failed) process.exitCode = 1;
} catch {
  console.error(
    'Icon transfer failed. Check dedicated config, source manifest and private bucket.',
  );
  process.exitCode = 1;
}
