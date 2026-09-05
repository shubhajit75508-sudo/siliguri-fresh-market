import { Leaf } from "lucide-react";

export function FreshnessBanner() {
  return (
    <div className="card-white p-5">
      <div className="flex items-center gap-4">
        <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#2D7D3A]/8">
          <Leaf className="h-6 w-6 text-[#2D7D3A]" />
        </span>
        <div>
          <h3 className="text-base font-extrabold text-foreground">100% Freshness Guarantee</h3>
          <p className="mt-0.5 text-xs text-muted leading-relaxed">
            Not satisfied? <strong className="text-[#2D7D3A]">Free replacement</strong> within 3 hours. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
