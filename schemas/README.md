# Schemas Directory

## Structure

- `events/` - Event sourcing schemas (ADD_NODE, MOVE_NODE, etc.)
- `api/` - API request/response schemas
- `database/` - Database entity schemas

## Guidelines

- All schemas use Zod for runtime validation
- Export TypeScript types from Zod schemas
- Maintain backward compatibility
- Document breaking changes in CHANGELOG.md
