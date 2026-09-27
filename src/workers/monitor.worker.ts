import { getActiveMonitors } from "../repositories/monitor.repository.js";
import { createMonitorCheck, getLastMonitorCheck } from "../repositories/monitor-check.repository.js";
import { checkHttpEndpointWithRetry } from "../services/http-checker.service.js";
import { createIncident , getOpenIncident, resolveIncident} from "../repositories/incident.repository.js";
import type { Monitor } from "../types/monitor.js";
import { sendTelegramMessage } from "../services/telegram.service.js";
import { createNotificationLog , hasNotificationBeenSent} from "../repositories/notification.repository.js";

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
        const existingIncident = await getOpenIncident(
          monitor.id
        );

        if (!existingIncident) {
          const incident = await createIncident({
            monitorId: monitor.id,
            reason: result.errorMessage,
          });

          console.log(
            `Incident created for ${monitor.name}: #${incident.id}`
          );

          const alreadySent = await hasNotificationBeenSent(
            incident.id,
            "DOWN"
          );

          if (!alreadySent) {
            const message = [
              "🔴 Service Down",
              "",
              monitor.name,
              "",
              "Status: DOWN",
              `Reason: ${result.errorMessage ?? "Unknown error"}`,
              `Time: ${new Date().toISOString()}`,
            ].join("\n");

            try {
              await sendTelegramMessage(message);

              await createNotificationLog({
                monitorId: monitor.id,
                incidentId: incident.id,
                channel: "TELEGRAM",
                type: "DOWN",
              });

              console.log(
                `Telegram DOWN notification sent for ${monitor.name}`
              );
            } catch (error) {
              console.error(
                `Failed to send DOWN notification for ${monitor.name}:`,
                error
              );
            }
          }

          console.log(
            `Telegram DOWN notification sent for ${monitor.name}`
          );
        } else {
          console.log(
            `Open incident already exists for ${monitor.name}: #${existingIncident.id}`
          );
        }
      }

   if (
      previousStatus === "DOWN" &&
      currentStatus === "UP"
    ) {
      const openIncident = await getOpenIncident(monitor.id);

      if (openIncident) {
        const resolvedIncident = await resolveIncident(
          openIncident.id
        );

        console.log(
          `Incident resolved for ${monitor.name}: #${resolvedIncident.id}`
        );
        
        const alreadySent = await hasNotificationBeenSent(
          resolvedIncident.id,
          "RECOVERY"
        );

        if (!alreadySent) {
          const startedAt =
            new Date(resolvedIncident.started_at).getTime();

          const resolvedAt =
            new Date(resolvedIncident.resolved_at).getTime();

          const downtimeSeconds = Math.floor(
            (resolvedAt - startedAt) / 1000
          );

          const message = [
            "🟢 Service Recovered",
            "",
            monitor.name,
            "",
            "Status: UP",
            `Downtime: ${downtimeSeconds} seconds`,
            `Current Response Time: ${result.responseTimeMs ?? "-"} ms`,
            `Time: ${new Date().toISOString()}`,
          ].join("\n");

          try {
            await sendTelegramMessage(message);

            await createNotificationLog({
              monitorId: monitor.id,
              incidentId: resolvedIncident.id,
              channel: "TELEGRAM",
              type: "RECOVERY",
            });

            console.log(
              `Telegram RECOVERY notification sent for ${monitor.name}`
            );
          } catch (error) {
            console.error(
              `Failed to send RECOVERY notification for ${monitor.name}:`,
              error
            );
          }
        }

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
