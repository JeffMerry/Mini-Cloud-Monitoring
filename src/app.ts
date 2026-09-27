import express from "express";
import healthRouter from "./routes/health.routes.js";
import monitorRouter from "./routes/monitor.routes.js";
import checkRouter from "./routes/check.routes.js";

const app = express();

app.use(express.json());

app.use("/health",healthRouter);
app.use("/api/monitors",monitorRouter);
app.use("/api/check", checkRouter);

app.use(((req,res) => {
    res.status(404).json({
        message: "Route not found",
    });
}));

app.use(
    (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
    ) => {
        console.error(err);

        res.status(500).json({
            message:"Internal server error"
        });
    }
);
export default app;