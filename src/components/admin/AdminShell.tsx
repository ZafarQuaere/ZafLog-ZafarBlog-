"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") {
    return <div className="min-h-screen">{children}</div>;
  }
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
