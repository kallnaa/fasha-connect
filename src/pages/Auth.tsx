import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { GoogleIcon } from "@/components/GoogleIcon";
import {
  EXISTING_USER_CUTOFF,
  GOOGLE_ROLE_STORAGE_KEY,
} from "@/lib/constants";
import logo from "@/assets/logo.svg";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  HeartHandshake,
  Loader2,
  Mail,
  UserX,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

type Role = "volunteer" | "organization";

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const redirect = resolveRedirectAfterAuth(returnTo, redirectAfterAuth);
  const setInitialRole = useSetInitialRoleMutation();
  const authConfig = useQuery(api.meta.authConfig, {});

  // Role can arrive preselected from landing CTAs (?role=organization)
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState<Role | null>(
    roleParam === "organization" || roleParam === "volunteer" ? roleParam : null,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [googleLoading, setGoogleLoading] = useState(false);

  /** While a just-chosen role is being persisted, the explicit navigate in the
   *  submit handler owns routing; the effect below stays out of the way. */
  const pendingRole = useRef<Role | null>(null);

  /** True for accounts created before the survey rollout — they never see it. */
  const isNewAccount =
    user === undefined ? false : (user?._creationTime ?? 0) > EXISTING_USER_CUTOFF;

  /**
   * Single source of truth for post-auth routing. Runs whenever auth state or
   * the user document changes — including right after email OTP / guest sign-in
   * — so new and returning users both land in the right experience:
   *   organization             → /org (org console + org navigation)
   *   volunteer, existing acct → returnTo or /dashboard (survey never shown)
   *   volunteer, brand-new     → /onboarding once (matching survey)
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (user === undefined) return; // user row still loading
    if (pendingRole.current) return; // submit handler is routing explicitly

    if (user?.accountType === "organization") {
      navigate("/org", { replace: true });
    } else if (user?.accountType === "volunteer") {
      if (user.onboardedAt || !isNewAccount) {
        navigate(redirect, { replace: true });
      } else {
        navigate(
          returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
            : "/onboarding",
          { replace: true },
        );
      }
    } else {
      // No role stored yet — guests route into the volunteer experience.
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate, redirect, returnTo, isNewAccount]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** Where each role lands immediately after sign-up. Only brand-new
   *  volunteer accounts are routed into the matching survey. */
  const destinationForRole = (r: Role) => {
    if (r === "organization") return "/org";
    return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}`
      : "/onboarding";
  };

  const persistRole = async () => {
    const effective: Role = role ?? "volunteer";
    pendingRole.current = effective;
    try {
      const { isNew } = await setInitialRole({ accountType: effective });
      if (effective === "organization") {
        navigate("/org", { replace: true });
        return;
      }
      // Volunteers: returning accounts go straight to their destination;
      // only accounts created by this very sign-in see the matching survey.
      navigate(isNew ? destinationForRole("volunteer") : redirect, {
        replace: true,
      });
    } catch {
      // Existing accounts keep their stored role — route by that instead.
      pendingRole.current = null;
      if (user?.accountType === "organization") {
        navigate("/org", { replace: true });
      } else if (user?.accountType === "volunteer") {
        const isReturning = user.onboardedAt || !isNewAccount;
        navigate(isReturning ? redirect : destinationForRole("volunteer"), {
          replace: true,
        });
      } else {
        navigate(destinationForRole(effective), { replace: true });
      }
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      // Role is stored immediately; the routing effect above performs the redirect.
      await persistRole();
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setOtp("");
      setIsLoading(false);
    }
  };

  /**
   * Google OAuth: persists the picked role so it survives the redirect to
   * Google and back, then hands off to Convex Auth's OAuth flow. On success
   * the browser lands back on /auth/callback which exchanges the code and
   * routes the user to their role's destination.
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const effective: Role = role ?? "volunteer";
    try {
      sessionStorage.setItem(GOOGLE_ROLE_STORAGE_KEY, effective);
    } catch {
      // Private browsing — role will be picked from the URL param instead.
    }
    try {
      const callbackPath = returnTo
        ? `/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
        : `/auth/callback`;
      await signIn("google", { redirectTo: callbackPath });
      // Browser is navigating away to Google; keep the spinner visible.
    } catch (e) {
      setGoogleLoading(false);
      setError(
        e instanceof Error
          ? `Google sign-in failed: ${e.message}`
          : "Could not start Google sign-in. Please try again.",
      );
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      // Guests default to the volunteer experience unless they picked Organization
      await persistRole();
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  const isOrg = role === "organization";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="clay-blob absolute -top-32 -left-32 size-[28rem] bg-teal-200/50" />
        <div className="clay-blob absolute -bottom-32 -right-32 size-[28rem] bg-rose-200/50" />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Fasha" className="size-12 rounded-2xl clay-shadow-sm" />
              <span className="font-display text-2xl font-extrabold tracking-tight">Fasha</span>
            </Link>
          </div>

          <ClayCard className="p-8">
            {step === "signIn" ? (
              <>
                <div className="text-center">
                  <ClayChip className="bg-teal-50 px-4 py-1.5 text-sm font-bold text-teal-800">
                    🇷🇼 Karibu! Welcome
                  </ClayChip>
                  <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
                    Sign in or create account
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Choose your account type, then sign in — no passwords to
                    remember.
                  </p>
                </div>

                {/* Role is stated right here — no separate step afterwards. */}
                <div className="mt-6 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                  <button
                    type="button"
                    onClick={() => setRole("volunteer")}
                    aria-pressed={role === "volunteer" || role === null}
                    className={`clay-press rounded-2xl border-2 p-3 text-left transition-colors ${
                      !isOrg
                        ? "border-primary bg-teal-50"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${!isOrg ? "bg-primary/15" : "bg-secondary"}`}>
                        <HeartHandshake className={`size-4 ${!isOrg ? "text-primary" : "text-muted-foreground"}`} />
                      </span>
                      <span className="font-display text-sm font-extrabold">Volunteer</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("organization")}
                    aria-pressed={isOrg}
                    className={`clay-press rounded-2xl border-2 p-3 text-left transition-colors ${
                      isOrg
                        ? "border-rose-500 bg-rose-50"
                        : "border-border bg-card hover:border-rose-400/40"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${isOrg ? "bg-rose-500/15" : "bg-secondary"}`}>
                        <Building2 className={`size-4 ${isOrg ? "text-rose-600" : "text-muted-foreground"}`} />
                      </span>
                      <span className="font-display text-sm font-extrabold">Organization</span>
                    </span>
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {isOrg
                    ? "You'll land straight in your organization console."
                    : "Volunteers get a 1-minute setup to personalize their matches."}
                </p>

                <form onSubmit={handleEmailSubmit} className="mt-5">
                  {/** Google first — the fastest path in (shown once OAuth is configured). */}
                  {authConfig?.googleEnabled && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || googleLoading}
                        className="w-full rounded-2xl border-2 border-border bg-card font-display text-[15px] font-bold text-foreground shadow-xs hover:bg-secondary/60"
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="animate-spin" /> Redirecting to Google…
                          </>
                        ) : (
                          <>
                            <GoogleIcon /> Continue with Google
                          </>
                        )}
                      </Button>

                      <div className="mt-5 flex items-center gap-3">
                        <span className="h-0.5 flex-1 rounded-full bg-border" />
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          or
                        </span>
                        <span className="h-0.5 flex-1 rounded-full bg-border" />
                      </div>
                    </>
                  )}

                  <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Email address
                  </label>
                  <div className="clay-input mt-1.5 flex items-center gap-2 rounded-2xl px-4">
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      className="clay-input border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

                  <ClayButton type="submit" className="mt-6 w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" /> Sending code…
                      </>
                    ) : (
                      <>
                        Continue with email <ArrowRight />
                      </>
                    )}
                  </ClayButton>
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <span className="h-0.5 flex-1 rounded-full bg-border" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    or
                  </span>
                  <span className="h-0.5 flex-1 rounded-full bg-border" />
                </div>

                <Button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="clay-button mt-6 w-full rounded-2xl bg-secondary font-display font-bold text-secondary-foreground hover:bg-secondary/80"
                >
                  <UserX />
                  Continue as guest
                </Button>
              </>
            ) : (
              <>
                <div className="text-center">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-teal-50">
                    <Mail className="size-6 text-primary" />
                  </span>
                  <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
                    Check your inbox
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-foreground">{step.email}</span>
                  </p>
                </div>
                <form onSubmit={handleOtpSubmit} className="mt-7">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          form?.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-3 text-center text-sm text-destructive">{error}</p>
                  )}
                  <ClayButton
                    type="submit"
                    className="mt-6 w-full"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" /> Verifying…
                      </>
                    ) : (
                      <>
                        Verify code <Check />
                      </>
                    )}
                  </ClayButton>
                </form>
                <div className="mt-5 text-center">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-bold text-primary"
                    onClick={() => {
                      setStep("signIn");
                      setOtp("");
                      setError(null);
                    }}
                  >
                    <ArrowLeft className="size-4" /> Use a different email
                  </Button>
                </div>
              </>
            )}
          </ClayCard>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to volunteer kindly. 🤝
          </p>
        </div>
      </div>
    </div>
  );
}

function useSetInitialRoleMutation() {
  return useMutation(api.profiles.setInitialRole);
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={null}>
      <Auth {...props} />
    </Suspense>
  );
}
