"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/hooks/useTheme";

export function DarkModeToggle() {
  const { mode, toggle } = useTheme();
  return (
    <Button type="button" variant="ghost" onClick={toggle} aria-label="Toggle dark mode">
      {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
