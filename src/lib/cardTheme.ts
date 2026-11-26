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
          cardClass: 'card-gradient-gold border-gold-300/80 hover:border-gold-500',
          accentClass: 'text-gold-800',
        }
      : {
          cardClass: 'card-gradient-crimson border-pust-200 hover:border-pust-500',
          accentClass: 'text-pust-700',
        };
  }
  if (category === 'Academic Event') {
    return isEven
      ? {
          cardClass: 'card-gradient-lapis border-lapis-200 hover:border-lapis-500',
          accentClass: 'text-lapis-600',
        }
      : {
          cardClass: 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500',
          accentClass: 'text-cerulean-700',
        };
  }
  if (category === 'Festival') {
    return isEven
      ? {
          cardClass: 'card-gradient-rose border-rose-200 hover:border-rose-500',
          accentClass: 'text-rose-700',
        }
      : {
          cardClass: 'card-gradient-gold border-gold-300/80 hover:border-gold-500',
          accentClass: 'text-gold-800',
        };
  }
  return isEven
    ? {
        cardClass: 'card-gradient-emerald border-emerald-200 hover:border-emerald-500',
        accentClass: 'text-emerald-700',
      }
    : {
        cardClass: 'card-gradient-teal border-teal-200 hover:border-teal-500',
        accentClass: 'text-teal-700',
      };
}

export function getAlternatingDepartmentCardClass(facultyName: string, idx: number): string {
  const isEven = idx % 2 === 0;
  if (facultyName === 'Faculty of Engineering and Technology') {
    return isEven
      ? 'card-gradient-lapis border-lapis-200 hover:border-lapis-500'
      : 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500';
  }
  if (facultyName === 'Faculty of Science') {
    return isEven
      ? 'card-gradient-emerald border-emerald-200 hover:border-emerald-500'
      : 'card-gradient-teal border-teal-200 hover:border-teal-500';
  }
  if (facultyName === 'Faculty of Business Studies') {
    return isEven
      ? 'card-gradient-gold border-gold-300/80 hover:border-gold-500'
      : 'card-gradient-parchment border-amber-300/70 hover:border-amber-500';
  }
  if (facultyName === 'Faculty of Humanities and Social Science') {
    return isEven
      ? 'card-gradient-crimson border-pust-200 hover:border-pust-500'
      : 'card-gradient-gold border-gold-300/80 hover:border-gold-500';
  }
  return isEven
    ? 'card-gradient-sage border-sage-200 hover:border-sage-500'
    : 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500';
}

export function getAlternatingUnitCardClass(
  category: AdministrativeUnit['category'],
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  if (category === 'Statutory Governance') {
    return isEven
      ? 'card-gradient-crimson border-pust-200 hover:border-pust-500'
      : 'card-gradient-gold border-gold-300/80 hover:border-gold-500';
  }
  if (category === 'Administrative Office') {
    return isEven
      ? 'card-gradient-lapis border-lapis-200 hover:border-lapis-500'
      : 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500';
  }
  return isEven
    ? 'card-gradient-emerald border-emerald-200 hover:border-emerald-500'
    : 'card-gradient-teal border-teal-200 hover:border-teal-500';
}

export function getAlternatingOfficeCardClass(
  category: AdminOfficeCategory,
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  switch (category) {
    case 'Executive Leadership':
      return isEven
        ? 'card-gradient-crimson border-pust-200 hover:border-pust-500'
        : 'card-gradient-rose border-rose-200 hover:border-rose-500';
    case 'Administrative Sections & Offices':
      return isEven
        ? 'card-gradient-lapis border-lapis-200 hover:border-lapis-500'
        : 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500';
    case 'Student Welfare & Campus Services':
      return isEven
        ? 'card-gradient-emerald border-emerald-200 hover:border-emerald-500'
        : 'card-gradient-teal border-teal-200 hover:border-teal-500';
    case 'Residential Halls & Accommodation':
      return isEven
        ? 'card-gradient-gold border-gold-300/80 hover:border-gold-500'
        : 'card-gradient-parchment border-amber-300/70 hover:border-amber-500';
    case 'Research, ICT & Quality Cells':
      return isEven
        ? 'card-gradient-cerulean border-cerulean-200 hover:border-cerulean-500'
        : 'card-gradient-lapis border-lapis-200 hover:border-lapis-500';
  }
}
