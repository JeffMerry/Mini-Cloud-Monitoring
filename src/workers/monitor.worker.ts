import { getActiveMonitors } from "../repositories/monitor.repository.js";
import { createMonitorCheck, getLastMonitorCheck } from "../repositories/monitor-check.repository.js";
import { checkHttpEndpointWithRetry } from "../services/http-checker.service.js";
import { createIncident , getOpenIncident, resolveIncident} from "../repositories/incident.repository.js";
import type { Monitor } from "../types/monitor.js";


async function checkSingleMonitor(monitor: Monitor) {
  try {
    const lastCheck = await getLastMonitorCheck(monitor.id);

    if (lastCheck) {
      const lastCheckedAt = new Date(lastCheck.checked_at).getTime();
      const elapsedSeconds =
        (Date.now() - lastCheckedAt) / 1000;

      if (elapsedSeconds < monitor.interval_seconds) {
        console.log(
          `Skipping ${monitor.name}: interval not reached`
        );

        return;
      }
    }

    console.log(`Checking: ${monitor.name}`);

    const result = await checkHttpEndpointWithRetry({
      url: monitor.url,
      method: monitor.method,
      timeoutMs: monitor.timeout_ms,
      label: monitor.name,
    });

    const previousStatus = lastCheck?.status ?? null;
    const currentStatus = result.status;

    if (previousStatus !== currentStatus) {
      console.log(
        `${monitor.name}: status changed ${previousStatus ?? "UNKNOWN"} → ${currentStatus}`
      );
    }

    if (
      currentStatus === "DOWN" &&
      previousStatus !== "DOWN"
    ) {
      const incident = await createIncident({
        monitorId: monitor.id,
        reason: result.errorMessage,
      });

      console.log(
        `Incident created for ${monitor.name}: #${incident.id}`
      );
    }

    if (
      previousStatus === "DOWN" &&
      currentStatus === "UP"
    ) {
      const openIncident =
        await getOpenIncident(monitor.id);

      if (openIncident) {
        const resolvedIncident =
          await resolveIncident(openIncident.id);

        console.log(
          `Incident resolved for ${monitor.name}: #${resolvedIncident.id}`
        );
      }
    }

    await createMonitorCheck({
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
    });

    console.log(
      `${monitor.name}: ${result.status} (${result.responseTimeMs ?? "-"} ms)`
    );
  } catch (error) {
    console.error(
      `Failed to check ${monitor.name}:`,
      error
    );
  }
}

export async function runMonitoringCycle() {
  const monitors = await getActiveMonitors();

  console.log(
    `Running monitoring cycle for ${monitors.length} monitors`
  );

  await Promise.allSettled(
    monitors.map((monitor) =>
      checkSingleMonitor(monitor)
    )
  );
}
