import { ReviewList } from '@/components/operations/review-list';
export default async function Reviews({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; page?: string }>;
}) {
  return <ReviewList query={await searchParams} />;
}
