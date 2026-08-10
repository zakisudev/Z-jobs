import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Every variant references semantic tokens only — never `bg-teal-500` or
 * `bg-blue-500`, which is how the old app ended up with two different primary
 * button colours across nine files.
 *
 * The press affordance is a 1px translate rather than a scale: scaling a
 * button resamples its text every frame and looks soft on low-DPI screens,
 * which is most of the devices this board is browsed on.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,translate] duration-150",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover hover:shadow-sm",
        /* The gold call to action. Reserved for the single most important
           action on a surface — "Apply", "Post a job" — so it keeps meaning. */
        accent:
          "bg-accent text-accent-foreground shadow-xs hover:shadow-sm hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        outline:
          "border border-border-strong bg-card hover:border-primary hover:text-primary",
        ghost: "hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:brightness-110",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", full: false },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  full,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, full }), className)} {...props} />
  );
}

export { buttonVariants };
