# API Directory

## Structure

- `routes/` - Fastify route handlers
- `services/` - Business logic and external integrations
- `middleware/` - Authentication, validation, error handling
- `db/` - Database client and utilities

## Guidelines

- All routes must use Zod schema validation
- Implement proper error handling with correlation IDs
- Follow RESTful API conventions
- Maintain response time < 100ms for 95th percentile
