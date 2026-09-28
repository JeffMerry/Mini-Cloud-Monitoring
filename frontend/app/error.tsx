"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <div className="w-full rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-xl font-semibold text-red-400">
            Unable to load monitoring data
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            The monitoring API may be unavailable or the request failed.
          </p>

          <p className="mt-4 rounded-lg bg-zinc-950 p-3 text-sm text-zinc-500">
            {error.message}
          </p>

          <button
            onClick={reset}
            className="mt-5 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950"
          >
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}