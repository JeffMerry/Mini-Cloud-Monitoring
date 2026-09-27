import cron from "node-cron";
import { runMonitoringCycle } from "../workers/monitor.worker.js";

let isRunning = false;

export function startMonitoringScheduler() {
  cron.schedule("* * * * *", async () => {
    if (isRunning) {
      console.log("Previous monitoring cycle is still running. Skipping...");
      return;
    }

    isRunning = true;

    console.log("Running scheduled monitoring cycle");

    try {
      await runMonitoringCycle();
    } catch (error) {
      console.error("Monitoring cycle failed:", error);
    } finally {
      isRunning = false;
    }
  });

  console.log("Monitoring scheduler started");
}