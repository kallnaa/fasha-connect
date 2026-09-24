import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Check, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Shared click handler that eases the theme switch in with a short transition. */
function useThemeTransition() {
  return () => {
    document.body.classList.add("theme-transitioning");
    window.setTimeout(() => document.body.classList.remove("theme-transitioning"), 350);
  };
}

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
  const runTransition = useThemeTransition();

  // Avoid rendering the wrong icon before the theme is known on the client.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
      onClick={() => {
        runTransition();
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

/** Labeled menu row (Light mode / Dark mode) for dropdowns — shows a check
 *  mark on the active option and switches with one click. */
export function ThemeMenuRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const runTransition = useThemeTransition();

  return (
    <div className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold">
      <Sun
        className={cn(
          "size-4 shrink-0",
          mounted && !isDark ? "text-foreground" : "text-muted-foreground/60",
        )}
      />
      <button
        type="button"
        onClick={() => {
          runTransition();
          setTheme("light");
        }}
        className="flex-1 text-left transition-colors hover:text-foreground"
      >
        Light mode
      </button>
      <Moon
        className={cn(
          "ml-2 size-4 shrink-0",
          mounted && isDark ? "text-foreground" : "text-muted-foreground/60",
        )}
      />
      <button
        type="button"
        onClick={() => {
          runTransition();
          setTheme("dark");
        }}
        className="flex-1 text-left transition-colors hover:text-foreground"
      >
        Dark mode
      </button>
      {mounted && (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          title={isDark ? "Dark mode is on" : "Light mode is on"}
        >
          <Check className="size-3" />
        </span>
      )}
    </div>
  );
}
