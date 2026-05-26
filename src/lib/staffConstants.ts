import type { StaffPosition, StaffStatus } from "@/lib/api";

export const STAFF_POSITIONS: { value: StaffPosition; label: string }[] = [
  { value: "class_teacher", label: "Class teacher" },
  { value: "assistant_teacher", label: "Assistant teacher" },
  { value: "subject_teacher", label: "Subject teacher" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice principal" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
  { value: "other", label: "Other" },
];

export const STAFF_STATUSES: StaffStatus[] = ["Active", "Inactive", "Archived"];

export const STAFF_USER_TYPES = [
  "SuperAdmin",
  "Admin",
  "Staff",
  "Teacher",
] as const;

export function formatStaffPosition(position?: string | null): string {
  if (!position) return "—";
  const found = STAFF_POSITIONS.find((p) => p.value === position);
  if (found) return found.label;
  return position.replace(/_/g, " ");
}
