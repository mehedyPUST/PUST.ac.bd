import { isSafeMediaUrl } from './media';
import type { DepartmentRecord, FacultyName } from '../types/pust';

export const DEPARTMENT_COVER_IMAGES: Record<string, string> = {
  CSE: '/src/assets/images/dept_cse_iconic_1795635344452.jpg',
  EEE: '/src/assets/images/dept_eee_iconic_1795635344649.jpg',
  EECE: '/src/assets/images/dept_eece_iconic_1795635345509.jpg',
  ICE: '/src/assets/images/dept_ice_iconic_1795635345342.jpg',
  CE: '/src/assets/images/dept_ce_iconic_1795635346492.jpg',
  ARCH: '/src/assets/images/dept_arch_iconic_1795635346777.jpg',
  URP: '/src/assets/images/dept_urp_iconic_1795635347815.jpg',
  MATH: '/src/assets/images/dept_math_iconic_1795635347781.jpg',
  PHY: '/src/assets/images/dept_phy_iconic_1795635348266.jpg',
  PHAR: '/src/assets/images/dept_phar_iconic_1795635348367.jpg',
  CHEM: '/src/assets/images/dept_chem_iconic_1795635431534.jpg',
  SDS: '/src/assets/images/dept_sds_iconic_1795635431851.jpg',
  BBA: '/src/assets/images/dept_bba_iconic_1795635432912.jpg',
  THM: '/src/assets/images/dept_thm_iconic_1795635433463.jpg',
  ECON: '/src/assets/images/dept_econ_iconic_1795635434043.jpg',
  BNG: '/src/assets/images/dept_bng_iconic_1795635434515.jpg',
  SW: '/src/assets/images/dept_sw_iconic_1795635435097.jpg',
  ENG: '/src/assets/images/dept_eng_iconic_1795635435216.jpg',
  PA: '/src/assets/images/dept_pa_iconic_1795635435541.jpg',
  HIST: '/src/assets/images/dept_hist_iconic_1795635436698.jpg',
  GE: '/src/assets/images/dept_ge_iconic_1795635518051.jpg',
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
