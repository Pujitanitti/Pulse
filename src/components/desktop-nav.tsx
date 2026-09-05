"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Newspaper, TrendingUp, Target, GraduationCap, BookMarked, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "Discover", icon: Newspaper },
  { href: "/growth", label: "Growth", icon: TrendingUp },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/learning", label: "Learning", icon: GraduationCap },
  { href: "/library", label: "Library", icon: BookMarked },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function DesktopNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>('[data-active="true"]');
    if (activeEl) {
      setIndicator({ left: activeEl.offsetLeft, width: activeEl.offsetWidth });
    } else {
      setIndicator(null);
    }
  }, [pathname]);

  return (
    <nav ref={containerRef} className="relative hidden gap-1 lg:flex">
      {indicator && (
        <div
          className="absolute bottom-0 h-8 rounded-md bg-surface transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            data-active={isActive}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "text-foreground" : "text-foreground/55 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
