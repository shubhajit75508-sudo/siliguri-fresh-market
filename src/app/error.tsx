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
      <body className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-extrabold text-brand-dark">Oops!</h1>
          <p className="mt-4 text-gray-500">
            Something went wrong. Please try again.
          </p>
          <p className="mt-2 text-xs text-gray-400">
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
