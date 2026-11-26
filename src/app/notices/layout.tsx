import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function NoticesLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="notices">{children}</PersistentSectionLayout>;
}
