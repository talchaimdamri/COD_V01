# Comprehensive Test Plan – Chain Workspace Application

> **Purpose**  
> Provide a structured, exhaustive catalogue of tests that must be written and maintained. Tests are grouped by pyramid level—Unit, Integration, End‑to‑End (E2E)—and mapped to functional requirements in the Technology Stack Specification _(doc: tech-stack-v1)_.

---

## 1. Scope

- **In‑Scope:** All core logic (Graph state, Agent execution, API, persistence, UI interactions).
- **Out‑of‑Scope for v1:** Distributed cache (Redis), Object‑storage flows, multi‑process Pub/Sub, real‑time collaboration.

## 2. Definitions

| Abbrev. | Meaning                                      |
| ------- | -------------------------------------------- |
| **SUT** | System under test (module, API, or full app) |
| **UT**  | Unit Test                                    |
| **IT**  | Integration Test                             |
| **E2E** | End‑to‑End Browser Test                      |

---

## 3. Unit Tests (Vitest)

> _Goal:_ Validate pure functions and isolated classes without external IO.

### 3.1 Graph Event Reducer – `applyEvent()`

| ID       | Description                                 | Preconditions          | Assertions                                   |
| -------- | ------------------------------------------- | ---------------------- | -------------------------------------------- |
| UT‑GR‑01 | **ADD_NODE produces new node**              | Empty graph            | `state.nodes` contains key; event appended   |
| UT‑GR‑02 | **MOVE_NODE updates coordinates immutably** | Graph with node N      | `prev !== next`; `next.nodes[N].x/y` changed |
| UT‑GR‑03 | **DELETE_EDGE removes edge**                | Graph with e1          | Edge array length ‑1; no ghost refs          |
| UT‑GR‑04 | Edge case: duplicate ADD_NODE id            | Node id already exists | Reducer throws `DuplicateIdError`            |

### 3.2 Undo/Redo Stacks

| ID       | Description                  | Assertions                         |
| -------- | ---------------------------- | ---------------------------------- |
| UT‑UR‑01 | Undo pops past → future      | past.length‑1; future.length+1     |
| UT‑UR‑02 | Redo restores state symmetry | stateAfterRedo === stateBeforeUndo |

### 3.3 Snapshot Logic

| ID       | Description                           | Preconditions       | Assertions                                 |
| -------- | ------------------------------------- | ------------------- | ------------------------------------------ |
| UT‑SS‑01 | Version creation clones deep, freezes | Graph with >0 nodes | New `documents` record; original unchanged |

### 3.4 Agent Runner

| ID       | Description                           | Stub Strategy            | Assertions                           |
| -------- | ------------------------------------- | ------------------------ | ------------------------------------ |
| UT‑AR‑01 | Model selection passes correct params | OpenAI stub              | Stub receives `model` = config.model |
| UT‑AR‑02 | Invalid API key raises `AuthError`    | Missing `secrets.apiKey` | Error thrown, no external call       |

### 3.5 Cache (In‑Memory)

| ID       | TTL    | Condition        | Assertions                       |
| -------- | ------ | ---------------- | -------------------------------- |
| UT‑CA‑01 | 60 s   | Hit within TTL   | `get(key)` returns value         |
| UT‑CA‑02 | expiry | access after TTL | `get()` undefined; entry deleted |

### 3.6 Utility – ID Generator, Validators

| ID       | Description                          | Assertions       |
| -------- | ------------------------------------ | ---------------- |
| UT‑UT‑01 | `uuid()` uniqueness across 1e4 calls | All ids distinct |

---

## 4. Integration Tests (Vitest + Supertest)

> _Goal:_ Exercise Fastify routes with a real Postgres (Testcontainers) but stub external services.

### 4.1 Events API

| ID       | Route                  | Scenario               | Expected                    |
| -------- | ---------------------- | ---------------------- | --------------------------- |
| IT‑EV‑01 | `POST /events`         | Valid ADD_NODE payload | 201; row exists in `events` |
| IT‑EV‑02 | same                   | Missing field          | 400 + Zod error JSON        |
| IT‑EV‑03 | `GET /events?from=seq` | Range query            | Chronological JSON array    |

