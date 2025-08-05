-- Initialize Chain Workspace Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for advanced indexing
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone to UTC
SET timezone = 'UTC';

-- Grant permissions to the database user
GRANT ALL PRIVILEGES ON DATABASE chainworkspace TO chainuser;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Chain Workspace database initialized successfully';
END $$;