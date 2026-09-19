import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * App-wide theme context: "light" | "dark" | "system" (default).
 * The choice is persisted in localStorage and "system" follows the OS
 * prefers-color-scheme setting live. next-themes injects a tiny blocking
 * script so the correct theme is applied before first paint (no flash).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
    >
      {children}
    </NextThemesProvider>
  );
}

/** Subtle Sun/Moon toggle. Clicking sets the explicit opposite of the
 *  currently *resolved* theme (so it does the right thing in system mode). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering the wrong icon before the theme is known on the client.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={() => {
        // Briefly enable a smooth color transition so the switch eases in
        // instead of flashing, then let the platform's own transitions work.
        document.body.classList.add("theme-transitioning");
        window.setTimeout(() => document.body.classList.remove("theme-transitioning"), 350);
        setTheme(isDark ? "light" : "dark");
      }}
      className={
        className ??
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
      }
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
