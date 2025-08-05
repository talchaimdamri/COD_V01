# Tests Directory

## Structure

- `unit/` - Pure function and component tests (Vitest)
- `integration/` - API and database tests (Supertest + Testcontainers)
- `e2e/` - Full user journey tests (Playwright)

## Guidelines

- Follow TDD: tests written before implementation
- Maintain ≥80% code coverage
- Use descriptive test names (Given/When/Then)
- Keep tests deterministic and independent
