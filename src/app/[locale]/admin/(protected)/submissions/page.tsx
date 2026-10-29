import { ReviewList } from '@/components/operations/review-list';
export default async function Submissions({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; page?: string }>;
}) {
  return <ReviewList query={await searchParams} submissions />;
}
