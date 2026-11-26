import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function GovernanceLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="governance">{children}</PersistentSectionLayout>;
}
