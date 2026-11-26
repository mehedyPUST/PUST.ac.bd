import type { ReactNode } from 'react';
import { PersistentSectionLayout } from '../../components/SectionRouteViews';

export default function AboutLayout({ children }: { children: ReactNode }) {
  return <PersistentSectionLayout section="about">{children}</PersistentSectionLayout>;
}
