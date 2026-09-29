import type { Request,Response, NextFunction } from "express";
import {getAllMonitors ,getMonitorById,createMonitor, updateMonitor,deleteMonitor, getMonitorSummary, getDashboardOverview} from "../repositories/monitor.repository.js";
import { checkHttpEndpoint } from "../services/http-checker.service.js";
import { createMonitorCheck, getMonitorChecks ,getLastMonitorCheck,getResponseTimeHistory} from "../repositories/monitor-check.repository.js";
import {
  createIncident,
  getOpenIncident,
  resolveIncident,
  getIncidentsByMonitor,
} from "../repositories/incident.repository.js";

type MonitorParams = { id: string };

export async function getMonitors(
    req:Request,
    res:Response,
    next:NextFunction
) {
    try{
        const monitors = await getAllMonitors();
        res.status(200).json(monitors);
    }catch (error){
        next(error);
    }
}

export async function getMonitor(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await getMonitorById(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    res.status(200).json(monitor);
  } catch (error) {
    next(error);
  }
}

export async function createMonitorHandler(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try{
        const{
            name,
            url,
            method,
            interval_seconds,
            timeout_ms,
        } = req.body;
        if (
      typeof name !== "string" ||
      typeof url !== "string" ||
      typeof method !== "string" ||
      typeof interval_seconds !== "number" ||
      typeof timeout_ms !== "number"
    ) {
      return res.status(400).json({
        message: "Invalid input types",
      });
    }
    if (!name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

     try {
      new URL(url);
    } catch {
      return res.status(400).json({
        message: "Invalid URL",
      });
    }

    const allowedMethods = ["GET", "POST", "HEAD"];

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        message: "Invalid HTTP method",
      });
    }

    if (interval_seconds <= 0) {
      return res.status(400).json({
        message: "interval_seconds must be greater than 0",
      });
    }

    if (timeout_ms <= 0) {
      return res.status(400).json({
        message: "timeout_ms must be greater than 0",
      });
    }

    const monitor = await createMonitor({
      name: name.trim(),
      url,
      method: method as "GET" | "POST" | "HEAD",
      interval_seconds,
      timeout_ms,
    });


    res.status(201).json(monitor);
  } catch (error) {
    next(error);
  }
}

export async function updateMonitorHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const {
      name,
      url,
      method,
      interval_seconds,
      timeout_ms,
      is_active,
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Invalid name",
        });
      }
    }

    if (url !== undefined) {
      if (typeof url !== "string") {
        return res.status(400).json({
          message: "Invalid URL",
        });
      }

      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          message: "Invalid URL",
        });
      }
    }

    if (method !== undefined) {
      const allowedMethods = ["GET", "POST", "HEAD"];

      if (
        typeof method !== "string" ||
        !allowedMethods.includes(method)
      ) {
        return res.status(400).json({
          message: "Invalid HTTP method",
        });
      }
    }

    if (
      interval_seconds !== undefined &&
      (typeof interval_seconds !== "number" ||
        interval_seconds <= 0)
    ) {
      return res.status(400).json({
        message: "Invalid interval_seconds",
      });
    }

    if (
      timeout_ms !== undefined &&
      (typeof timeout_ms !== "number" || timeout_ms <= 0)
    ) {
      return res.status(400).json({
        message: "Invalid timeout_ms",
      });
    }

    if (
      is_active !== undefined &&
      typeof is_active !== "boolean"
    ) {
      return res.status(400).json({
        message: "Invalid is_active",
      });
    }

    const monitor = await updateMonitor(id, {
      name: name?.trim(),
      url,
      method,
      interval_seconds,
      timeout_ms,
      is_active,
    });

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    res.status(200).json(monitor);
  } catch (error) {
    next(error);
  }
}

export async function deleteMonitorHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await deleteMonitor(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    res.status(200).json({
      message: "Monitor deleted",
      monitor,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkMonitorHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await getMonitorById(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    if (!monitor.is_active) {
      return res.status(400).json({
        message: "Monitor is inactive",
      });
    }

    const result = await checkHttpEndpoint({
      url: monitor.url,
      method: monitor.method,
      timeoutMs: monitor.timeout_ms,
    });

    const check = await createMonitorCheck({
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
    });

    res.status(200).json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
      },
      result,
      check,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMonitorChecksHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await getMonitorById(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    const periodQuery = req.query.period ?? "24h";

    if (
      periodQuery !== "24h" &&
      periodQuery !== "7d" &&
      periodQuery !== "30d"
    ) {
      return res.status(400).json({
        message: "period must be 24h, 7d, or 30d",
      });
    }

    const limitQuery = req.query.limit;
    const limit = Number(limitQuery ?? 500);

    if (
      !Number.isInteger(limit) ||
      limit <= 0 ||
      limit > 5000
    ) {
      return res.status(400).json({
        message: "limit must be an integer between 1 and 5000",
      });
    }

    const checks = await getMonitorChecks(
      id,
      periodQuery,
      limit
    );

    res.status(200).json({
      period: periodQuery,

      monitor: {
        id: monitor.id,
        name: monitor.name,
      },

      checks,
    });
  } catch (error) {
    next(error);
  }
}



export async function getMonitorSummaryHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const periodQuery = req.query.period ?? "24h";

    if (
      periodQuery !== "24h" &&
      periodQuery !== "7d" &&
      periodQuery !== "30d"
    ) {
      return res.status(400).json({
        message: "period must be 24h, 7d, or 30d",
      });
    }

    const summary = await getMonitorSummary(
      id,
      periodQuery
    );

    if (!summary) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    res.status(200).json({
      period: periodQuery,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function getResponseTimeHistoryHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await getMonitorById(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    const periodQuery = req.query.period ?? "24h";

    if (
      periodQuery !== "24h" &&
      periodQuery !== "7d" &&
      periodQuery !== "30d"
    ) {
      return res.status(400).json({
        message: "period must be 24h, 7d, or 30d",
      });
    }

    const history = await getResponseTimeHistory(
      id,
      periodQuery
    );

    res.status(200).json({
      period: periodQuery,

      monitor: {
        id: monitor.id,
        name: monitor.name,
      },

      points: history,
    });
  } catch (error) {
    next(error);
  }
}


export async function getMonitorIncidentsHandler(
  req: Request<MonitorParams>,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const monitor = await getMonitorById(id);

    if (!monitor) {
      return res.status(404).json({
        message: "Monitor not found",
      });
    }

    const limitQuery = req.query.limit;
    const limit = Number(limitQuery ?? 50);

    if (
      !Number.isInteger(limit) ||
      limit <= 0 ||
      limit > 500
    ) {
      return res.status(400).json({
        message: "limit must be an integer between 1 and 500",
      });
    }

    const incidents = await getIncidentsByMonitor(
      id,
      limit
    );

    res.status(200).json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
      },
      incidents,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardOverviewHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const overview = await getDashboardOverview();

    res.status(200).json(overview);
  } catch (error) {
    next(error);
  }
}
