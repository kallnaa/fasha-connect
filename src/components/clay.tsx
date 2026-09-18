import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Shared category → soft tint color mapping. */
export const CATEGORY_COLORS: Record<string, string> = {
  Education: "bg-butter text-yellow-800",
  Health: "bg-peach text-rose-800",
  Environment: "bg-mint text-teal-800",
  Community: "bg-lilac text-violet-800",
  Agriculture: "bg-mint/70 text-teal-800",
  Technology: "bg-sky text-sky-800",
};

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? "bg-secondary text-secondary-foreground";
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
  pending: "bg-butter text-yellow-800",
  accepted: "bg-mint text-teal-800",
  declined: "bg-peach text-rose-800",
  open: "bg-mint text-teal-800",
  closed: "bg-peach text-rose-800",
  filled: "bg-sky text-sky-800",
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
  new: "bg-butter text-yellow-800",
  reviewing: "bg-sky text-sky-800",
  shortlisted: "bg-lilac text-violet-800",
  accepted: "bg-mint text-teal-800",
  rejected: "bg-peach text-rose-800",
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
  if (score >= 75) return "bg-mint text-teal-800";
  if (score >= 45) return "bg-butter text-yellow-800";
  return "bg-peach text-rose-800";
}
