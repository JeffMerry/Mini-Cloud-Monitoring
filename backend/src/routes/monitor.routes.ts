import { Router } from "express";
import { getMonitors, getMonitor,createMonitorHandler, updateMonitorHandler,deleteMonitorHandler, checkMonitorHandler,
    getMonitorChecksHandler, getMonitorIncidentsHandler,getMonitorSummaryHandler,getResponseTimeHistoryHandler,getDashboardOverviewHandler
} from "../controllers/monitor.controller.js";

const router = Router();

router.get("/", getMonitors);
router.get("/overview", getDashboardOverviewHandler);

router.get("/:id/checks", getMonitorChecksHandler);
router.get("/:id/incidents", getMonitorIncidentsHandler);
router.get("/:id/summary", getMonitorSummaryHandler);
router.get("/:id/response-time", getResponseTimeHistoryHandler);

router.post("/:id/check", checkMonitorHandler);


router.get("/:id", getMonitor);

router.post("/", createMonitorHandler);
router.patch("/:id", updateMonitorHandler);
router.delete("/:id", deleteMonitorHandler);
export default router;