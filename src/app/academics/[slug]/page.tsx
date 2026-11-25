import { notFound } from 'next/navigation';
import { PublicRouteView } from '../../../components/PublicRouteView';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function AcademicsSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('academics', slug)) {
    notFound();
  }
  return <PublicRouteView />;
}
