// Shared constants safe to import from edge middleware (no server-only deps).
export const SESSION_COOKIE = "osf_session";
export const SESSION_MAX_AGE_DAYS = 30;
/** "Remember me" unchecked → short-lived session (hours, not days). */
export const SESSION_MAX_AGE_HOURS = 2;
