import express from "express";
import healthRouter from "./routes/health.routes.js";
import monitorRouter from "./routes/monitor.routes.js";
import cors from "cors";

const app = express();
const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error(
    "FRONTEND_URL environment variable is required"
  );
}

app.use(
  cors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/monitors", monitorRouter);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      message: "Internal server error",
    });
  }
);

export default app;