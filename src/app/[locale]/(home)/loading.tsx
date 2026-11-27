import { Skeleton } from '@/components/ui/skeleton';
export default function Loading() {
  return (
    <main id="main" className="site-width py-16" aria-busy="true">
      <Skeleton className="mb-8 h-40 w-full" />
      <div className="app-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </main>
  );
}
