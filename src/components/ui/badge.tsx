import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status and metadata pills.
 *
 * Tones use the pre-mixed `-wash` tokens rather than `bg-primary/10`. An
 * opacity fill takes on whatever sits behind it, so the same badge rendered on
 * a card, on the sunken panel, and on a featured row produced three different
 * colours and only one of them cleared contrast. The wash tokens are opaque
 * and checked once per theme.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary-wash text-primary",
        accent: "bg-accent-wash text-accent-ink",
        success: "bg-success-wash text-success",
        warning: "bg-warning-wash text-warning",
        danger: "bg-destructive-wash text-destructive",
        outline: "border border-border-strong text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
