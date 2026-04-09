import type { SiteSettings } from "@/types/settings";

export const defaultSiteSettings: SiteSettings = {
  id: "site",
  title: "Blog",
  description: "A modern blog built with Next.js and Firebase.",
  logo: "",
  favicon: "",
  author: {
    name: "Author",
    email: "",
    bio: "",
    profilePicture: "",
  },
  contactRecipientEmail: "",
};

export function normalizeSettings(data: Record<string, unknown> | null | undefined): SiteSettings {
  if (!data) return defaultSiteSettings;
  const author = (data.author as Record<string, unknown> | undefined) ?? {};
  return {
    id: "site",
    title: String(data.title ?? defaultSiteSettings.title),
    description: String(data.description ?? defaultSiteSettings.description),
    logo: String(data.logo ?? ""),
    favicon: String(data.favicon ?? ""),
    author: {
      name: String(author.name ?? defaultSiteSettings.author.name),
      email: String(author.email ?? defaultSiteSettings.author.email),
      bio: String(author.bio ?? defaultSiteSettings.author.bio),
      profilePicture: String(author.profilePicture ?? defaultSiteSettings.author.profilePicture),
    },
    contactRecipientEmail: String(
      data.contactRecipientEmail ?? process.env.CONTACT_EMAIL ?? defaultSiteSettings.contactRecipientEmail,
    ),
  };
}
