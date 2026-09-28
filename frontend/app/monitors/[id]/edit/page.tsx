"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Monitor = {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "HEAD";
  interval_seconds: number;
  timeout_ms: number;
  is_active: boolean;
};

export default function EditMonitorPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] =
    useState<Monitor["method"]>("GET");
  const [intervalSeconds, setIntervalSeconds] =
    useState(60);
  const [timeoutMs, setTimeoutMs] =
    useState(5000);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadMonitor() {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(
          `${apiUrl}/api/monitors/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to load monitor");
        }

        const data: Monitor = await response.json();

        setName(data.name);
        setUrl(data.url);
        setMethod(data.method);
        setIntervalSeconds(data.interval_seconds);
        setTimeoutMs(data.timeout_ms);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadMonitor();
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${apiUrl}/api/monitors/${id}`,
        {
          method: "PATCH",

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
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message || "Failed to update monitor"
        );
      }

      router.push(`/monitors/${id}`);
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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-zinc-400">
            Loading monitor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href={`/monitors/${id}`}
          className="text-sm text-zinc-400 transition hover:text-zinc-100"
        >
          ← Back to Monitor
        </Link>

        <header className="mt-6">
          <h1 className="text-3xl font-bold">
            Edit Monitor
          </h1>

          <p className="mt-2 text-zinc-400">
            Update monitoring configuration.
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
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
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
              required
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              HTTP Method
            </label>

            <select
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target.value as Monitor["method"]
                )
              }
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3"
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

              <input
                type="number"
                min="60"
                value={intervalSeconds}
                onChange={(event) =>
                  setIntervalSeconds(
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Timeout
              </label>

              <input
                type="number"
                min="1000"
                value={timeoutMs}
                onChange={(event) =>
                  setTimeoutMs(
                    Number(event.target.value)
                  )
                }
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href={`/monitors/${id}`}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}