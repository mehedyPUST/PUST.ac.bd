import { notFound } from 'next/navigation';
import { PublicRouteView } from '../../../components/PublicRouteView';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function AdmissionsSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('admissions', slug)) {
    notFound();
  }
  return <PublicRouteView />;
}