### 4.2 Document Versions

| ID       | Route                         | Scenario     | Expected                     |
| -------- | ----------------------------- | ------------ | ---------------------------- |
| IT‑DV‑01 | `POST /documents/:id/version` | Valid graph  | New row in `documents` + 200 |
| IT‑DV‑02 | Conflict `based_on` missing   | 409 conflict |

### 4.3 Agent Execution

| ID       | Route                  | Scenario   | Stub                     | Expected               |
| -------- | ---------------------- | ---------- | ------------------------ | ---------------------- |
| IT‑AG‑01 | `POST /agents/:id/run` | Happy path | OpenAI stub returns “OK” | 200 JSON {output:"OK"} |
| IT‑AG‑02 | Unknown agentId        | –          | 404                      |

### 4.4 DB Migrations

| ID       | Description                       | Tool                    | Expected             |
| -------- | --------------------------------- | ----------------------- | -------------------- |
| IT‑MG‑01 | `prisma migrate deploy` completes | Testcontainers Postgres | Exit 0; tables exist |

### 4.5 Authentication Flow (Placeholder)

| ID       | Route                          | Scenario | Expected |
| -------- | ------------------------------ | -------- | -------- |
| IT‑AU‑01 | Access protected route w/o JWT | 401      |

---

## 5. End‑to‑End Tests (Playwright)

> _Goal:_ Validate full user journeys in a browser against a disposed backend.

### 5.1 Canvas Operations

| ID        | Flow                    | Steps (high‑level)           | Outcome                                                      |
| --------- | ----------------------- | ---------------------------- | ------------------------------------------------------------ |
| E2E‑CV‑01 | **Add Document Node**   | Open `/`, click _Doc_ button | New circle visible; sidebar lists doc                        |
| E2E‑CV‑02 | **Drag Node**           | Drag circle to (x,y)         | Circle renders at new pos; event arrives in `/events` stream |
| E2E‑CV‑03 | **Connect Doc → Agent** | Drag arrow                   | Arrow appears; edge row exists                               |

### 5.2 Document Editing View

| ID        | Steps                                           | Outcome                                   |
| --------- | ----------------------------------------------- | ----------------------------------------- |
| E2E‑DV‑01 | Double‑click node, edit text, click _Ask Agent_ | Agent output field fills; event row added |

### 5.3 Versioning

| ID        | Scenario               | Outcome                              |
| --------- | ---------------------- | ------------------------------------ |
| E2E‑VS‑01 | Click _Create Version_ | Toast success; snapshot row count +1 |
| E2E‑VS‑02 | Restore older version  | Canvas re‑loads old state            |

### 5.4 Agent Run End‑to‑End

| ID        | Scenario                 | Outcome                                                |
| --------- | ------------------------ | ------------------------------------------------------ |
| E2E‑AG‑01 | Select node, press _Run_ | Spinner shows; output panel updates; no console errors |

---

## 6. Traceability Matrix

Each test ID references a requirement ID from the Technology Stack Specification. Maintain mapping in `docs/trace_matrix.md`.

---

## 7. Toolchain Summary

- **Vitest** – unit & integration runner with JSDOM mocks.
- **Supertest** – HTTP assertions over Fastify instance.
- **Testcontainers‑Node** – ephemeral Postgres for IT.
- **Playwright** – Chromium‑based E2E; CI headless.
- **nyc / c8** – coverage reporting; target ≥ 80 % on unit logic.

---

## 8. Maintenance & CI

| Stage              | Action                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **Pre‑commit**     | `vitest --run --silent` (unit only)                                                            |
| **CI workflow**    | build images → start services (Compose) → run unit + integration → run Playwright against `ui` |
| **Failure policy** | Any red test blocks merge to `main`.                                                           |

---

_Document ID: test-plan-v1 • Last updated: 2025‑08‑04_
