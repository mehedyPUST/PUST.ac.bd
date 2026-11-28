import type { AuthUser, RoleAssignment, UserRole } from '../types/pust';

export const ROLE_DISPLAY_LABELS: Record<UserRole, string> = {
  admin: 'University Admin Office',
  registrar: 'Office of the Registrar',
  vc: 'Vice-Chancellor Office',
  chairman: 'Department Chairman',
  teacher: 'Faculty / Teacher',
  student: 'Student Portal',
  proctor: 'Proctor Office',
  library: 'Central Library Office',
  hall: 'Residential Hall Provost',
  dean: 'Dean of Faculty',
  advisor: 'Student Advisor',
};

export interface RoleContextOption {
  key: string;
  role: UserRole;
  title: string;
  scopeLabel: string;
  departmentCode: string;
  hallAffiliation: string;
  officeCode?: string;
  officeName?: string;
  isPrimary: boolean;
  assignment?: RoleAssignment;
}

export function isRoleAssignmentInForce(a: RoleAssignment, now = Date.now()): boolean {
  if (a.status === 'ended') return false;
  const from = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
  if (!Number.isNaN(from) && from > now) return false;
  if (a.effectiveUntil) {
    const until = new Date(a.effectiveUntil).getTime();
    if (!Number.isNaN(until) && until < now) return false;
  }
  return a.status === 'active' || a.status === 'scheduled' || !a.status;
}

export function getAvailableRoleContexts(
  user: Pick<
    AuthUser,
    | 'role'
    | 'departmentCode'
    | 'hallAffiliation'
    | 'officeCode'
    | 'officeName'
    | 'designation'
    | 'additionalRoles'
    | 'primaryRole'
    | 'primaryDepartmentCode'
    | 'primaryHallAffiliation'
    | 'primaryOfficeCode'
    | 'primaryOfficeName'
    | 'primaryDesignation'
  >,
  now = Date.now()
): RoleContextOption[] {
  const baseRole = user.primaryRole ?? user.role;
  const baseDept = user.primaryDepartmentCode ?? user.departmentCode;
  const baseHall = user.primaryHallAffiliation ?? user.hallAffiliation;
  const baseOfficeCode = user.primaryOfficeCode ?? user.officeCode;
  const baseOfficeName = user.primaryOfficeName ?? user.officeName;

  const primaryOption: RoleContextOption = {
    key: 'primary',
    role: baseRole,
    title: ROLE_DISPLAY_LABELS[baseRole] || baseRole,
    scopeLabel: baseOfficeName || baseDept,
    departmentCode: baseDept,
    hallAffiliation: baseHall,
    officeCode: baseOfficeCode,
    officeName: baseOfficeName,
    isPrimary: true,
  };

  const options: RoleContextOption[] = [primaryOption];
  const seenKeys = new Set<string>(['primary']);

  for (const appt of user.additionalRoles || []) {
    if (!appt.id || seenKeys.has(appt.id) || !isRoleAssignmentInForce(appt, now)) {
      continue;
    }

    const scopedDept =
      appt.scopeType === 'department' && appt.scopeCode
        ? appt.scopeCode.trim().toUpperCase()
        : baseDept;
    const scopedHall =
      appt.scopeType === 'hall'
        ? appt.scopeName?.trim() || appt.scopeCode?.trim() || baseHall
        : baseHall;
    const scopedOfficeCode =
      appt.scopeType === 'office' && appt.scopeCode
        ? appt.scopeCode.trim()
        : baseOfficeCode;
    const scopedOfficeName =
      appt.scopeType === 'office' && appt.scopeName
        ? appt.scopeName.trim()
        : baseOfficeName;

    const sameAsPrimary =
      appt.role === baseRole &&
      scopedDept.toUpperCase() === baseDept.toUpperCase() &&
      scopedHall === baseHall &&
      (appt.scopeType !== 'office' || scopedOfficeCode === baseOfficeCode);

    if (sameAsPrimary) {
      continue;
    }

    seenKeys.add(appt.id);
    options.push({
      key: appt.id,
      role: appt.role,
      title: appt.title?.trim() || ROLE_DISPLAY_LABELS[appt.role] || appt.role,
      scopeLabel:
        appt.scopeName?.trim() ||
        appt.scopeCode?.trim() ||
        (appt.scopeType === 'university' ? 'University-wide' : scopedDept),
      departmentCode: scopedDept,
      hallAffiliation: scopedHall,
      officeCode: scopedOfficeCode,
      officeName: scopedOfficeName,
      isPrimary: false,
      assignment: appt,
    });
  }

  return options;
}

export function resolveActiveUserIdentity<T extends AuthUser>(
  liveUser: T,
  requestedKey?: string | null,
  now = Date.now()
): T {
  const baseRole = liveUser.primaryRole ?? liveUser.role;
  const baseDept = liveUser.primaryDepartmentCode ?? liveUser.departmentCode;
  const baseHall = liveUser.primaryHallAffiliation ?? liveUser.hallAffiliation;
  const baseOfficeCode = liveUser.primaryOfficeCode ?? liveUser.officeCode;
  const baseOfficeName = liveUser.primaryOfficeName ?? liveUser.officeName;
  const baseDesignation = liveUser.primaryDesignation ?? liveUser.designation;

  const contexts = getAvailableRoleContexts(liveUser, now);
  const selected =
    requestedKey && requestedKey !== 'primary'
      ? contexts.find((c) => !c.isPrimary && c.key === requestedKey)
      : undefined;

  const primaryMeta = {
    primaryRole: baseRole,
    primaryDepartmentCode: baseDept,
    primaryHallAffiliation: baseHall,
    ...(baseOfficeCode ? { primaryOfficeCode: baseOfficeCode } : {}),
    ...(baseOfficeName ? { primaryOfficeName: baseOfficeName } : {}),
    ...(baseDesignation ? { primaryDesignation: baseDesignation } : {}),
  };

  if (!selected) {
    return {
      ...liveUser,
      role: baseRole,
      departmentCode: baseDept,
      hallAffiliation: baseHall,
      ...(baseOfficeCode ? { officeCode: baseOfficeCode } : {}),
      ...(baseOfficeName ? { officeName: baseOfficeName } : {}),
      ...(baseDesignation ? { designation: baseDesignation } : {}),
      ...primaryMeta,
      activeRoleKey: 'primary',
    };
  }

  return {
    ...liveUser,
    role: selected.role,
    departmentCode: selected.departmentCode,
    hallAffiliation: selected.hallAffiliation,
    ...(selected.officeCode ? { officeCode: selected.officeCode } : {}),
    ...(selected.officeName ? { officeName: selected.officeName } : {}),
    designation: selected.title,
    ...primaryMeta,
    activeRoleKey: selected.key,
  };
}
