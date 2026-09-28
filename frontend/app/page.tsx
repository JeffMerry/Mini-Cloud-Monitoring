import Link from "next/link";

type OverviewResponse = {
  summary: {
    total: number;
    up: number;
    down: number;
    inactive: number;
    unknown: number;
  };
  monitors: {
    id: string;
    name: string;
    url: string;
    is_active: boolean;
    current_status: "UP" | "DOWN" | null;
    response_time_ms: number | null;
    last_checked_at: string | null;
  }[];
};

async function getOverview(): Promise<OverviewResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${apiUrl}/api/monitors/overview`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard overview");
  }

  return response.json();
}
function formatLastChecked(dateString: string | null) {
  if (!dateString) {
    return "Never";
  }

  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  return `${diffDays}d ago`;
}

export default async function Home() {
  const data = await getOverview();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Mini Cloud Monitoring
          </h1>

          <p className="mt-2 text-zinc-400">
            Monitor your services, uptime, and incidents.
          </p>
        </div>

        <Link
          href="/monitors/new"
          className="w-full rounded-lg bg-zinc-100 px-4 py-2 text-center text-sm font-medium text-zinc-950 transition hover:bg-white sm:w-auto"
        >
          + Add Monitor
        </Link>
      </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-400">
            Total Monitors
          </p>

          <div className="mt-2 flex items-end justify-between">
            <p className="text-3xl font-semibold">
              {data.summary.total}
            </p>

            {data.summary.unknown > 0 && (
              <p className="text-sm text-amber-400">
                {data.summary.unknown} unknown
              </p>
            )}
          </div>
        </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Up
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {data.summary.up}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Down
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {data.summary.down}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Inactive
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {data.summary.inactive}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Services
          </h2>

          <div className="mt-4">
  {data.monitors.length > 0 ? (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.monitors.map((monitor) => {
        const status = !monitor.is_active
          ? "INACTIVE"
          : monitor.current_status ?? "UNKNOWN";

        const statusStyles = {
          UP: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          DOWN: "bg-red-500/10 text-red-400 border-red-500/20",
          INACTIVE:
            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          UNKNOWN:
            "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };

        return (
          <Link
            key={monitor.id}
            href={`/monitors/${monitor.id}`}
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700 hover:bg-zinc-900/80"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-zinc-100">
                  {monitor.name}
                </h3>

                <p className="mt-1 break-all text-sm text-zinc-500">
                  {monitor.url}
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
              >
                {status}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Response Time
                </p>

                <p className="mt-1 text-lg font-medium">
                  {monitor.response_time_ms !== null
                    ? `${monitor.response_time_ms} ms`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Last Checked
                </p>

                <p className="mt-1 text-sm text-zinc-300">
                  {formatLastChecked(
                    monitor.last_checked_at
                  )}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 p-10 text-center">
              <h3 className="font-medium text-zinc-200">
                No monitors yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Add your first service to start monitoring uptime
                and response time.
              </p>

              <Link
                href="/monitors/new"
                className="mt-5 inline-block rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950"
              >
                + Add Monitor
              </Link>
            </div>
          )}
        </div>
        </section>
      </div>
    </main>
  );
}