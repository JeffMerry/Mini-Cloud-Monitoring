import pool from "../config/database.js";
import type {  Monitor,CreateMonitorInput, UpdateMonitorInput } from "../types/monitor.js";

export async function getAllMonitors(): Promise<Monitor[]> {
    const result = await pool.query<Monitor>("SELECT * FROM monitors");
    return result.rows;
}

export async function getMonitorById(
    id: string): Promise<Monitor | null> {
        const result = await pool.query<Monitor>(
            "SELECT * FROM monitors WHERE id = $1",
            [id]
        );
        return result.rows[0] ?? null;
}

export async function createMonitor(
    input: CreateMonitorInput
): Promise<Monitor> {
    const result = await pool.query<Monitor>(
        `
        INSERT INTO monitors (
            name,
            url,
            method,
            interval_seconds,
            timeout_ms
        )
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
            input.name,
            input.url,
            input.method,
            input.interval_seconds,
            input.timeout_ms,
        ]
    );
    return result.rows[0]
}

export async function updateMonitor(
    id: string,
    input: UpdateMonitorInput
): Promise<Monitor | null> {
    const result = await pool.query<Monitor>(
        `
            UPDATE monitors
            SET
                name = COALESCE($1, name),
                url = COALESCE($2, url),
                method = COALESCE($3, method),
                interval_seconds = COALESCE($4, interval_seconds),
                timeout_ms = COALESCE($5, timeout_ms),
                is_active = COALESCE($6, is_active),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `,
        [
        input.name ?? null,
        input.url ?? null,
        input.method ?? null,
        input.interval_seconds ?? null,
        input.timeout_ms ?? null,
        input.is_active ?? null,
        id,
        ]
    );
    return result.rows[0] ?? null;
}

export async function deleteMonitor(
    id: string
): Promise<Monitor | null> {
    const result = await pool.query<Monitor>(
        `
            DELETE FROM monitors
            WHERE id = $1
            RETURNING *
        `,
        [id]
    );
    return result.rows[0] ?? null;
}
export async function getActiveMonitors(): Promise<Monitor[]> {
  const result = await pool.query<Monitor>(
    `
      SELECT *
      FROM monitors
      WHERE is_active = true
      ORDER BY created_at ASC
    `
  );

  return result.rows;
}

export async function getMonitorSummary(
  id: string,
  period: "24h" | "7d" | "30d"
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
        m.id,
        m.name,
        m.url,
        m.method,
        m.interval_seconds,
        m.timeout_ms,
        m.is_active,

        latest.status AS current_status,
        latest.status_code AS last_status_code,
        latest.response_time_ms AS last_response_time_ms,
        latest.checked_at AS last_checked_at,

        stats.average_response_time_ms,
        stats.total_checks,
        stats.up_checks,
        stats.uptime_percentage,

        COALESCE(incident_stats.total_incidents, 0)
          AS total_incidents,

        COALESCE(incident_stats.open_incidents, 0)
          AS open_incidents

      FROM monitors m

      LEFT JOIN LATERAL (
        SELECT
          status,
          status_code,
          response_time_ms,
          checked_at
        FROM monitor_checks
        WHERE monitor_id = m.id
        ORDER BY checked_at DESC
        LIMIT 1
      ) latest ON true

      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(response_time_ms))::INTEGER
            AS average_response_time_ms,

          COUNT(*)::INTEGER
            AS total_checks,

          COUNT(*) FILTER (
            WHERE status = 'UP'
          )::INTEGER
            AS up_checks,

          ROUND(
            (
              COUNT(*) FILTER (
                WHERE status = 'UP'
              )::NUMERIC
              / NULLIF(COUNT(*), 0)
            ) * 100,
            2
          ) AS uptime_percentage

        FROM monitor_checks
        WHERE monitor_id = m.id
          AND checked_at >= NOW() - $2::INTERVAL
      ) stats ON true

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::INTEGER AS total_incidents,

          COUNT(*) FILTER (
            WHERE status = 'OPEN'
          )::INTEGER AS open_incidents

        FROM incidents
        WHERE monitor_id = m.id
      ) incident_stats ON true

      WHERE m.id = $1
    `,
    [id, interval]
  );

  return result.rows[0] ?? null;
}

export async function getDashboardOverview() {
  const result = await pool.query(
    `
      SELECT
        m.id,
        m.name,
        m.url,
        m.is_active,

        latest.status AS current_status,
        latest.response_time_ms AS response_time_ms,
        latest.checked_at AS last_checked_at

      FROM monitors m

      LEFT JOIN LATERAL (
        SELECT
          status,
          response_time_ms,
          checked_at
        FROM monitor_checks
        WHERE monitor_id = m.id
        ORDER BY checked_at DESC
        LIMIT 1
      ) latest ON true

      ORDER BY m.created_at ASC
    `
  );

  const monitors = result.rows;

  const summary = {
    total: monitors.length,

    up: monitors.filter(
      (monitor) =>
        monitor.is_active &&
        monitor.current_status === "UP"
    ).length,

    down: monitors.filter(
      (monitor) =>
        monitor.is_active &&
        monitor.current_status === "DOWN"
    ).length,

    inactive: monitors.filter(
      (monitor) => !monitor.is_active
    ).length,

    unknown: monitors.filter(
      (monitor) =>
        monitor.is_active &&
        monitor.current_status === null
    ).length,
  };

  return {
    summary,
    monitors,
  };
}