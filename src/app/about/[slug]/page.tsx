import { notFound } from 'next/navigation';
import { PublicRouteView } from '../../../components/PublicRouteView';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function AboutSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('about', slug)) {
    notFound();
  }
  return <PublicRouteView />;
}
