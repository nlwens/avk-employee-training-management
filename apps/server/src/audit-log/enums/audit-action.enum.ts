export enum AuditAction {
  // Database actions.
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',

  // Custom actions.
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
}
