import { Router } from "express";
import { checkHttpEndpoint } from "../services/http-checker.service.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const url = req.query.url;
    const method = req.query.method ?? "GET";
    const timeout = req.query.timeout ?? "5000";

    if (typeof url !== "string") {
      return res.status(400).json({
        message: "url query parameter is required",
      });
    }

    if (
      method !== "GET" &&
      method !== "POST" &&
      method !== "HEAD"
    ) {
      return res.status(400).json({
        message: "Invalid HTTP method",
      });
    }

    const timeoutMs = Number(timeout);

    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0
    ) {
      return res.status(400).json({
        message: "Invalid timeout",
      });
    }

    const result = await checkHttpEndpoint({
      url,
      method,
      timeoutMs,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;