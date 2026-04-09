"use client";

import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/admin/RequireAuth";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  return <RequireAuth>{children}</RequireAuth>;
}
