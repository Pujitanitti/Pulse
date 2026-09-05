import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";
import { LogoutButton } from "@/components/logout-button";
import { GlobalSearch } from "@/components/search/global-search";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { DesktopNav } from "@/components/desktop-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only fixed left-2 top-2 z-[60] rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-10">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Pulse
          </Link>
          <DesktopNav />
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <ThemeToggle />
          <div className="hidden items-center gap-3 text-sm sm:flex">
            <span className="text-foreground/60">{user.name}</span>
            <LogoutButton />
          </div>
          <MobileNav />
        </div>
      </header>
      <main id="main-content" className="px-6 py-10 sm:px-10">
        {children}
      </main>
    </div>
  );
}
