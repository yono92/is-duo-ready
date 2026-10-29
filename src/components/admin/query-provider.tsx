'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mount within the authenticated page, never as a process-wide or persisted cache.
export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
