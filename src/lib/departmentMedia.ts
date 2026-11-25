import { isSafeMediaUrl } from './media';
import type { DepartmentRecord, FacultyName } from '../types/pust';

export const DEPARTMENT_COVER_IMAGES: Record<string, string> = {
  CSE: '/src/assets/images/dept_cse_1795634211313.jpg',
  EEE: '/src/assets/images/dept_eee_1795634212208.jpg',
  EECE: '/src/assets/images/dept_eece_1795634220248.jpg',
  ICE: '/src/assets/images/dept_ice_1795634212469.jpg',
  CE: '/src/assets/images/dept_ce_1795634213143.jpg',
  ARCH: '/src/assets/images/dept_arch_1795634213928.jpg',
  URP: '/src/assets/images/dept_urp_1795634214497.jpg',
  MATH: '/src/assets/images/dept_math_1795634215048.jpg',
  PHY: '/src/assets/images/dept_phy_1795634215377.jpg',
  PHAR: '/src/assets/images/dept_phar_1795634215619.jpg',
  CHEM: '/src/assets/images/dept_chem_1795634216575.jpg',
  SDS: '/src/assets/images/dept_sds_1795634216725.jpg',
  BBA: '/src/assets/images/dept_bba_1795634216380.jpg',
  THM: '/src/assets/images/dept_thm_1795634287718.jpg',
  ECON: '/src/assets/images/dept_econ_1795634305692.jpg',
  BNG: '/src/assets/images/dept_bng_1795634218182.jpg',
  SW: '/src/assets/images/dept_sw_1795634305727.jpg',
  ENG: '/src/assets/images/dept_eng_1795634306170.jpg',
  PA: '/src/assets/images/dept_pa_1795634220834.jpg',
  HIST: '/src/assets/images/dept_hist_1795634306252.jpg',
  GE: '/src/assets/images/dept_ge_1795634306560.jpg',
};

const FACULTY_DEFAULT_IMAGES: Record<FacultyName, string> = {
  'Faculty of Engineering and Technology': DEPARTMENT_COVER_IMAGES.CSE,
  'Faculty of Science': DEPARTMENT_COVER_IMAGES.CHEM,
  'Faculty of Business Studies': DEPARTMENT_COVER_IMAGES.BBA,
  'Faculty of Humanities and Social Science': DEPARTMENT_COVER_IMAGES.ENG,
  'Faculty of Life and Earth Science': DEPARTMENT_COVER_IMAGES.GE,
};

const KEYWORD_IMAGE_RULES: Array<[RegExp, string]> = [
  [/\b(computer|software|cyber|ai|informatics)\b/i, DEPARTMENT_COVER_IMAGES.CSE],
  [/\b(communication engineering|rf|telecommunication)\b/i, DEPARTMENT_COVER_IMAGES.EECE],
  [/\b(electrical|electronic|power)\b/i, DEPARTMENT_COVER_IMAGES.EEE],
  [/\b(information|network|fiber)\b/i, DEPARTMENT_COVER_IMAGES.ICE],
  [/\b(civil|structural|geotechnical)\b/i, DEPARTMENT_COVER_IMAGES.CE],
  [/\b(architecture|architectural)\b/i, DEPARTMENT_COVER_IMAGES.ARCH],
  [/\b(urban|regional|planning)\b/i, DEPARTMENT_COVER_IMAGES.URP],
  [/\b(math|mathematics|applied mathematics)\b/i, DEPARTMENT_COVER_IMAGES.MATH],
  [/\b(physics|photonics|optics)\b/i, DEPARTMENT_COVER_IMAGES.PHY],
  [/\b(pharmacy|pharmacology|pharmaceutical)\b/i, DEPARTMENT_COVER_IMAGES.PHAR],
  [/\b(chemistry|chemical|biochemistry)\b/i, DEPARTMENT_COVER_IMAGES.CHEM],
  [/\b(statistics|data science|analytics)\b/i, DEPARTMENT_COVER_IMAGES.SDS],
  [/\b(business|finance|accounting|marketing|management)\b/i, DEPARTMENT_COVER_IMAGES.BBA],
  [/\b(tourism|hospitality|hotel)\b/i, DEPARTMENT_COVER_IMAGES.THM],
  [/\b(economics|econometrics)\b/i, DEPARTMENT_COVER_IMAGES.ECON],
  [/\b(bangla|bengali)\b/i, DEPARTMENT_COVER_IMAGES.BNG],
  [/\b(social work|sociology|welfare)\b/i, DEPARTMENT_COVER_IMAGES.SW],
  [/\b(english|literature|linguistics)\b/i, DEPARTMENT_COVER_IMAGES.ENG],
  [/\b(public administration|governance|law|policy)\b/i, DEPARTMENT_COVER_IMAGES.PA],
  [/\b(history|heritage|archaeology)\b/i, DEPARTMENT_COVER_IMAGES.HIST],
  [/\b(geography|environment|earth|geology|climate)\b/i, DEPARTMENT_COVER_IMAGES.GE],
];

export function resolveDepartmentImage(
  dept: Pick<DepartmentRecord, 'code' | 'name' | 'faculty' | 'coverImageUrl'>
): string {
  const customUrl = dept.coverImageUrl?.trim();
  if (customUrl && isSafeMediaUrl(customUrl)) {
    return customUrl;
  }

  const normalizedCode = dept.code.trim().toUpperCase();
  if (DEPARTMENT_COVER_IMAGES[normalizedCode]) {
    return DEPARTMENT_COVER_IMAGES[normalizedCode];
  }

  for (const [pattern, imageUrl] of KEYWORD_IMAGE_RULES) {
    if (pattern.test(dept.name)) {
      return imageUrl;
    }
  }

  return FACULTY_DEFAULT_IMAGES[dept.faculty] || '/src/assets/images/pust_campus_hero_1795431408503.jpg';
}
