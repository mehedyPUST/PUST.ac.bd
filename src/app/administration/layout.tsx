import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="administration">{children}</PersistentSectionLayout>;
}
