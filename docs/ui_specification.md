# UI Specification – Chain Workspace Application

_Aligned with the Technology Stack Specification (tech-stack-v1) and Design Guidelines provided._

---

## 1. Primary Screens & Layouts

### 1.1 Chain View (Default Landing Screen)

| Region              | Purpose                        | Key Components (React)                                            | Notes                                                                                                                                                            |
| ------------------- | ------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canvas**          | Visual workspace for pipelines | `<SvgCanvas>` containing `<DocumentNode>` `<AgentNode>` `<Arrow>` | Pan/zoom (wheel + ctrl); background 8‑px grid lines.                                                                                                             |
| **Left Sidebar**    | Library / navigator            | `<Sidebar>` with tabs _Chains_, _Documents_, _Agents_             | Fixed 320 px width; scrollable lists with status dots & version subtags. Includes a small collapse button (top‑left) that hides or expands the sidebar on click. |
| **Right Inspector** | Contextual settings            | `<InspectorPanel>`                                                | Hidden until a node is selected.                                                                                                                                 |

**Key Interactions**

- Drag‑drop `DocumentNode` → `AgentNode` ⇒ auto‑create `<Arrow>` + `ADD_EDGE` event.
- Click arrow ⇒ context popover (_delete_, _reverse direction_).
- Long‑press `AgentNode` ⇒ menu (_Edit Agent_, _Create Target Document_).
- Any node click ⇒ highlight + traverse upstream chain (stroke accent).

### 1.2 Document View

_Opens as a medium‑sized popup modal (≈ 70 % viewport) with background dimming; includes a maximise button to expand to full‑screen. Route `/doc/:id` is preserved for deep linking._
| Area | Details |
|------|---------|
| **Main Editor** | `<DocumentEditor>` – ProseMirror/TipTap; version selector dropdown. |
| **Input Indicator Rail** | `<DocInputList>` – compact upstream‑document badges (hover shows preview). |
| **Output Indicator Rail** | `<DocOutputList>` – compact downstream‑document badges. |
| **Toolbar** | _Ask Agent_ button (purple), Undo/Redo, Save Version. |

### 1.3 Agent Editor

Medium popup overlay `/agent/:id/edit`, with a maximise toggle that expands it to full‑screen.
| Section | Fields |
|---------|-------|
| **Header** | Agent name, enable/disable toggle, delete button. |
| **Prompt Field** | Large textarea (monospace) with **“Auto‑generate Prompt”** button. |
| **Model Selector** | Dropdown of allowed LLM models. |
| **Tools** | Multi‑select chips of registered external tools. |
| **Run Panel** | Input preview (document text) + streaming output window. |

---

## 2. Component Library Mapping

- **Node shapes:** SVG `<circle>` & `<rect>` wrapped in React components; reusable props `x,y,id,selected`.
- **Arrows:** `<line>` with marker‑end arrowhead; color encoded by data direction.
- **Context Menus:** shadcn/ui `<DropdownMenu>`; open on right‑click or long‑press.
- **Sidebars & Panels:** shadcn/ui `<Card>` with Tailwind classes `rounded-2xl shadow`.
- **Icons:** Lucide React – consistent purple (#8b5cf6).

---

## 3. Interaction Patterns & States

| Pattern       | Implementation                                                    | Feedback                                             |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| **Hover**     | `transition-colors duration-200` on nodes & buttons               | Background subtle gray (`#f1f5f9`).                  |
| **Focus**     | `ring-2 ring-purple-400` Tailwind class                           | Accessibility outline.                               |
| **Drag**      | `pointerdown` → store origin → `pointermove` update SVG transform | Ghost outline follows cursor; snap to 8 px grid.     |
| **Undo/Redo** | `Ctrl+Z` / `Ctrl+Shift+Z`                                         | Toast message + revert animation (node slides back). |

---

## 4. Colour & Typography Reference

- **Font:** Inter 400 / 500 / 600.
- **Palette:**  
  – `#1e293b` primary text  
  – `#64748b` secondary  
  – `#94a3b8` tertiary  
  – `#8b5cf6` accent  
  – `#f8fafc` secondary surface  
  – `#e2e8f0` borders.
- **Sizes:** 12 px small / 14 px body / 16 px sidebar headers / 20 px modal titles / 24 px main page h1.

---

## 5. Accessibility & Responsiveness

- **Contrast** ≥ 4.5:1 for text vs background.
- **Keyboard Nav:** All interactive elements reachable via Tab; canvas supports arrow‑key nudge of selected node.
- **Responsive Breakpoint:** ≥ 1280 px full layout; below 960 px sidebars collapse into slide‑over drawers.

---

## 6. Error & Loading States

| Context      | State   | UI Treatment                                                  |
| ------------ | ------- | ------------------------------------------------------------- |
| Agent run    | Loading | Button shows spinner; Inspector panel displays animated dots. |
| Save version | Success | Toast “Version saved (#12)”.                                  |
| API error    | Failure | Toast red; Inspector highlights invalid fields.               |

---

## 7. Future Enhancements (Deferred)

1. **Mini‑map** overlay for large chains.
2. **Realtime cursors** when multi‑user mode enabled (requires WebSocket).
3. **Dark mode** via Tailwind `dark:` variant.

---

_Document ID: ui-spec-v1 • Last updated: 2025‑08‑04_
