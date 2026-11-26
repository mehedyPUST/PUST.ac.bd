import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function AdmissionsLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="admissions">{children}</PersistentSectionLayout>;
}
