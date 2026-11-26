import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function FacilitiesLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="facilities">{children}</PersistentSectionLayout>;
}
