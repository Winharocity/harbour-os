"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";

/* ------------------------------------------------------------------ */
/*  Buttons                                                            */
/* ------------------------------------------------------------------ */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "ghost" | "danger" | "sea" | "outline";
  size?: "sm" | "md" | "xs";
};

export function Button({ variant = "primary", size = "md", className, ...props }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea",
        "disabled:opacity-45 disabled:pointer-events-none active:scale-[0.97]",
        size === "md" && "h-9 px-4 text-sm",
        size === "sm" && "h-8 px-3 text-[13px]",
        size === "xs" && "h-6.5 px-2.5 text-xs rounded-md",
        variant === "primary" && "bg-signal text-white hover:bg-signal-dark shadow-[0_6px_16px_-6px_rgba(232,72,43,0.55)]",
        variant === "dark" && "bg-ink text-salt hover:bg-ink-3",
        variant === "sea" && "bg-sea text-white hover:brightness-110",
        variant === "outline" && "border border-line bg-white/60 hover:bg-white text-ink",
        variant === "ghost" && "hover:bg-ink/6 text-ink",
        variant === "danger" && "border border-signal/30 bg-signal/8 text-signal-dark hover:bg-signal/15",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Form fields                                                        */
/* ------------------------------------------------------------------ */

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("field", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("field", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("field min-h-20 resize-y", props.className)} />;
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn("label-mono block text-ink/55 mb-1.5", props.className)}
    />
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal
            className={cn(
              "relative w-full card p-6 max-h-[88vh] overflow-y-auto",
              wide ? "max-w-2xl" : "max-w-md",
            )}
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                {eyebrow && <p className="label-mono text-sea mb-1">{eyebrow}</p>}
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-lg p-1.5 -mr-1.5 -mt-1 text-ink/40 hover:text-ink hover:bg-ink/6 transition-colors"
              >
                <X className="size-4.5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Status pills                                                       */
/* ------------------------------------------------------------------ */

export type PillTone = "sea" | "sun" | "signal" | "ink" | "foam" | "sky";

const pillTones: Record<PillTone, string> = {
  sea: "bg-sea/10 text-sea border-sea/25",
  sun: "bg-sun/15 text-[#8a6413] border-sun/35",
  signal: "bg-signal/10 text-signal-dark border-signal/30",
  ink: "bg-ink/7 text-ink border-ink/15",
  sky: "bg-sky/20 text-ink-4 border-sky/40",
  foam: "bg-foam text-ink/70 border-line",
};

export function Pill({ tone = "foam", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-4.5 whitespace-nowrap",
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const ini = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span
      title={name}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none",
        size === "md" ? "size-7 text-[11px]" : "size-6 text-[10px]",
      )}
      style={{ background: `linear-gradient(135deg, hsl(${h} 42% 38%), hsl(${(h + 40) % 360} 48% 30%))` }}
    >
      {ini}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="rounded-2xl bg-foam border border-line p-3.5 text-ink/40 mb-4">{icon}</div>
      <p className="font-bold text-ink/80">{title}</p>
      {body && <p className="text-sm text-ink/50 mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
