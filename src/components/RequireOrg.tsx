import { useAuth } from "@/hooks/use-auth";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { ClayButton, ClayCard } from "@/components/clay";

/** Guards org routes: volunteers are redirected to their dashboard. */
export function RequireOrg({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-10 animate-pulse rounded-2xl bg-primary/60" />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (user && user.accountType !== "organization") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <ClayCard className="max-w-md p-10 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-sky">
            <Building2 className="size-7 text-sky-900" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-extrabold">Organizations only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is for organization accounts. Switch your account type to
            Organization in your profile to post opportunities and manage
            applicants.
          </p>
          <ClayButton asChild className="mt-6">
            <Link to="/profile">Open my profile</Link>
          </ClayButton>
        </ClayCard>
      </main>
    );
  }

  return children;
}
