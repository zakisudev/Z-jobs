"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Slide-over panel built on Radix Dialog.
 *
 * Radix supplies the focus trap, Escape handling, scroll locking, and
 * aria-modal wiring. The old app's modals were a bare
 * `<div className="fixed inset-0 bg-black opacity-50">` with an onClick: the
 * page scrolled behind them, Tab escaped into the content underneath, and
 * Escape did nothing.
 */

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "left" | "right";
    title: string;
  }
>(({ className, children, side = "left", title, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "bg-background fixed inset-y-0 z-50 flex w-[min(20rem,85vw)] flex-col shadow-lg",
        side === "left" ? "left-0 border-r" : "right-0 border-l",
        "border-border",
        className,
      )}
      {...props}
    >
      {/* Radix requires an accessible title; it is visual here but the
          VisuallyHidden wrapper keeps that contract explicit. */}
      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

      {children}

      <DialogPrimitive.Close className="ring-offset-background focus-visible:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
        <X className="size-5" aria-hidden="true" />
        <span className="sr-only">Close menu</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetClose, SheetContent };
