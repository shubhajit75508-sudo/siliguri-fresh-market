"use client";

export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-extrabold text-white">Oops!</h1>
        <p className="mt-4 text-muted">Something went wrong loading this page.</p>
        {error.message && (
          <p className="mt-2 text-xs text-muted-light">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
