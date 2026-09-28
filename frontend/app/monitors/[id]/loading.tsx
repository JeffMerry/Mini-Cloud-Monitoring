export default function MonitorLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="h-5 w-36 animate-pulse rounded bg-zinc-800" />

        <div className="mt-8 h-10 w-72 animate-pulse rounded bg-zinc-800" />

        <div className="mt-8 flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-16 animate-pulse rounded-lg bg-zinc-900"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
            />
          ))}
        </div>

        <div className="mt-8 h-80 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900" />
      </div>
    </main>
  );
}