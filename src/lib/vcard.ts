import type { DepartmentPersonRecord, DepartmentRecord } from '../types/pust';
import { sanitizeTelHref } from './departmentPeople';

export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function splitStructuredName(fullName: string): {
  prefix: string;
  first: string;
  middle: string;
  last: string;
} {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  const prefixes: string[] = [];

  while (
    tokens.length > 1 &&
    /^(Prof\.?|Professor|Dr\.?|Engr\.?|Md\.?|Mst\.?)$/i.test(tokens[0])
  ) {
    prefixes.push(tokens.shift()!);
  }

  if (tokens.length === 0) {
    return { prefix: '', first: fullName.trim(), middle: '', last: '' };
  }
  if (tokens.length === 1) {
    return { prefix: prefixes.join(' '), first: tokens[0], middle: '', last: '' };
  }

  const last = tokens.pop()!;
  const first = tokens.shift()!;
  const middle = tokens.join(' ');
  return {
    prefix: prefixes.join(' '),
    first,
    middle,
    last,
  };
}

export interface BuildPersonVCardOptions {
  person: DepartmentPersonRecord;
  department: Pick<DepartmentRecord, 'code' | 'name' | 'building'>;
  profileUrl: string;
  compact?: boolean;
}

export function buildPersonVCard({
  person,
  department,
  profileUrl,
  compact = false,
}: BuildPersonVCardOptions): string {
  const { prefix, first, middle, last } = splitStructuredName(person.name);
  const officeLocation = person.officeLocation?.trim() || `${department.building}, Rajapur Campus`;
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(person.name)}`,
    `N:${escapeVCardValue(last)};${escapeVCardValue(first)};${escapeVCardValue(middle)};${escapeVCardValue(prefix)};`,
    `ORG:${escapeVCardValue('Pabna University of Science and Technology (PUST)')};${escapeVCardValue(`Department of ${department.name}`)}`,
    `TITLE:${escapeVCardValue(person.designation)}`,
  ];

  const phonesToInclude = compact ? person.phones.slice(0, 2) : person.phones;
  for (const phone of phonesToInclude) {
    const cleanPhone = sanitizeTelHref(phone.value) || phone.value.trim();
    if (!cleanPhone) continue;
    const typeTag = phone.type === 'Personal' ? 'CELL' : 'WORK,VOICE';
    lines.push(`TEL;TYPE=${typeTag}:${cleanPhone}`);
  }

  const emailsToInclude = compact ? person.emails.slice(0, 2) : person.emails;
  for (const email of emailsToInclude) {
    const addr = email.value.trim();
    if (!addr) continue;
    const typeTag = email.type === 'Personal' ? 'INTERNET,HOME' : 'INTERNET,WORK';
    lines.push(`EMAIL;TYPE=${typeTag}:${addr}`);
  }

  lines.push(
    `ADR;TYPE=WORK:;;${escapeVCardValue(officeLocation)};Rajapur;Pabna;6600;Bangladesh`
  );

  if (profileUrl.trim()) {
    lines.push(`URL:${profileUrl.trim()}`);
  }

  if (!compact) {
    const noteParts: string[] = [];
    if (person.qualification?.trim()) {
      noteParts.push(`Qualification: ${person.qualification.trim()}`);
    }
    if (person.researchArea?.trim()) {
      noteParts.push(`Research Area: ${person.researchArea.trim()}`);
    }
    if (noteParts.length > 0) {
      lines.push(`NOTE:${escapeVCardValue(noteParts.join(' | '))}`);
    }
  }

  lines.push('END:VCARD');
  return lines.join(compact ? '\n' : '\r\n');
}

export function getVCardFilename(personName: string, departmentCode?: string): string {
  const slug = personName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const dept = departmentCode
    ? departmentCode
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 12)
    : 'pust';
  return `${slug || 'faculty'}-${dept || 'pust'}.vcf`;
}

export function downloadPersonVCard(options: BuildPersonVCardOptions): void {
  const vcard = buildPersonVCard({ ...options, compact: false });
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getVCardFilename(options.person.name, options.department.code);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
