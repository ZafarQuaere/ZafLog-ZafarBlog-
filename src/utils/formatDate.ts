import { format, formatDistanceToNow } from "date-fns";

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "";
  }
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}
