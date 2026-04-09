import type { Timestamp } from "firebase-admin/firestore";

export function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      return (value as Timestamp).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}
