"use client";

import { useState } from "react";
import { useUserStore } from "@/store/user-store";
import { useToast } from "@/components/ui/toaster";
import { BellRing, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestockNotifyButtonProps {
  productId: string;
  productName?: string;
  size?: "sm" | "lg";
  variant?: "default" | "icon";
  className?: string;
}

export function RestockNotifyButton({
  productId,
  productName,
  size = "sm",
  variant = "default",
  className,
}: RestockNotifyButtonProps) {
  const { user } = useUserStore();
  const toast = useToast();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const handleClick = async () => {
    if (!user) {
      toast.add("Please login to get restock alerts", "error");
      window.location.href = "/auth/login";
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
      toast.add(`${productName ? productName + " — " : ""}We'll email you when it's back in stock`);
    } catch {
      setState("idle");
      toast.add("Couldn't save your request", "error");
    }
  };

  const iconBox = cn(
    "flex items-center justify-center border transition-all active:scale-[0.98] disabled:opacity-60",
    size === "lg" ? "h-[52px] w-[52px] rounded-2xl border-2" : "h-11 w-full rounded-full",
    variant === "icon"
      ? "border-dashed border-brand-fresh/40 text-brand-fresh hover:bg-brand-fresh/5"
      : "",
    className
  );

  if (variant === "icon") {
    if (state === "done") {
      return (
        <button
          type="button"
          aria-label={`${productName ?? "Product"} — restock alert saved`}
          disabled
          className={cn(iconBox, "border-solid border-brand-fresh/40 bg-brand-fresh/10")}
        >
          <Check className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2.5} />
        </button>
      );
    }
    return (
      <button
        type="button"
        aria-label={`Notify me when ${productName ?? "this product"} is back in stock`}
        onClick={handleClick}
        disabled={state === "sending"}
        className={iconBox}
      >
        <BellRing className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} strokeWidth={2} />
      </button>
    );
  }

  if (state === "done") {
    return (
      <span
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-full border border-brand-fresh/40 bg-brand-fresh/10 font-semibold text-brand-fresh",
          size === "lg" ? "h-[52px] px-6 text-sm" : "h-11 w-full text-[13px]",
          className
        )}
      >
        <Check className="h-4 w-4" strokeWidth={2.5} />
        You&apos;re on the list!
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "sending"}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-full border border-dashed border-brand-fresh/40 font-semibold text-brand-fresh transition-all hover:bg-brand-fresh/5 active:scale-[0.98] disabled:opacity-60",
        size === "lg" ? "h-[52px] px-6 text-sm" : "h-11 w-full text-[13px]",
        className
      )}
    >
      <BellRing className={cn(size === "lg" ? "h-5 w-5" : "h-4 w-4")} strokeWidth={2} />
      {state === "sending" ? "Saving..." : "Notify me when back in stock"}
    </button>
  );
}
