## 1. Executive Summary

_Chain of Docs_ is a web application that enables users to visually build, run, and monitor LLM‑powered **document** and **agent** pipelines on an interactive canvas. The system currently supports single‑user work, but it is architected for horizontal scalability and real‑time collaboration in future milestones. The MVP focuses on chain creation, agent execution, document versioning, and a smooth desktop experience.

## 2. Project Goals

1. Enable rapid visual creation of chains that combine input documents, processing agents, and output documents.
2. Provide a rich document editor with full version history and Undo/Redo.
3. Allow manual agent runs on documents with live previews of the results.
4. Lay a scalable foundation for future real‑time collaboration and multi‑process execution.

## 3. Problem & Opportunity

Today each document is authored in isolation—often across separate tools such as Google Docs, Excel, Figma, or Jira—with **no reliable linkage between them**. A minor change to one artifact (e.g., a user‑persona tweak) requires manual, error‑prone updates to every dependent PRD, UI spec, test case, and task list. This fragmentation causes version drift, duplicate effort, and costly mis‑alignment. _Chain Workspace_ establishes a single source of truth that keeps documents interconnected and auto‑propagates updates, eliminating manual sync work.

## 4. Target Audiences (Personas)

- **Content Manager** – wants to quickly generate multiple versions of an article.
- **Market Researcher** – runs text analytics on customer reviews.
- **Internal Automation Developer** – builds cross‑system pipelines using LLM tools.

## 5. Core Use‑Cases (User Stories)

1. _As a Content Manager_ I drag a document file onto the canvas, connect it to a “Rewrite” agent, and receive an improved version ready for publication.
2. _As a Market Researcher_ I run a “Sentiment” agent on a collection of comments and get a categorized report.
3. _As a Developer_ I create a manual snapshot of a document before editing so I can compare later.

## 5.1 End‑to‑End Example Workflow ("Triple‑Doc Pipeline")

1. **Client Definition** screen collects business context and produces a **User Journey** document.
2. **Product Definition** screen gathers product details and outputs a **Technology Stack** document.
3. **Market Research** screen aggregates external sources and generates a **Tech Landscape Report**.

**Synthesis Stage**: An _Auto‑Synthesis_ agent merges the _User Journey_ and _Technology Stack_ documents into an initial **PRD Draft**.

**Post‑processing**:
4\. A _Process Guidelines_ template converts the PRD into a **Work Procedures** document.
5\. An _Agents & Instructions_ template extracts reusable prompts into an **Agents Specification** doc.
6\. A _TaskMasterAI_ agent transforms the combined docs into an actionable **Task List** (epics → tasks → subtasks) ready for import into PM tools.

> _Outcome_: Users obtain a coherent PRD, governance docs, and a task backlog in minutes.

## 5.2 Additional Chained Workflows

| Persona               | Document Chain                                                                        | Resulting Artifacts                                                  |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Product Developer** | Client Definition → User Journey → Product Definition → Tech Stack                    | **Detailed PRD** → Work‑Guidelines Document → TaskMasterAI Task List |
| **Product Manager**   | AI‑powered Market Research → Product Definition → ICP (Ideal Customer Profile)        | Market Insights Pack → Product Brief → Linked ICP Document           |
| **Project Manager**   | Project Brief (constraints & resources) → Tender (RFP) → Bill of Quantities → Job Ads | Procurement Package, BOQ, Recruitment Assets                         |

These chains show how multiple stand‑alone documents become a cohesive, auto‑synchronized bundle within the canvas, reducing manual updates and ensuring alignment.

## 6. Functional Requirements

### 6.1 Chain View

- SVG canvas with pan/zoom and an 8‑px background grid.
- Object library (left sidebar) listing Chains, Documents, Agents; fixed width 320 px; collapsible.
- Right‑hand inspector opens only when a _AgentNode_ is selected.
- Drag‑and‑drop of a _DocumentNode_ onto an _AgentNode_ automatically creates an edge.
- Long‑press on an _AgentNode_ opens an **Edit/Delete** menu. fileciteturn0file1
- **Double‑click** on a _DocumentNode_ opens its editor modal directly from the Chain View.

### 6.2 Document View

- TipTap‑based editor in a modal dialog 70 % width, with a fullscreen _Maximize_ option.
- Rails showing upstream/downstream documents.
- Toolbar with **Ask Agent**, **Undo/Redo**, **Save Version**. fileciteturn0file1
   

### 6.3 Agent Editor

- Popup overlay for editing the prompt, selecting the model, and helper tools.
- **Auto‑generate Prompt** button.
- Run window streaming agent output. fileciteturn0file1

## 7. Non‑Functional Requirements

- **Front‑End:** React 18 with Vite and Tailwind; all graphics in SVG.
- **Back‑End:** Node.js 20 + TypeScript + Fastify with Zod schema validation.
- **Persistence:** PostgreSQL 16; append‑only event log.
- **Containerisation:** Docker + Compose with _dev_/ _production_ profiles.
- **Performance:** Load canvas < 1 s for 100 nodes; agent run latency < 3 s (LLM latency dependent).
- **Security:** JWT stored in an _httpOnly_ cookie; Adminer accessible only in _dev_ profile. fileciteturn0file0

## 8. MVP (Release 0.1)

| Area                    | Included | Notes                                   |
| ----------------------- | -------- | --------------------------------------- |
| Chain View              | ✔       | No mini‑map, no real‑time cursors       |
| Document Editor         | ✔       | Editing, versioning, manual _Ask Agent_ |
| Agent Editor            | ✔       | Manual runs only, no cron scheduler     |
| Authentication          | ✖       | JWT placeholder; not part of MVP        |
| Real‑time Collaboration | ✖       | Added in a later milestone              |
| Binary Assets           | ✖       | MinIO/S3 out of MVP                     |

## 9. Out of Scope

- Real‑time shared canvas (WebSockets).
- Scale‑out multi‑process with Redis.
- Mini‑map view and dark mode.
- Mobile < 960 px (desktop only). fileciteturn0file0turn0file1

## 10. Success Metrics (KPIs)

- Average time to first chain run < 5 minutes for a new user.
- ≥ 90 % of users keep at least one chain after 7 days.
- NPS ≥ 40 in beta.

## 11. Assumptions & Dependencies

- Access to the OpenAI API is 99.5 % reliable.
- Users have basic knowledge of LLM prompting.
- The team holds a Fly.io account for deployment.

## 12. Risks

- Changes in LLM API pricing could raise operating costs.
- Large canvases (high node count) may impact performance in older browsers.
- Browser compatibility for SVG drag events.

## 13. Proposed Timeline

| Deadline    | Milestone            |
| ----------- | -------------------- |
| 01‑Oct‑2025 | Design Freeze        |
| 01‑Dec‑2025 | MVP Feature Complete |
| 15‑Dec‑2025 | External Beta Test   |
| 15‑Jan‑2026 | Public Launch        |

## 14. Appendices

- **Technology Stack Specification** – _tech‑stack‑v1_. fileciteturn0file0
- **UI Specification** – _ui‑spec‑v1_. fileciteturn0file1

_Document version: ****\*\*****prd‑v0.4****\*\***** • Last updated: 2025‑08‑05_
