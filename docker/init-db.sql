-- ═══════════════════════════════════════════════════════════
-- Leon Bookmarks - Database Initialization
-- Enables required extensions and sets up RLS policies
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════
-- Row-Level Security (RLS) Policies
-- Applied after Prisma migrations create the tables
-- ═══════════════════════════════════════════════════════════

-- Function to get current tenant ID from session variable
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: RLS policies will be applied via a migration script
-- after Prisma creates the tables. See:
-- apps/api/prisma/migrations/setup_rls.sql
