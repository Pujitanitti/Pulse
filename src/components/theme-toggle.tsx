"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const CYCLE = ["light", "dark", "system"] as const;
const ICON = { light: Sun, dark: Moon, system: Monitor };
const LABEL = { light: "Light theme", dark: "Dark theme", system: "System theme" };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = ICON[theme];

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length] ?? "light";
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[theme]}. Click to change.`}
      title={LABEL[theme]}
      className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/60 hover:bg-surface hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
