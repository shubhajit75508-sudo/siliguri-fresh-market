import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <div className="card-white p-10 sm:p-12 max-w-sm w-full">
        <span className="text-6xl mb-5 block">{'\uD83D\uDCE1'}</span>
        <h1 className="text-[22px] font-extrabold text-foreground mb-2">You&apos;re offline</h1>
        <p className="text-sm text-muted leading-relaxed mb-6">
          Looks like you lost your internet connection. Check your Wi-Fi or mobile data and try again.
        </p>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-full bg-[#2D7D3A] px-8 text-[15px] font-semibold text-white shadow-lg shadow-[#2D7D3A]/25 hover:bg-[#23682E] active:scale-[0.98] transition-all"
        >
          Try Again
        </Link>
        <p className="mt-8 text-[12px] text-muted-light">Siliguri Fresh Mart — Fresh market delivered in minutes</p>
      </div>
    </div>
  );
}
