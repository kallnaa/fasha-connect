import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Shared category → pastel clay color mapping. */
export const CATEGORY_COLORS: Record<string, string> = {
  Education: "bg-butter/70",
  Health: "bg-peach/70",
  Environment: "bg-mint/70",
  Community: "bg-lilac/70",
  Agriculture: "bg-mint/50",
  Technology: "bg-sky/70",
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "bg-secondary";
}

/** Inflated clay card. */
export function ClayCard({
  className,
  children,
  interactive = false,
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "clay-surface text-card-foreground",
        interactive && "clay-press",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Plush pill chip. */
export function ClayChip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "clay-chip inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold",
        "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Soft decorative pastel blob. */
export function ClayBlob({
  className,
  color = "bg-peach/60",
}: {
  className?: string;
  color?: string;
}) {
  return <div aria-hidden className={cn("clay-blob pointer-events-none absolute", color, className)} />;
}

/** Primary clay CTA button (wraps shadcn Button). */
export function ClayButton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn(
        "clay-button font-display font-bold",
        variant === "default" &&
          "bg-primary text-primary-foreground hover:bg-primary/95",
        variant === "outline" &&
          "bg-secondary text-secondary-foreground hover:bg-accent",
        className,
      )}
      {...props}
    />
  );
}

/** Status badge colors for applications. */
export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-butter/70 text-[#6b4e12]",
  accepted: "bg-mint/70 text-[#22503a]",
  declined: "bg-peach/70 text-[#7c2d12]",
  open: "bg-mint/70 text-[#22503a]",
  closed: "bg-peach/70 text-[#7c2d12]",
  filled: "bg-sky/70 text-[#1e3a52]",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <ClayChip className={STATUS_STYLES[status] ?? "bg-secondary"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </ClayChip>
  );
}

/** Org applicant pipeline stage chip colors (New → Reviewing → Shortlisted → Accepted/Rejected). */
export const STAGE_STYLES: Record<string, string> = {
  new: "bg-butter/70 text-[#6b4e12]",
  reviewing: "bg-sky/70 text-[#1e3a52]",
  shortlisted: "bg-lilac/70 text-[#4a3660]",
  accepted: "bg-mint/70 text-[#22503a]",
  rejected: "bg-peach/70 text-[#7c2d12]",
};

export function StageChip({ stage }: { stage: string }) {
  const labels: Record<string, string> = {
    new: "New",
    reviewing: "Reviewing",
    shortlisted: "Shortlisted",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return (
    <ClayChip className={STAGE_STYLES[stage] ?? "bg-secondary"}>
      {labels[stage] ?? stage}
    </ClayChip>
  );
}

/** Color for a 0-100 match score. */
export function matchScoreColor(score: number) {
  if (score >= 75) return "bg-mint text-[#22503a]";
  if (score >= 45) return "bg-butter text-[#6b4e12]";
  return "bg-peach text-[#7c2d12]";
}
