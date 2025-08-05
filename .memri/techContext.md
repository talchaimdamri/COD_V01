# Technical Context - Chain Workspace Application

## Technology Stack Decisions

### Frontend Stack

**Decision**: React 18 + Vite + Tailwind CSS
**Rationale**:

- React 18: Mature ecosystem, excellent TypeScript support, concurrent features
- Vite: Fast development server, optimized builds, modern tooling
- Tailwind: Utility-first CSS, consistent design system, minimal bundle impact

**Alternatives Considered**:

- Vue 3: Good but smaller ecosystem for enterprise
- Angular: Too heavy for rapid prototyping
- Vanilla CSS: Too much boilerplate for design system

### Backend Stack

**Decision**: Node.js 20 + TypeScript + Fastify
**Rationale**:

- Node.js 20: LTS version with modern features, excellent performance
- TypeScript: Static typing reduces runtime errors, better IDE support
- Fastify: Lightweight, fast, plugin ecosystem, schema validation

**Alternatives Considered**:

- Express: Too minimal, requires too many additional packages
- Koa: Good but smaller ecosystem than Fastify
- Deno: Too new, limited package ecosystem

### Database Stack

**Decision**: PostgreSQL 16 + Prisma ORM
**Rationale**:

- PostgreSQL 16: ACID compliance, JSON support, excellent performance
- Prisma: Type-safe queries, migration management, introspection

**Alternatives Considered**:

- MySQL: Less advanced JSON support
- SQLite: Not suitable for concurrent access
- MongoDB: Poor consistency guarantees for financial data

### Validation Stack

**Decision**: Zod for all data validation
**Rationale**:

- Runtime type checking matches TypeScript types
- Excellent error messages for debugging
- Composable schemas for complex validation

**Alternatives Considered**:

- Joi: Less TypeScript integration
- Yup: Older API design, less composable
- Ajv: JSON Schema complexity overhead

### Testing Stack

**Decision**: Vitest + Supertest + Playwright
**Rationale**:

- Vitest: Fast, modern replacement for Jest with better ES modules support
- Supertest: De facto standard for API testing, excellent Express/Fastify integration
- Playwright: Reliable E2E testing, better than Selenium for modern web apps

**Alternatives Considered**:

- Jest: Slower than Vitest, ES modules issues
- Cypress: Good but Playwright has better debugging
- Puppeteer: Lower level than needed

### Containerization Stack

**Decision**: Docker + Docker Compose
**Rationale**:

- Industry standard for containerization
- Excellent local development experience
- Easy deployment to any container platform

**Alternatives Considered**:

- Podman: Compatible but less ecosystem support
- Vagrant: VM overhead too high
- Local installation: Environment inconsistencies

## Development Tool Decisions

### Code Quality Tools

**ESLint + Prettier + Husky**

- ESLint: Catch potential bugs and enforce code style
- Prettier: Consistent code formatting across team
- Husky: Git hooks ensure quality gates are enforced

### IDE Integration

**VS Code Extensions**:

- TypeScript support
- Prettier formatting
- ESLint linting
- Tailwind CSS IntelliSense
- Prisma syntax highlighting

### Build Tools

**Decision**: Native TypeScript compilation + Vite bundling
**Rationale**: Faster than webpack, better tree shaking, modern output

## Infrastructure Decisions

### Development Environment

**Docker Compose** for local development:

- PostgreSQL container for database
- Adminer container for database GUI
- Redis container for future caching needs
- Volume mounts for live code reloading

### CI/CD Pipeline

**GitHub Actions** for automation:

- Matrix builds for multiple Node.js versions
- Parallel test execution
- Docker image building and publishing
- Automated dependency updates with Dependabot

### Deployment Strategy

**Single-container deployment** for v1:

- Fly.io for hosting (future consideration)
- Environment-based configuration
- Health checks and graceful shutdown
- Log aggregation to stdout

## Performance Considerations

### Bundle Optimization

- Code splitting at route level
- Dynamic imports for heavy components
- Tree shaking for unused code elimination
- Asset optimization (images, fonts)

### Database Optimization

- Proper indexing strategy
- Connection pooling
- Query optimization
- Read replicas for future scaling

### Caching Strategy

**Current**: In-memory caching with TTL
**Future**: Redis for distributed caching
**CDN**: Static assets served from edge locations

## Security Decisions

### Authentication

**JWT tokens in httpOnly cookies**:

- Prevents XSS attacks on tokens
- Automatic inclusion in requests
- Secure transmission over HTTPS

### Input Validation

**Multi-layer validation**:

1. Client-side for UX (Zod schemas)
2. Server-side for security (same Zod schemas)
3. Database constraints as final safety net

### Content Security Policy

**Strict CSP headers**:

- Prevent XSS attacks
- Control resource loading
- Monitor policy violations

## Monitoring and Observability

### Logging Strategy

**Structured JSON logging**:

- Pino for high-performance logging
- Correlation IDs for request tracing
- Log levels for filtering
- Centralized log collection

### Error Tracking

**Error boundary patterns**:

- React error boundaries for UI errors
- Global error handlers for unhandled exceptions
- User-friendly error pages
- Automatic error reporting

### Performance Monitoring

**Web Vitals tracking**:

- Core Web Vitals measurement
- Real user monitoring
- Performance budgets in CI
- Lighthouse scoring in pipeline

### 2025-08-05: Sub-Agent Format Modernization

**Decision**: Updated all 5 sub-agents to new Claude Code agent format
**Changes**:

- Removed `tools` field from YAML frontmatter (deprecated)
- Added `model: sonnet` specification for consistent model usage
- Enhanced descriptions with concrete examples using `<example>` and `<commentary>` tags
- Improved agent invocation patterns with clear use-case scenarios

**Impact**: Better agent delegation, clearer usage examples, modern format compatibility
**Files Updated**: test-runner.md, schema-keeper.md, ui-developer.md, commit-bot.md, backend-developer.md

---

_Technology decisions are documented chronologically to maintain decision context and rationale._
