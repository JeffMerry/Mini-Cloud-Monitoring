import Link from "next/link";
import ResponseTimeChart from "@/src/components/response-time-chart";
import MonitorToggleButton from "@/src/components/monitor-toggle-button";
import DeleteMonitorButton from "@/src/components/delete-monitor-button";

type MonitorSummary = {
  period: "24h" | "7d" | "30d";

  id: string;
  name: string;
  url: string;
  method: string;
  interval_seconds: number;
  timeout_ms: number;
  is_active: boolean;

  current_status: "UP" | "DOWN" | null;
  last_status_code: number | null;
  last_response_time_ms: number | null;
  last_checked_at: string | null;

  average_response_time_ms: number | null;
  total_checks: number;
  up_checks: number;
  uptime_percentage: string | null;

  total_incidents: number;
  open_incidents: number;
};

type ResponseTimeResponse = {
  period: "24h" | "7d" | "30d";

  monitor: {
    id: string;
    name: string;
  };

  points: {
    bucket: string;
    average_response_time_ms: number | null;
    total_checks: number;
    down_checks: number;
  }[];
};
type Incident = {
  id: number;
  monitor_id: string;
  started_at: string;
  resolved_at: string | null;
  reason: string | null;
  status: "OPEN" | "RESOLVED";
  duration_seconds: number;
};

type IncidentsResponse = {
  monitor: {
    id: string;
    name: string;
  };

  incidents: Incident[];
};

async function getMonitorSummary(
  id: string,
  period: "24h" | "7d" | "30d"
): Promise<MonitorSummary> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${apiUrl}/api/monitors/${id}/summary?period=${period}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch monitor summary");
  }

  return response.json();
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    period?: string;
  }>;
};

async function getResponseTimeHistory(
  id: string,
  period: "24h" | "7d" | "30d"
): Promise<ResponseTimeResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${apiUrl}/api/monitors/${id}/response-time?period=${period}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch response time history");
  }

  return response.json();
}

async function getIncidents(
  id: string
): Promise<IncidentsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${apiUrl}/api/monitors/${id}/incidents?limit=20`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch incidents");
  }

  return response.json();
}
function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export default async function MonitorDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const period =
    query.period === "7d" || query.period === "30d"
      ? query.period
      : "24h";

  const monitor = await getMonitorSummary(id, period);
  const responseTime = await getResponseTimeHistory(
    id,
    period
  );

  const incidentData = await getIncidents(id);

  const incidents = incidentData.incidents;

  const status = !monitor.is_active
    ? "INACTIVE"
    : monitor.current_status ?? "UNKNOWN";

  const statusStyles = {
    UP: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    DOWN: "border-red-500/20 bg-red-500/10 text-red-400",
    INACTIVE: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
    UNKNOWN: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          ← Back to Dashboard
        </Link>

        <header className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {monitor.name}
            </h1>

            <p className="mt-2 break-all text-sm text-zinc-500">
              {monitor.url}
            </p>
          </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
            href={`/monitors/${id}/edit`}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
            Edit
        </Link>

        <MonitorToggleButton
            monitorId={monitor.id}
            isActive={monitor.is_active}
        />

        <DeleteMonitorButton
            monitorId={monitor.id}
            monitorName={monitor.name}
        />

        <span
            className={`rounded-full border px-4 py-2 text-sm font-medium ${statusStyles[status]}`}
        >
            {status}
        </span>
        </div>
        </header>
        <div className="mt-8 flex flex-wrap gap-2">
        {(["24h", "7d", "30d"] as const).map((value) => (
            <Link
            key={value}
            href={`/monitors/${id}?period=${value}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                period === value
                ? "bg-zinc-100 text-zinc-950"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
            >
            {value.toUpperCase()}
            </Link>
        ))}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
           <p className="text-sm text-zinc-400">
            Uptime {period.toUpperCase()}
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {monitor.uptime_percentage !== null
                ? `${monitor.uptime_percentage}%`
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Average Response ({period.toUpperCase()})
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {monitor.average_response_time_ms !== null
                ? `${monitor.average_response_time_ms} ms`
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Last Response
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {monitor.last_response_time_ms !== null
                ? `${monitor.last_response_time_ms} ms`
                : "-"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">
              Incidents
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {monitor.total_incidents}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {monitor.open_incidents} open
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
            <div>
            <h2 className="text-lg font-semibold">
                Response Time
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
                Average response time over {period.toUpperCase()}
            </p>
            </div>
        </div>

        <div className="mt-6">
            {responseTime.points.length > 0 ? (
            <ResponseTimeChart data={responseTime.points} />
            ) : (
            <div className="flex h-80 items-center justify-center text-zinc-500">
                No response time data available.
            </div>
            )}
        </div>
        </section>
        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div>
            <h2 className="text-lg font-semibold">
            Incident History
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
            Recent downtime and recovery events.
            </p>
        </div>

        <div className="mt-6">
            {incidents.length > 0 ? (
            <div className="space-y-3">
                {incidents.map((incident) => (
                <div
                    key={incident.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                >
                    <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                        <span
                            className={`h-2.5 w-2.5 rounded-full ${
                            incident.status === "OPEN"
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                        />

                        <p className="font-medium">
                            {incident.status === "OPEN"
                            ? "Service Down"
                            : "Recovered"}
                        </p>
                        </div>

                        <p className="mt-2 text-sm text-zinc-400">
                        {incident.reason ?? "No reason available"}
                        </p>
                    </div>

                    <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        incident.status === "OPEN"
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        }`}
                    >
                        {incident.status}
                    </span>
                    </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Started
                        </p>

                        <p className="mt-1 text-zinc-300">
                        {new Date(
                            incident.started_at
                        ).toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Resolved
                        </p>

                        <p className="mt-1 text-zinc-300">
                        {incident.resolved_at
                            ? new Date(
                                incident.resolved_at
                            ).toLocaleString()
                            : "Still down"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Downtime
                        </p>

                        <p className="mt-1 text-zinc-300">
                        {formatDuration(
                            incident.duration_seconds
                        )}
                        </p>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500">
                No incidents recorded.
            </div>
            )}
        </div>
        </section>

        <section className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold">
            Monitor Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Method
              </p>

              <p className="mt-1">
                {monitor.method}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Interval
              </p>

              <p className="mt-1">
                {monitor.interval_seconds} seconds
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Timeout
              </p>

              <p className="mt-1">
                {monitor.timeout_ms} ms
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Last Checked
              </p>

              <p className="mt-1">
                {monitor.last_checked_at
                  ? new Date(
                      monitor.last_checked_at
                    ).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}