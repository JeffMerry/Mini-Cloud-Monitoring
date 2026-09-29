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

const allowedOrigins = [
  "http://localhost:3001",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
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