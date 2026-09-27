import pool from "../config/database.js";

export interface CreateNotificationLogInput {
  monitorId: string;
  incidentId: number;
  channel: "TELEGRAM";
  type: "DOWN" | "RECOVERY";
}

export async function createNotificationLog(
  input: CreateNotificationLogInput
) {
  const result = await pool.query(
    `
      INSERT INTO notification_logs (
        monitor_id,
        incident_id,
        channel,
        type
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      input.monitorId,
      input.incidentId,
      input.channel,
      input.type,
    ]
  );

  return result.rows[0];
}

export async function hasNotificationBeenSent(
  incidentId: number,
  type: "DOWN" | "RECOVERY"
): Promise<boolean> {
  const result = await pool.query(
    `
      SELECT 1
      FROM notification_logs
      WHERE incident_id = $1
        AND channel = 'TELEGRAM'
        AND type = $2
      LIMIT 1
    `,
    [incidentId, type]
  );

  return result.rowCount > 0;
}