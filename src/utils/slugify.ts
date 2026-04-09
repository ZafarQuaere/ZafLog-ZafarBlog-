import slugifyLib from "slugify";

export function slugifyTitle(title: string): string {
  return slugifyLib(title, { lower: true, strict: true, trim: true });
}
