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
          cardClass: 'card-gradient-gold border-slate-200 hover:border-gold-400',
          accentClass: 'text-gold-700',
        }
      : {
          cardClass: 'card-gradient-crimson border-slate-200 hover:border-pust-400',
          accentClass: 'text-pust-700',
        };
  }
  if (category === 'Academic Event') {
    return isEven
      ? {
          cardClass: 'card-gradient-lapis border-slate-200 hover:border-lapis-400',
          accentClass: 'text-lapis-600',
        }
      : {
          cardClass: 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400',
          accentClass: 'text-cerulean-700',
        };
  }
  if (category === 'Festival') {
    return isEven
      ? {
          cardClass: 'card-gradient-rose border-slate-200 hover:border-rose-400',
          accentClass: 'text-rose-700',
        }
      : {
          cardClass: 'card-gradient-gold border-slate-200 hover:border-gold-400',
          accentClass: 'text-gold-700',
        };
  }
  return isEven
    ? {
        cardClass: 'card-gradient-emerald border-slate-200 hover:border-emerald-400',
        accentClass: 'text-emerald-700',
      }
    : {
        cardClass: 'card-gradient-teal border-slate-200 hover:border-teal-400',
        accentClass: 'text-teal-700',
      };
}

export function getAlternatingDepartmentCardClass(facultyName: string, idx: number): string {
  const isEven = idx % 2 === 0;
  if (facultyName === 'Faculty of Engineering and Technology') {
    return isEven
      ? 'card-gradient-lapis border-slate-200 hover:border-lapis-400'
      : 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400';
  }
  if (facultyName === 'Faculty of Science') {
    return isEven
      ? 'card-gradient-emerald border-slate-200 hover:border-emerald-400'
      : 'card-gradient-teal border-slate-200 hover:border-teal-400';
  }
  if (facultyName === 'Faculty of Business Studies') {
    return isEven
      ? 'card-gradient-gold border-slate-200 hover:border-gold-400'
      : 'card-gradient-parchment border-slate-200 hover:border-amber-400';
  }
  if (facultyName === 'Faculty of Humanities and Social Science') {
    return isEven
      ? 'card-gradient-crimson border-slate-200 hover:border-pust-400'
      : 'card-gradient-gold border-slate-200 hover:border-gold-400';
  }
  return isEven
    ? 'card-gradient-sage border-slate-200 hover:border-sage-400'
    : 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400';
}

export function getAlternatingUnitCardClass(
  category: AdministrativeUnit['category'],
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  if (category === 'Statutory Governance') {
    return isEven
      ? 'card-gradient-crimson border-slate-200 hover:border-pust-400'
      : 'card-gradient-gold border-slate-200 hover:border-gold-400';
  }
  if (category === 'Administrative Office') {
    return isEven
      ? 'card-gradient-lapis border-slate-200 hover:border-lapis-400'
      : 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400';
  }
  return isEven
    ? 'card-gradient-emerald border-slate-200 hover:border-emerald-400'
    : 'card-gradient-teal border-slate-200 hover:border-teal-400';
}

export function getAlternatingOfficeCardClass(
  category: AdminOfficeCategory,
  occurrenceIdx: number
): string {
  const isEven = occurrenceIdx % 2 === 0;
  switch (category) {
    case 'Executive Leadership':
      return isEven
        ? 'card-gradient-crimson border-slate-200 hover:border-pust-400'
        : 'card-gradient-rose border-slate-200 hover:border-rose-400';
    case 'Administrative Sections & Offices':
      return isEven
        ? 'card-gradient-lapis border-slate-200 hover:border-lapis-400'
        : 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400';
    case 'Student Welfare & Campus Services':
      return isEven
        ? 'card-gradient-emerald border-slate-200 hover:border-emerald-400'
        : 'card-gradient-teal border-slate-200 hover:border-teal-400';
    case 'Residential Halls & Accommodation':
      return isEven
        ? 'card-gradient-gold border-slate-200 hover:border-gold-400'
        : 'card-gradient-parchment border-slate-200 hover:border-amber-400';
    case 'Research, ICT & Quality Cells':
      return isEven
        ? 'card-gradient-cerulean border-slate-200 hover:border-cerulean-400'
        : 'card-gradient-lapis border-slate-200 hover:border-lapis-400';
  }
}
