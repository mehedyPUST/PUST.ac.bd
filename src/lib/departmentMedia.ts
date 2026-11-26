import { isSafeMediaUrl } from './media';
import type { DepartmentRecord, FacultyName } from '../types/pust';

export const DEPARTMENT_COVER_IMAGES: Record<string, string> = {
  CSE: 'https://i.ibb.co.com/xKJHHnfs/dept-cse-iconic-1795635344452.jpg',
  EEE: 'https://i.ibb.co.com/Hf4MdP7W/dept-eee-iconic-1795635344649.jpg',
  EECE: 'https://i.ibb.co.com/zT81t6vH/dept-eece-iconic-1795635345509.jpg',
  ICE: 'https://i.ibb.co.com/TxP0wRT6/dept-ice-iconic-1795635345342.jpg',
  CE: 'https://i.ibb.co.com/JWs8LGNL/dept-ce-iconic-1795635346492.jpg',
  ARCH: 'https://i.ibb.co.com/5Xb2GTr2/dept-arch-iconic-1795635346777.jpg',
  URP: 'https://i.ibb.co.com/TxjrpHWn/dept-urp-iconic-1795635347815.jpg',
  MATH: 'https://i.ibb.co.com/fz9VjGdr/dept-math-iconic-1795635347781.jpg',
  PHY: 'https://i.ibb.co.com/kg5JBCmW/dept-phy-iconic-1795635348266.jpg',
  PHAR: 'https://i.ibb.co.com/ghf5Qs0/dept-phar-iconic-1795635348367.jpg',
  CHEM: 'https://i.ibb.co.com/whwhB0YC/dept-chem-iconic-1795635431534.jpg',
  SDS: 'https://i.ibb.co.com/DH1hqSrL/dept-sds-iconic-1795635431851.jpg',
  BBA: 'https://i.ibb.co.com/Z1m3KkT0/dept-bba-iconic-1795635432912.jpg',
  THM: 'https://i.ibb.co.com/ppk4gMn/dept-thm-iconic-1795635433463.jpg',
  ECON: 'https://i.ibb.co.com/BKPvZCfY/dept-econ-iconic-1795635434043.jpg',
  BNG: 'https://i.ibb.co.com/prPsyXHg/dept-bng-iconic-1795635434515.jpg',
  SW: 'https://i.ibb.co.com/XRpTH5D/dept-sw-iconic-1795635435097.jpg',
  ENG: 'https://i.ibb.co.com/mCs8FrQc/dept-eng-iconic-1795635435216.jpg',
  PA: 'https://i.ibb.co.com/qFBxtT4y/dept-pa-iconic-1795635435541.jpg',
  HIST: 'https://i.ibb.co.com/kg1VnDTw/dept-hist-iconic-1795635436698.jpg',
  GE: 'https://i.ibb.co.com/QvZGDhWH/dept-ge-iconic-1795635518051.jpg',
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
