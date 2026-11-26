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
  if (category === 'Convocation') {
    return isEven
      ? {
          cardClass: 'card-gradient-gold border-gold-200/80 hover:border-gold-600/45',
          accentClass: 'text-gold-800',
        }
      : {
          cardClass: 'card-gradient-parchment border-amber-900/15 hover:border-gold-600/45',
          accentClass: 'text-pust-800',
        };
  }
  if (category === 'Academic Event') {
    return isEven
      ? {
          cardClass: 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/45',
          accentClass: 'text-lapis-700',
        }
      : {
          cardClass: 'card-gradient-cerulean border-cerulean-200/80 hover:border-cerulean-600/45',
          accentClass: 'text-cerulean-700',
        };
  }
  if (category === 'Festival') {
    return isEven
      ? {
          cardClass: 'card-gradient-crimson border-pust-200/80 hover:border-pust-600/45',
          accentClass: 'text-pust-800',
        }
      : {
          cardClass: 'card-gradient-violet border-violet-200/80 hover:border-violet-600/45',
          accentClass: 'text-violet-700',
        };
  }
  return isEven
    ? {
        cardClass: 'card-gradient-sage border-sage-200/80 hover:border-sage-600/45',
        accentClass: 'text-sage-700',
      }
    : {
        cardClass: 'card-gradient-teal border-teal-200/80 hover:border-teal-600/45',
        accentClass: 'text-teal-700',
      };
}

export function getAlternatingDepartmentCardClass(facultyName: string, idx: number): string {
  const isEven = idx % 2 === 0;
  if (facultyName === 'Faculty of Engineering and Technology') {
    return isEven
      ? 'card-gradient-lapis border-lapis-200 hover:border-lapis-600/60'
      : 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-600/60';
  }
  if (facultyName === 'Faculty of Science') {
    return isEven
      ? 'card-gradient-sage border-sage-200 hover:border-sage-600/60'
      : 'card-gradient-teal border-teal-200 hover:border-teal-600/60';
  }
  if (facultyName === 'Faculty of Business Studies') {
    return isEven
      ? 'card-gradient-gold border-gold-200 hover:border-gold-600/60'
      : 'card-gradient-parchment border-amber-900/15 hover:border-gold-600/60';
  }
  if (facultyName === 'Faculty of Humanities and Social Science') {
    return isEven
      ? 'card-gradient-crimson border-pust-200 hover:border-pust-600/60'
      : 'card-gradient-violet border-violet-200 hover:border-violet-600/60';
  }
  return isEven
    ? 'card-gradient-emerald border-emerald-200 hover:border-emerald-600/60'
    : 'card-gradient-parchment border-amber-900/15 hover:border-sage-600/60';
}

export function getAlternatingUnitCardClass(
  category: AdministrativeUnit['category'],
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  if (category === 'Statutory Governance') {
    return isEven
      ? 'card-gradient-crimson border-pust-200/80 hover:border-pust-600/45'
      : 'card-gradient-parchment border-amber-900/15 hover:border-pust-600/45';
  }
  if (category === 'Administrative Office') {
    return isEven
      ? 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/45'
      : 'card-gradient-cerulean border-cerulean-200/80 hover:border-cerulean-600/45';
  }
  return isEven
    ? 'card-gradient-sage border-sage-200/80 hover:border-sage-600/45'
    : 'card-gradient-teal border-teal-200/80 hover:border-teal-600/45';
}

export function getAlternatingOfficeCardClass(
  category: AdminOfficeCategory,
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  switch (category) {
    case 'Executive Leadership':
      return isEven
        ? 'card-gradient-crimson border-pust-200/80 hover:border-pust-600/50'
        : 'card-gradient-rose border-rose-200/80 hover:border-pust-600/50';
    case 'Administrative Sections & Offices':
      return isEven
        ? 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/50'
        : 'card-gradient-cerulean border-cerulean-200/80 hover:border-cerulean-600/50';
    case 'Student Welfare & Campus Services':
      return isEven
        ? 'card-gradient-sage border-sage-200/80 hover:border-sage-600/50'
        : 'card-gradient-teal border-teal-200/80 hover:border-teal-600/50';
    case 'Residential Halls & Accommodation':
      return isEven
        ? 'card-gradient-gold border-gold-200/80 hover:border-gold-600/50'
        : 'card-gradient-parchment border-amber-900/15 hover:border-gold-600/50';
    case 'Research, ICT & Quality Cells':
      return isEven
        ? 'card-gradient-cerulean border-cerulean-200/80 hover:border-cerulean-600/50'
        : 'card-gradient-violet border-violet-200/80 hover:border-violet-600/50';
  }
}
