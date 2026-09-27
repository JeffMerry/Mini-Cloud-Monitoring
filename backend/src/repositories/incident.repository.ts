import pool from "../config/database.js";

export interface CreateIncidentInput {
  monitorId: string;
  reason: string | null;
}

export async function createIncident(
  input: CreateIncidentInput
) {
  const result = await pool.query(
    `
      INSERT INTO incidents (
        monitor_id,
        reason,
        status
      )
      VALUES ($1, $2, 'OPEN')
      RETURNING *
    `,
    [
      input.monitorId,
      input.reason,
    ]
  );

  return result.rows[0];
}

export async function getOpenIncident(
  monitorId: string
) {
  const result = await pool.query(
    `
      SELECT *
      FROM incidents
      WHERE monitor_id = $1
        AND status = 'OPEN'
      ORDER BY started_at DESC
      LIMIT 1
    `,
    [monitorId]
  );

  return result.rows[0] ?? null;
}

export async function resolveIncident(
  incidentId: number
) {
  const result = await pool.query(
    `
      UPDATE incidents
      SET
        status = 'RESOLVED',
        resolved_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [incidentId]
  );

  return result.rows[0] ?? null;
}


export async function getIncidentsByMonitor(
  monitorId: string,
  limit: number
) {
  const result = await pool.query(
    `
      SELECT
        id,
        monitor_id,
        started_at,
        resolved_at,
        reason,
        status,
        CASE
          WHEN resolved_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (resolved_at - started_at))::INTEGER
          ELSE
            EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
        END AS duration_seconds
      FROM incidents
      WHERE monitor_id = $1
      ORDER BY started_at DESC
      LIMIT $2
    `,
    [monitorId, limit]
  );

  return result.rows;
}