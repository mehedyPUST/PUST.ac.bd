import { notFound } from 'next/navigation';
import { isValidSectionSlug } from '../../../lib/routes';

export default async function FacilitiesSubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isValidSectionSlug('facilities', slug)) {
    notFound();
  }
  return null;
}
