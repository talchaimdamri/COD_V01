# System Patterns - Chain Workspace Application

## Architecture Patterns

### Event Sourcing Pattern
**Problem**: Need complete audit trail and undo/redo functionality
**Solution**: Store all state changes as immutable events
**Implementation**: 
- Events stored in append-only log
- State derived by replaying events
- Undo/redo implemented with past/future stacks

```typescript
interface Event {
  seq: number;
  timestamp: Date;
  actor_id: string;
  event_type: EventType;
  payload: unknown;
}
```

### Command-Query Separation
**Problem**: Mixed read/write operations complicate state management
**Solution**: Separate command handlers from query handlers
**Implementation**:
- Commands: `addNode()`, `moveNode()`, `deleteEdge()`
- Queries: `getNodeById()`, `getChainState()`, `getEventHistory()`

### Schema-First Development
**Problem**: Data contract inconsistencies between frontend/backend
**Solution**: Shared Zod schemas as single source of truth
**Implementation**:
- All data structures defined in `schemas/` package
- Runtime validation on API boundaries
- TypeScript types generated from schemas

### Dependency Injection
**Problem**: Tightly coupled components difficult to test
**Solution**: Inject dependencies through constructor/props
**Implementation**:
- Services use constructor injection
- React components use props drilling or context
- Mock implementations for testing

## Data Flow Patterns

### Unidirectional Data Flow
**Pattern**: Data flows down, events flow up
**Implementation**:
```
User Action → Event → Reducer → New State → Re-render
```

### Event Streaming
**Pattern**: Real-time updates through server-sent events
**Implementation**:
- Client subscribes to `/events?from=seq`
- Server streams new events as they occur
- Client applies events to local state

### Optimistic Updates
**Pattern**: Update UI immediately, reconcile with server
**Implementation**:
- Apply event locally first
- Send to server for persistence
- Rollback if server rejects

## UI Patterns

### Compound Components
**Pattern**: Related components work together
**Example**: `<Canvas>` + `<Node>` + `<Arrow>`
**Benefits**: Encapsulation, reusability, consistency

### Render Props
**Pattern**: Share logic between components
**Example**: `<DragContainer render={(props) => <Node {...props} />} />`
**Benefits**: Composition over inheritance

### Controlled Components
**Pattern**: Parent controls component state
**Example**: `<DocumentEditor value={content} onChange={setContent} />`
**Benefits**: Predictable state flow

## Testing Patterns

### Test Pyramid Structure
- **Unit Tests (70%)**: Pure functions, isolated components
- **Integration Tests (20%)**: API endpoints, database operations  
- **E2E Tests (10%)**: Critical user journeys

### Page Object Model
**Pattern**: Encapsulate page interactions in objects
**Benefits**: Maintainable E2E tests, reusable actions

### Arrange-Act-Assert
**Pattern**: Structure tests with clear phases
**Example**:
```typescript
// Arrange
const initialState = createEmptyGraph();
// Act
const newState = addNode(initialState, nodeData);
// Assert
expect(newState.nodes).toHaveLength(1);
```

### Test-Driven Development (TDD) Cycle
**Pattern**: Red-Green-Refactor cycle with Task Master integration
**Implementation**:
1. **test-runner** sub-agent creates failing tests for task requirements
2. **schema-keeper/ui-developer/backend-developer** implement minimal code to pass
3. **commit-bot** refactors and commits with task references
4. Repeat for each subtask within a task

## Workflow Patterns

### Task Master TDD Workflow
**Problem**: Need systematic approach to track development progress with test-first methodology
**Solution**: Task-based development with automated progress tracking
**Implementation**:

```bash
# 1. Get next available task
task-master next

# 2. Create failing tests first (test-runner sub-agent)
test(task-X): add [test type] tests for [feature]

# 3. Implement minimal code to pass (domain sub-agent)
feat(task-X): implement [component/service] with [functionality]

# 4. Commit with task reference (commit-bot)
feat(task-X): complete [subtask description]
- ✅ All tests passing
- ✅ Memory Bank updated
Closes task-X.Y
```

**Task Structure**:
- Tasks generated from PRD parsing with AI analysis
- Each task contains 4-9 TDD subtasks
- Dependencies tracked between tasks
- Progress visible through `task-master list`

**Commit Format**:
- All commits reference task numbers: `feat(task-3): implement core schemas`
- Task completion commits include comprehensive checklist
- Memory Bank automatically updated with progress

## Error Handling Patterns

### Railway-Oriented Programming
**Pattern**: Chain operations with explicit error handling
**Implementation**: Use Result<T, E> type for error propagation

### Circuit Breaker
**Pattern**: Fail fast when external service is down
**Implementation**: Track failure rates, open circuit after threshold

### Graceful Degradation
**Pattern**: Reduce functionality rather than complete failure
**Example**: Disable agent execution if AI service unavailable

## Security Patterns

### Defense in Depth
**Layers**:
1. Input validation (Zod schemas)
2. Authentication (JWT tokens)
3. Authorization (role-based access)
4. Data sanitization (DOMPurify)
5. CSP headers

### Principle of Least Privilege
**Implementation**:
- API endpoints require specific permissions
- Database queries use minimal necessary scope
- Agent execution runs in sandboxed environment

## Performance Patterns

### Lazy Loading
**Pattern**: Load resources only when needed
**Implementation**: Dynamic imports, virtual scrolling

### Memoization
**Pattern**: Cache expensive computations
**Implementation**: React.memo, useMemo, useCallback

### Resource Pooling
**Pattern**: Reuse expensive resources
**Implementation**: Database connection pooling, agent instance caching

---

*New patterns are appended to this document as they are discovered and validated in the codebase.*