# Technology Stack Specification – Chain Workspace Application

## 1 Overview

A lightweight, modular stack that prioritises rapid iteration and clear separation of concerns. The system is optimised for a **single‑process launch** today and can scale horizontally later without refactoring core code.

| Layer                 | Technology                              | Primary Role                                          |
| --------------------- | --------------------------------------- | ----------------------------------------------------- |
| **UI (Front‑End)**    | React 18 (+ Vite) • SVG rendering       | Interactive canvas, sidebars and inspectors           |
| **State & Undo**      | In‑memory immutable event log           | Fine‑grained Ctrl‑Z/Redo and manual version snapshots |
| **API (Back‑End)**    | Node.js 20 + TypeScript • Fastify • Zod | REST endpoints with runtime schema validation         |
| **Persistence**       | PostgreSQL 16 (single instance)         | Durable storage for events, documents, agents, chains |
| **Containerisation**  | Docker + Compose                        | Repeatable local & cloud deployments                  |
| **DB GUI (Dev only)** | Adminer                                 | Browser‑based inspection & imports                    |

---

## 2 Front‑End

- **Framework :** React 18 bootstrapped with **Vite** for hot‑module reload and fast builds.
- **Rendering strategy :** all nodes and edges drawn as **SVG elements**; DOM events (`onClick`, `onPointerDown`, drag) wired through React handlers.
- **Styling :** Tailwind CSS; Inter font; monochrome grey palette plus single purple accent (#8b5cf6).
- **Testing :** Vitest + React Testing Library.

## 3 Client‑Side State

- **Single source of truth** = immutable \`\` object (nodes, edges, selection).
- **Event types** (ADD_NODE, MOVE_NODE, DELETE_EDGE, …) appended to local array.
- **Undo / Redo** implemented with `past` / `future` stacks; reverse events are generated on the fly.
- **Manual snapshots** (`/documents/:id/version`) recorded on explicit _Create Version_ action only.
- **In‑process cache** (`Map`) with 60 s TTL for repeated Agent runs; no external cache yet.

## 4 Back‑End API

- **Runtime:** Node.js 20 with **TypeScript** for static safety.
- **HTTP server:** **Fastify** (lightweight, high‑perf) listening on `3000`.
- **Validation:** **Zod** schemas shared via private package `@chain/types` and enforced per route.
- **Endpoints (illustrative)**\
  – `POST /events`   append single event\
  – `GET /events?from=seq`   stream event range\
  – `POST /agents/:id/run`   execute agent with input\
  – `POST /documents/:id/version`   create snapshot
- **Authentication:** JWT in httpOnly cookie (placeholder; to be wired later).

## 5 Persistence – PostgreSQL 16

### Core tables

| Table              | Purpose                | Key columns                                               |
| ------------------ | ---------------------- | --------------------------------------------------------- |
| **events**         | Append‑only log        | `seq PK`, `ts`, `actor_id`, `event_type`, `payload jsonb` |
| **documents**      | Manual snapshots       | `doc_id`, `version`, `based_on`, `content`, `created_ts`  |
| **agents**         | Agent definitions      | `agent_id`, `config jsonb`, `secrets jsonb`, `created_ts` |
| **chains**         | High‑level canvas      | `chain_id`, `name`, `is_active`, `created`                |
| **chain_nodes**    | Nodes per chain        | `chain_id`, `node_id`, `node_type`, `x`, `y`              |
| **chain_edges**    | Edges per chain        | `edge_id`, `chain_id`, `from_id`, `to_id`                 |
| **files** _(prep)_ | Binary assets metadata | `file_id`, `mime`, `bytes`, `url`                         |

- **ORM / Migrations:** **Prisma** generates TS types and handles schema drift.
- **Indexes:**\
  – PK on `events.seq` (implicit)\
  – `(doc_id, created_ts DESC)` on `documents`\
  – `(event_type)` partial index as usage warrants.

## 6 Containers & Local Orchestration

```text
services:
  db        postgres:16
  api       node‑api   (Fastify + TS)
  ui        nginx‑static (React build) | vite‑dev (dev mode)
  adminer   adminer     (profile: dev)
networks:
  private
```

- **Profiles:** `dev` profile spins `adminer`; production excludes it.
- **Volumes:** named volume `db` for Postgres data.
- **Reverse proxy:** none initially—platform edge (e.g. Fly .io) supplies TLS; internal routing handled by compose network.

## 7 Dev & Quality Tooling

- **Lint / Format :** ESLint + Prettier (pre‑commit via Husky).
- **Testing :** Vitest (unit), Supertest (API), Playwright (E2E).
- **Logs :** Pino in JSON mode to stdout; aggregation left to hosting platform.
- **CI/CD :** GitHub Actions — build images, run tests, deploy to Fly.

## 8 Security & Secrets

- Secrets stored in runtime env vars (`OPENAI_KEY`, `JWT_SECRET`, …).
- Future: move to platform secret store (Fly secrets / Doppler / Vault).
- Adminer container not exposed publicly; available only on internal VPN or `dev` profile.

## 9 Planned Upgrades

| Milestone              | Planned Addition                                                              |
| ---------------------- | ----------------------------------------------------------------------------- |
| Multi‑Process Scaling  | Introduce **Redis** for shared cache & pub/sub, spin up multiple API workers. |
| Realtime Collaboration | WebSocket gateway (Fastify WS) + Redis streams to broadcast events.           |
| Binary Assets          | Deploy **MinIO/S3** bucket; migrate `files.url` to presigned URLs.            |
| Reverse Proxy          | Add Caddy or Traefik for automatic HTTPS and path routing.                    |

---

_Document ID: tech-stack‑v1   |   Last updated: 2025‑08‑04_
