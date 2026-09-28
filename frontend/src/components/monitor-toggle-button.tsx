"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  monitorId: string;
  isActive: boolean;
};

export default function MonitorToggleButton({
  monitorId,
  isActive,
}: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(
        `${apiUrl}/api/monitors/${monitorId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            is_active: !isActive,
          }),
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            "Failed to update monitor status"
        );
      }

      router.refresh();
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

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          isActive
            ? "border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
        }`}
      >
        {isLoading
          ? "Updating..."
          : isActive
          ? "Disable"
          : "Enable"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}