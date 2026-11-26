import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function AcademicsLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="academics">{children}</PersistentSectionLayout>;
}
