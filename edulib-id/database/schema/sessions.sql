-- Sessao = registro de entrada ou saida da biblioteca

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
    method TEXT NOT NULL DEFAULT 'manual' CHECK (method IN ('face', 'qr', 'manual')),
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_student ON sessions (student_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions (type);
