import { notFound } from 'next/navigation';
import { GovernanceRouteView } from '../../../components/SectionRouteViews';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function GovernanceSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('governance', slug)) {
    notFound();
  }
  return <GovernanceRouteView />;
}
