"use client";

import { signIn, signInAll } from "@/lib/actions";
import { Button } from "@/components/ui";
import { Anchor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SignInButton({ sortieId, size = "sm" }: { sortieId: string; size?: "sm" | "md" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="sea"
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signIn(sortieId);
          router.refresh();
        })
      }
    >
      <Anchor className="size-3.5" />
      {pending ? "Mooring…" : "Sign in"}
    </Button>
  );
}

export function SignInAllButton({ count }: { count: number }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  if (count === 0) return null;
  return (
    <Button
      variant="dark"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signInAll();
          router.refresh();
        })
      }
    >
      <Anchor className="size-3.5" />
      {pending ? "Mooring fleet…" : `Sign in all (${count})`}
    </Button>
  );
}
