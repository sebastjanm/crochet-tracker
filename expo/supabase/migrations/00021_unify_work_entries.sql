-- ============================================================================
-- UNIFY WORK ENTRIES
-- Make duration_minutes nullable to support note-only entries (journal-style)
-- This unifies Journal entries and Time sessions into one model
-- ============================================================================

-- Step 1: Make duration_minutes nullable
ALTER TABLE project_time_sessions
  ALTER COLUMN duration_minutes DROP NOT NULL;

-- Step 2: Update the valid_duration constraint to allow NULL
ALTER TABLE project_time_sessions
  DROP CONSTRAINT IF EXISTS valid_duration;

ALTER TABLE project_time_sessions
  ADD CONSTRAINT valid_duration
  CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

-- Step 3: Add constraint ensuring at least duration OR note is present
-- This prevents empty entries
ALTER TABLE project_time_sessions
  ADD CONSTRAINT requires_content
  CHECK (duration_minutes IS NOT NULL OR note IS NOT NULL);

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE project_time_sessions IS 'Unified work entries for projects. Can be timer sessions (with duration), manual time entries (with duration + optional note), or note-only entries (journal-style, null duration).';
