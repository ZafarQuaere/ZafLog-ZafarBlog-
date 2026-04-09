import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { NotFoundContent } from "@/components/layout/NotFoundContent";
import { getSiteSettingsServer } from "@/lib/posts-server";
import { normalizeSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Unmatched URLs outside nested layouts — includes full site chrome. */
export default async function NotFound() {
  const raw = await getSiteSettingsServer();
  const settings = normalizeSettings(raw);

  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader settings={settings} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 text-foreground">
        <NotFoundContent />
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
