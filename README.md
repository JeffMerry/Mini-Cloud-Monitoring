# Mini Cloud Monitoring

A lightweight full-stack HTTP monitoring dashboard for tracking service availability, response time, and incidents. Create a monitor for an endpoint, inspect its health over time, and receive Telegram alerts when the service goes down or recovers.

## Screenshots

<p align="center">
  <img src="./docs/images/dashboard.png" alt="Dashboard showing an overview of monitored services" width="49%" />
  <img src="./docs/images/monitor-detail.png" alt="Monitor detail page with uptime, response-time chart, and incident history" width="49%" />
</p>

> Add the supplied screenshots as `docs/images/dashboard.png` and `docs/images/monitor-detail.png`. See [docs/images/README.md](./docs/images/README.md) for the required filenames.

## Features

- Monitor HTTP endpoints using `GET`, `POST`, or `HEAD`
- Set a check interval and timeout for each monitor
- View dashboard totals and the current `UP`, `DOWN`, `INACTIVE`, or `UNKNOWN` status
- View uptime, average response time, and a response-time chart for the last 24 hours, 7 days, or 30 days
- Record incidents automatically when a service changes from `UP` to `DOWN`
- Resolve incidents automatically when the service recovers
- Send Telegram notifications for outage and recovery events
- Create, edit, enable, disable, manually check, and delete monitors

## How It Works

```text
Next.js dashboard
        |
        v
Express API ---------------------> PostgreSQL
        |                              |
        |                              +-- monitors
        |                              +-- monitor_checks
        |                              +-- incidents
        |                              +-- notification_logs
        v
node-cron scheduler (every minute)
        |
        v
HTTP checks with retry ----------> Monitored services
        |
        +-- Status change -------> Telegram Bot API
```

1. The backend runs one monitoring cycle when it starts, then schedules a cycle every minute.
2. Each cycle selects active monitors whose configured interval has elapsed.
3. The endpoint is checked up to three times, with a 10-second pause between failed attempts.
4. HTTP `2xx` and `3xx` responses are considered `UP`; failed requests and other status codes are `DOWN`.
5. A transition to `DOWN` creates an incident. A transition back to `UP` resolves it.
6. Telegram notifications are recorded so the same incident event is not sent twice.

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL with `pg` |
| Scheduling | node-cron |
| Notifications | Telegram Bot API |

## Project Structure

```text
mini-cloud-monitoring/
+-- frontend/                    # Next.js dashboard
|   +-- app/                     # Dashboard and monitor pages
|   `-- src/components/          # Charts and monitor controls
+-- backend/                     # Express API and monitoring service
|   `-- src/
|       +-- controllers/         # Request validation and API handlers
|       +-- repositories/        # PostgreSQL queries
|       +-- schedulers/          # Monitoring schedule
|       +-- services/            # HTTP checker and Telegram client
|       `-- workers/             # Monitoring and incident workflow
`-- docs/images/                 # README screenshots
```

## Prerequisites

- Node.js 22 or later
- npm
- PostgreSQL
- A Telegram bot and chat ID if notifications are required

## Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` and set the values below.

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/mini_cloud_monitoring
FRONTEND_URL=http://localhost:3000
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

`FRONTEND_URL` is required by the backend CORS configuration. Telegram values are needed to deliver outage and recovery notifications.

### Frontend

Copy `frontend/.env.example` to `frontend/.env.local`.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Local Development

### 1. Prepare PostgreSQL

Create a PostgreSQL database and configure `DATABASE_URL` in `backend/.env`.

> **Important:** This repository currently does not include a database migration or schema file. Before a first run, create and apply a schema for `monitors`, `monitor_checks`, `incidents`, and `notification_logs`.

### 2. Run the backend

```bash
cd backend
npm install
npm run dev
```

The API starts at `http://localhost:5000`.

### 3. Run the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production Build

```bash
cd backend
npm run build
npm start
```

```bash
cd frontend
npm run build
npm start
```

## API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Check whether the API is running |
| `GET` | `/api/monitors` | List all monitors |
| `POST` | `/api/monitors` | Create a monitor |
| `GET` | `/api/monitors/overview` | Get dashboard totals and current monitor status |
| `GET` | `/api/monitors/:id` | Get one monitor |
| `PATCH` | `/api/monitors/:id` | Update monitor settings or `is_active` |
| `DELETE` | `/api/monitors/:id` | Delete a monitor |
| `POST` | `/api/monitors/:id/check` | Trigger an immediate check |
| `GET` | `/api/monitors/:id/checks` | Get check history (`period`, `limit`) |
| `GET` | `/api/monitors/:id/summary` | Get uptime and availability summary (`period`) |
| `GET` | `/api/monitors/:id/response-time` | Get response-time history (`period`) |
| `GET` | `/api/monitors/:id/incidents` | Get incident history (`limit`) |

`period` accepts `24h`, `7d`, or `30d`.

### Create a monitor

```json
POST /api/monitors
{
  "name": "Example API",
  "url": "https://example.com/health",
  "method": "GET",
  "interval_seconds": 60,
  "timeout_ms": 5000
}
```

## Current Limitations and Next Steps

- Add PostgreSQL migrations or a versioned schema file so a fresh clone can be started immediately
- Add automated unit and integration tests
- Add authentication and role-based access control
- Support additional notification channels such as email or Slack
- Add Docker Compose for one-command local setup
- Add a public status page and deployment instructions

## License

This project is currently unlicensed. Add a license file before distributing or accepting external contributions.
