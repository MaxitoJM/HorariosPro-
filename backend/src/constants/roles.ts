export const ROLES = {
  ADMIN: "admin",
  PROFESOR: "profesor",
  ESTUDIANTE: "estudiante"
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ROLE_VALUES = [ROLES.ADMIN, ROLES.PROFESOR, ROLES.ESTUDIANTE] as const;
