import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Policies", template: "%s — Siliguri Fresh Mart" },
  robots: { index: true, follow: true },
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="card-white p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
