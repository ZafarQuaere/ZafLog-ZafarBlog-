import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("h-8 w-8 animate-spin text-zinc-500", className)} aria-hidden />;
}
