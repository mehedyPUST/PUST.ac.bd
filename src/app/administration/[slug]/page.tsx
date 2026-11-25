import { notFound } from 'next/navigation';
import { AdministrationRouteView } from '../../../components/SectionRouteViews';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function AdministrationSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('administration', slug)) {
    notFound();
  }
  return <AdministrationRouteView />;
}
