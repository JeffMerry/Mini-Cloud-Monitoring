import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";
import { runMonitoringCycle } from "./workers/monitor.worker.js";
import { startMonitoringScheduler } from "./schedulers/monitor.scheduler.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await checkDatabaseConnection();

    console.log("Database connected");

    await runMonitoringCycle();

    startMonitoringScheduler();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();