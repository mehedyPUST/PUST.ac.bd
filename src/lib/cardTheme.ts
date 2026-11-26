import type {
  AdministrativeUnit,
  AdminOfficeCategory,
  GalleryItemRecord,
} from '../types/pust';

export interface CardThemeVariant {
  cardClass: string;
  accentClass: string;
}

export function getAlternatingEventCardTheme(
  category: GalleryItemRecord['category'],
  occurrenceIdx: number
): CardThemeVariant {
  const isEven = occurrenceIdx % 2 === 0;
  const baseCard = isEven
    ? 'bg-white border-stone-200 hover:border-pust-700/45'
    : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45';

  if (category === 'Convocation') {
    return { cardClass: baseCard, accentClass: 'text-gold-700' };
  }
  if (category === 'Academic Event') {
    return { cardClass: baseCard, accentClass: 'text-pust-800' };
  }
  if (category === 'Festival') {
    return { cardClass: baseCard, accentClass: 'text-gold-700' };
  }
  return { cardClass: baseCard, accentClass: 'text-stone-600' };
}

export function getAlternatingDepartmentCardClass(_facultyName: string, idx: number): string {
  return idx % 2 === 0
    ? 'bg-white border-stone-200 hover:border-pust-700/45'
    : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45';
}

export function getAlternatingUnitCardClass(
  _category: AdministrativeUnit['category'],
  occurrenceIdx: number
): string {
  return occurrenceIdx % 2 === 0
    ? 'bg-white border-stone-200 hover:border-pust-700/45'
    : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45';
}

export function getAlternatingOfficeCardClass(
  _category: AdminOfficeCategory,
  occurrenceIdx: number
): string {
  return occurrenceIdx % 2 === 0
    ? 'bg-white border-stone-200 hover:border-pust-700/45'
    : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45';
}
