import { notFound } from 'next/navigation';
import { PublicRouteView } from '../../../components/PublicRouteView';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function NoticesSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('notices', slug)) {
    notFound();
  }
  return <PublicRouteView />;
}
