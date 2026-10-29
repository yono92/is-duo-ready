import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.DUO_TEST_PORT ?? 3351);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid test port.');
export default defineConfig({
  testDir: 'tests/e2e',
  testIgnore: [
    '**/admin.spec.ts',
    '**/public-data.spec.ts',
    '**/import.spec.ts',
    '**/import-control.spec.ts',
    '**/operations.spec.ts',
    '**/icons.spec.ts',
  ],
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list']],
  outputDir: `test-results/fixtures-${port}`,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    env: { DIRECTORY_DATA_SOURCE: 'fixtures', DUO_TEST_RUN: '1' },
    reuseExistingServer: false,
    timeout: 120000,
  },
});
