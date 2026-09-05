"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/news", label: "Discover" },
  { href: "/growth", label: "Growth" },
  { href: "/goals", label: "Goals" },
  { href: "/learning", label: "Learning" },
  { href: "/library", label: "Library" },
  { href: "/analytics", label: "Analytics" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 hover:bg-surface lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in lg:hidden" />
        <DialogPrimitive.Content
          className="fixed right-0 top-0 z-50 h-full w-72 border-l border-border bg-background p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:slide-in-from-right lg:hidden"
          aria-describedby={undefined}
        >
          <div className="mb-6 flex items-center justify-between">
            <DialogPrimitive.Title className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button type="button" aria-label="Close navigation menu" className="text-foreground/40 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  pathname === link.href ? "bg-surface text-foreground" : "text-foreground/60 hover:bg-surface hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
