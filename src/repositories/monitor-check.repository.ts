import pool from "../config/database.js";

export interface CreateMonitorCheckInput {
  monitorId: string;
  status: "UP" | "DOWN";
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
}

export async function createMonitorCheck(
  input: CreateMonitorCheckInput
) {
  const result = await pool.query(
    `
      INSERT INTO monitor_checks (
        monitor_id,
        status,
        status_code,
        response_time_ms,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      input.monitorId,
      input.status,
      input.statusCode,
      input.responseTimeMs,
      input.errorMessage,
    ]
  );

  return result.rows[0];
}

export async function getMonitorChecks(
  monitorId: string,
  period: "24h" | "7d" | "30d",
  limit: number
) {
  const intervalMap = {
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days",
  } as const;

  const interval = intervalMap[period];

  const result = await pool.query(
    `
      SELECT
        id,
        monitor_id,
        status,
        status_code,
        response_time_ms,
        error_message,
        checked_at
      FROM monitor_checks
      WHERE monitor_id = $1
        AND checked_at >= NOW() - $2::INTERVAL
      ORDER BY checked_at ASC
      LIMIT $3
    `,
    [monitorId, interval, limit]
  );

  return result.rows;
}

export async function getLastMonitorCheck(
  monitorId: string
) {
  const result = await pool.query(
    `
      SELECT *
      FROM monitor_checks
      WHERE monitor_id = $1
      ORDER BY checked_at DESC
      LIMIT 1
    `,
    [monitorId]
  );

  return result.rows[0] ?? null;
}

export async function getResponseTimeHistory(
  monitorId: string,
  period: "24h" | "7d" | "30d"
) {
  if (period === "24h") {
    const result = await pool.query(
      `
        SELECT
          to_timestamp(
            floor(extract(epoch from checked_at) / 300) * 300
          ) AS bucket,

          ROUND(AVG(response_time_ms))::INTEGER
            AS average_response_time_ms,

          COUNT(*)::INTEGER AS total_checks,

          COUNT(*) FILTER (
            WHERE status = 'DOWN'
          )::INTEGER AS down_checks

        FROM monitor_checks

        WHERE monitor_id = $1
          AND checked_at >= NOW() - INTERVAL '24 hours'

        GROUP BY bucket
        ORDER BY bucket ASC
      `,
      [monitorId]
    );

    return result.rows;
  }

  if (period === "7d") {
    const result = await pool.query(
      `
        SELECT
          date_trunc('hour', checked_at) AS bucket,

          ROUND(AVG(response_time_ms))::INTEGER
            AS average_response_time_ms,

          COUNT(*)::INTEGER AS total_checks,

          COUNT(*) FILTER (
            WHERE status = 'DOWN'
          )::INTEGER AS down_checks

        FROM monitor_checks

        WHERE monitor_id = $1
          AND checked_at >= NOW() - INTERVAL '7 days'

        GROUP BY bucket
        ORDER BY bucket ASC
      `,
      [monitorId]
    );

    return result.rows;
  }

  const result = await pool.query(
    `
      SELECT
        date_trunc('day', checked_at) AS bucket,

        ROUND(AVG(response_time_ms))::INTEGER
          AS average_response_time_ms,

        COUNT(*)::INTEGER AS total_checks,

        COUNT(*) FILTER (
          WHERE status = 'DOWN'
        )::INTEGER AS down_checks

      FROM monitor_checks

      WHERE monitor_id = $1
        AND checked_at >= NOW() - INTERVAL '30 days'

      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    [monitorId]
  );

  return result.rows;
}