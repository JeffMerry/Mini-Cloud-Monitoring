"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMonitorPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(5000);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/api/monitors`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          url,
          method,
          interval_seconds: intervalSeconds,
          timeout_ms: timeoutMs,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || "Failed to create monitor"
        );
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          ← Back to Dashboard
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold">
            Add Monitor
          </h1>

          <p className="mt-2 text-zinc-400">
            Add a new HTTP service to monitor.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
        >
          <div>
            <label className="text-sm font-medium">
              Monitor Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="MODNOI Backend"
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              URL
            </label>

            <input
              type="url"
              value={url}
              onChange={(event) =>
                setUrl(event.target.value)
              }
              placeholder="https://example.com/health"
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              HTTP Method
            </label>

            <select
              value={method}
              onChange={(event) =>
                setMethod(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Check Interval
              </label>

              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  min="60"
                  value={intervalSeconds}
                  onChange={(event) =>
                    setIntervalSeconds(
                      Number(event.target.value)
                    )
                  }
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                />

                <span className="text-sm text-zinc-500">
                  seconds
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Timeout
              </label>

              <div className="mt-2 flex items-center gap-3">
                <input
                  type="number"
                  min="1000"
                  value={timeoutMs}
                  onChange={(event) =>
                    setTimeoutMs(
                      Number(event.target.value)
                    )
                  }
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                />

                <span className="text-sm text-zinc-500">
                  ms
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href="/"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Creating..."
                : "Create Monitor"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}