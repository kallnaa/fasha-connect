import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ClayBlob, ClayButton, ClayCard, ClayChip } from "@/components/clay";
import logo from "@/assets/logo.svg";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

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

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (error) {
      console.error("Guest login error:", error);
      setError(
        `Failed to sign in as guest: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <ClayBlob className="-top-24 -right-20 size-96" color="bg-peach/45" />
        <ClayBlob className="-bottom-28 -left-24 size-[26rem]" color="bg-mint/40" />
        <ClayBlob className="top-1/4 -left-16 size-56" color="bg-sky/35" />
        <ClayBlob className="bottom-1/4 right-1/4 size-40" color="bg-butter/45" />
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
                    Enter your email and we'll send a one-time code — no
                    passwords to remember.
                  </p>
                </div>
                <form onSubmit={handleEmailSubmit} className="mt-7">
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                  Volunteering with an organization? Choose the organization
                  account type after signing in.
                </p>
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
                        Verify code <ArrowRight />
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
                    Use a different email
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

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={null}>
      <Auth {...props} />
    </Suspense>
  );
}
