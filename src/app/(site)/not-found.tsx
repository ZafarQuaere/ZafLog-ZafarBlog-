import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Rendered when `notFound()` is called from routes under `(site)` — layout already provides header/footer. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
