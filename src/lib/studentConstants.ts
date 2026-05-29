/** Matches backend StudentStatus enum */
export const STUDENT_STATUSES = [
  "Active",
  "Inactive",
  "Graduated",
  "Transferred",
  "Suspended",
  "Archived",
] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];
