import type { NoticeBoardScope, StudentRecord, UserRole } from '../types/pust';

export interface StudentRecordUpdateInput {
  chairmanNotes?: string;
  adminNotes?: string;
  disciplinaryStatus?: StudentRecord['disciplinaryStatus'];
  disciplinaryNotes?: string;
}

export interface StudentRecordPatchResult {
  ok: boolean;
  patch?: Partial<Pick<StudentRecord, 'chairmanNotes' | 'adminNotes' | 'disciplinaryStatus' | 'disciplinaryNotes'>>;
  error?: string;
}

export function buildStudentRecordPatch(
  role: UserRole,
  input: StudentRecordUpdateInput
): StudentRecordPatchResult {
  const patch: Partial<
    Pick<StudentRecord, 'chairmanNotes' | 'adminNotes' | 'disciplinaryStatus' | 'disciplinaryNotes'>
  > = {};

  if ((role === 'chairman' || role === 'admin') && input.chairmanNotes !== undefined) {
    patch.chairmanNotes = input.chairmanNotes;
  }
  if (role === 'admin' && input.adminNotes !== undefined) {
    patch.adminNotes = input.adminNotes;
  }
  if (role === 'proctor' || role === 'admin') {
    if (input.disciplinaryStatus !== undefined) {
      patch.disciplinaryStatus = input.disciplinaryStatus;
    }
    if (input.disciplinaryNotes !== undefined) {
      patch.disciplinaryNotes = input.disciplinaryNotes;
    }
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Provide at least one permitted field to update.' };
  }

  return { ok: true, patch };
}

export function normalizeClearablePatch<
  T extends Record<string, unknown>,
  K extends keyof T
>(input: T, clearableKeys: readonly K[]): Record<string, unknown> {
  const clearableSet = new Set<string>(clearableKeys as readonly string[]);
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (clearableSet.has(key)) {
      if (value === null || (typeof value === 'string' && value.trim() === '')) {
        out[key] = undefined;
      } else {
        out[key] = value;
      }
    } else if (value !== undefined) {
      out[key] = value;
    }
  }

  return out;
}

export function toNullableClearable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function canClearCourseNoticeTarget(
  existingScope: NoticeBoardScope,
  nextScope: NoticeBoardScope | undefined,
  nextTargetCourseCode: string | null | undefined
): boolean {
  const effectiveScope = nextScope ?? existingScope;
  if (effectiveScope === 'course' && nextTargetCourseCode !== undefined) {
    return Boolean(typeof nextTargetCourseCode === 'string' && nextTargetCourseCode.trim());
  }
  return true;
}
