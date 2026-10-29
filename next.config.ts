import createNextIntlPlugin from 'next-intl/plugin';
const testPort = process.env.DUO_TEST_RUN === '1' ? process.env.DUO_TEST_PORT : undefined;
if (
  testPort &&
  (!/^\d{4,5}$/.test(testPort) || Number(testPort) < 1024 || Number(testPort) > 65535)
)
  throw new Error('Invalid test port.');
export default createNextIntlPlugin('./src/i18n/request.ts')({
  poweredByHeader: false,
  devIndicators: false,
  distDir:
    process.env.DUO_TEST_RUN === '1'
      ? testPort
        ? `.next-test-${testPort}`
        : '.next-test'
      : '.next',
});
