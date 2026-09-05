import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Pulse — Understand where you're going",
  description:
    "Pulse brings knowledge, goals, learning, and growth into one intelligent workspace.",
};

// Blocking inline script, executed before hydration and before first paint.
// Without this, the theme can only be applied inside a useEffect in
// ThemeProvider, which runs after the initial (light-mode-by-default)
// paint — producing a visible flash of the wrong theme on every load for
// anyone who has dark mode selected. Reading localStorage synchronously
// here and setting the class immediately avoids that flash entirely.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('pulse-theme') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
