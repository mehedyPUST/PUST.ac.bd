import { notFound } from 'next/navigation';
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
  return null;
}
