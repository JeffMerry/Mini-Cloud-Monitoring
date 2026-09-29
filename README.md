# Mini Cloud Monitoring

A lightweight full-stack HTTP monitoring dashboard for tracking service availability, response time, and incidents. Create a monitor for an endpoint, inspect its health over time, and receive Telegram alerts when the service goes down or recovers.

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

## Quick Start

1. Configure the backend and frontend environment files described in [Environment Variables](#environment-variables).
2. Prepare PostgreSQL and apply the required schema. See [Prepare PostgreSQL](#1-prepare-postgresql).
3. Run `npm install`, then `npm run dev`, in both `backend/` and `frontend/`.
4. Open `http://localhost:3000`.

## Screenshots

### Dashboard

[<img src="./docs/images/dashboard.png" alt="Dashboard showing an overview of monitored services" width="100%" />](./docs/images/dashboard.png)

### Monitor Detail

[<img src="./docs/images/monitor-detail.png" alt="Monitor detail page with uptime, response-time chart, and incident history" width="100%" />](./docs/images/monitor-detail.png)

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

```mermaid
flowchart LR
    U[User]

    subgraph Client
        F[Next.js Dashboard]
    end

    subgraph Backend
        B[Express API]
        S[node-cron Scheduler<br/>Every minute]
        W[Monitoring Worker]
        B --> S --> W
    end

    D[(PostgreSQL)]

    subgraph External Services
        M[Monitored Service]
        T[Telegram Bot API]
    end

    U --> F
    F -->|REST API| B
    B -->|Read and write monitor data| D
    W -->|Load monitors and save results| D
    W -->|HTTP check with retry| M
    W -->|Outage or recovery event| T

    classDef client fill:#0f172a,stroke:#38bdf8,color:#f8fafc
    classDef backend fill:#172554,stroke:#60a5fa,color:#f8fafc
    classDef database fill:#3f1d2e,stroke:#f472b6,color:#fdf2f8
    classDef external fill:#064e3b,stroke:#34d399,color:#ecfdf5

    class F client
    class B,S,W backend
    class D database
    class M,T external
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

### Dashboard overview response

```json
GET /api/monitors/overview

{
  "summary": {
    "total": 2,
    "up": 2,
    "down": 0,
    "inactive": 0,
    "unknown": 0
  },
  "monitors": [
    {
      "id": "monitor-id",
      "name": "Example API",
      "url": "https://example.com/health",
      "is_active": true,
      "current_status": "UP",
      "response_time_ms": 120,
      "last_checked_at": "2026-09-29T12:00:00.000Z"
    }
  ]
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
