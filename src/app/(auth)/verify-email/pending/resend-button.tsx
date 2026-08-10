"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resendVerification } from "../../_actions";
import { Button } from "@/components/ui/button";

export function ResendButton() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await resendVerification();
      if (result.ok) {
        setSent(true);
        toast.success("Confirmation link sent. Check your inbox.");
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={pending || sent}
      aria-busy={pending}
      variant="outline"
      className="mt-6"
    >
      {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
      {sent ? "Link sent" : pending ? "Sending…" : "Resend confirmation link"}
    </Button>
  );
}
