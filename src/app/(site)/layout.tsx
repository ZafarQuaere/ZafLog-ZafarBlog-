import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSiteSettingsServer } from "@/lib/posts-server";
import { normalizeSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const raw = await getSiteSettingsServer();
  const settings = normalizeSettings(raw);
  return {
    title: {
      default: settings.title,
      template: `%s | ${settings.title}`,
    },
    description: settings.description,
    icons: settings.favicon ? { icon: settings.favicon } : undefined,
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const raw = await getSiteSettingsServer();
  const settings = normalizeSettings(raw);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader settings={settings} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
