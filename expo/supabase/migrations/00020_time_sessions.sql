-- ============================================================================
-- TIME SESSIONS TABLE
-- Tracks time spent on projects (via timer or manual entry)
-- ============================================================================

CREATE TABLE project_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,  -- Matches projects.id (TEXT from migration 00009)

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('timer', 'manual')),

  -- Optional metadata
  note TEXT,

  -- Standard timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes >= 0),
  CONSTRAINT valid_time_range CHECK (ended_at >= started_at)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast lookup by project (most common query)
CREATE INDEX idx_time_sessions_project ON project_time_sessions(project_id);

-- Fast lookup by user (for aggregations)
CREATE INDEX idx_time_sessions_user ON project_time_sessions(user_id);

-- Fast ordering by date
CREATE INDEX idx_time_sessions_started_at ON project_time_sessions(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE project_time_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can select own sessions"
  ON project_time_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON project_time_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
  ON project_time_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON project_time_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER set_updated_at_time_sessions
  BEFORE UPDATE ON project_time_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE REALTIME (for Pro users)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE project_time_sessions;

-- ============================================================================
-- COMMENT
-- ============================================================================

COMMENT ON TABLE project_time_sessions IS 'Stores time tracking sessions for projects. Each session has a start/end time, duration in minutes, and optional note.';
