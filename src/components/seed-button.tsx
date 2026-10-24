"use client";

import { seedDemo } from "@/lib/seed";
import { Button } from "@/components/ui";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function SeedButton() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  return (
    <Button
      variant="primary"
      disabled={pending || done}
      onClick={() =>
        startTransition(async () => {
          const r = await seedDemo();
          setDone(r.seeded);
          router.refresh();
        })
      }
    >
      <Sparkles className="size-4" />
      {pending ? "Loading demo data…" : done ? "Demo data loaded" : "Load demo data"}
    </Button>
  );
}
