"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-surface p-8">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-extrabold text-white">Oops!</h1>
          <p className="mt-4 text-muted">
            Something went wrong. Please try again.
          </p>
          <p className="mt-2 text-xs text-muted-light">
            {error.message || error.digest}
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-brand-dark px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
