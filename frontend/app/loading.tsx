export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="h-9 w-64 animate-pulse rounded bg-zinc-800" />

        <div className="mt-3 h-5 w-80 animate-pulse rounded bg-zinc-900" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
            />
          ))}
        </div>

        <div className="mt-8 h-7 w-32 animate-pulse rounded bg-zinc-800" />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
            />
          ))}
        </div>
      </div>
    </main>
  );
}