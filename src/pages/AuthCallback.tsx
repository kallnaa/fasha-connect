import { useMutation } from "convex/react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { ClayCard } from "@/components/clay";
import { GOOGLE_ROLE_STORAGE_KEY } from "@/lib/constants";
import logo from "@/assets/logo.svg";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

function safeReturnTo(returnTo: string | null): string | null {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return null;
}

/**
 * OAuth return landing page. Convex Auth's callback on the Convex deployment
 * redirects here with a short-lived ?code= that the auth provider exchanges
 * for a session automatically. Once the session is live this page routes the
 * user to their destination; on failure it bounces back to /auth with an
 * error message.
 */
export default function AuthCallback() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const setInitialRole = useMutation(api.profiles.setInitialRole);
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  // Realtime providers surface errors on this page's URL (e.g. ?error=...)
  const oauthError = searchParams.get("error");

  const [timedOut, setTimedOut] = useState(false);
  const routedRef = useRef(false);
  const rolePersistedRef = useRef(false);

  useEffect(() => {
    if (authLoading || routedRef.current) return;

    if (oauthError) {
      routedRef.current = true;
      const params = new URLSearchParams({ error: oauthError });
      const back = returnTo ? `/auth?${params}&returnTo=${encodeURIComponent(returnTo)}` : `/auth?${params}`;
      navigate(back, { replace: true });
      return;
    }

    if (!isAuthenticated) return; // still exchanging the code
    if (user === undefined) return; // user row still loading

    const route = (role?: "volunteer" | "organization" | null, justSignedUp = false) => {
      routedRef.current = true;
      if (role === "organization") {
        navigate("/org", { replace: true });
      } else if (role === "volunteer" && justSignedUp && !user?.onboardedAt) {
        // Brand-new volunteers complete the matching survey once.
        navigate(
          returnTo
            ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
            : "/onboarding",
          { replace: true },
        );
      } else {
        navigate(returnTo ?? "/dashboard", { replace: true });
      }
    };

    // First Google sign-in: persist the role picked before the redirect so
    // routing (and the whole product experience) matches the choice.
    const storedRole = (() => {
      try {
        return sessionStorage.getItem(GOOGLE_ROLE_STORAGE_KEY);
      } catch {
        return null;
      }
    })();
    const pickedRole =
      storedRole === "volunteer" || storedRole === "organization"
        ? (storedRole as "volunteer" | "organization")
        : null;
    if (pickedRole) {
      try {
        sessionStorage.removeItem(GOOGLE_ROLE_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    if (user && !user.accountType && pickedRole && !rolePersistedRef.current) {
      rolePersistedRef.current = true;
      setInitialRole({ accountType: pickedRole })
        .then(({ isNew }) => route(pickedRole, isNew))
        .catch(() => {
          // Role conflict or transient error — route by what we know.
          route(user.accountType ?? null);
        });
      return;
    }

    route(user?.accountType ?? null);
  }, [authLoading, isAuthenticated, user, oauthError, returnTo, navigate, setInitialRole]);

  // If the exchange never completes (e.g. the user cancelled in a way that
  // didn't produce an error param), send them back with a friendly message.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 15_000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!timedOut || routedRef.current) return;
    routedRef.current = true;
    const params = new URLSearchParams({
      error: "Google sign-in didn't complete in time. Please try again.",
    });
    navigate(`/auth?${params}`, { replace: true });
  }, [timedOut, navigate]);

  if (oauthError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <ClayCard className="max-w-md p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-rose-50">
            <AlertCircle className="size-6 text-rose-600" />
          </span>
          <h1 className="mt-4 font-display text-xl font-extrabold">
            Google sign-in was cancelled
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{oauthError}</p>
          <Link
            to="/auth"
            className="clay-button mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-2.5 font-display font-bold text-primary-foreground hover:bg-primary/95"
          >
            Back to sign in
          </Link>
        </ClayCard>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img src={logo} alt="Fasha" className="size-14 rounded-2xl clay-shadow-sm" />
      <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Signing you in with Google…
      </p>
    </main>
  );
}
