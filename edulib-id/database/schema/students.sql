-- Tabela de alunos
-- Compativel com PostgreSQL / Supabase.

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration TEXT NOT NULL UNIQUE,
    class_group TEXT,
    email TEXT,
    photo TEXT,                -- data URL ou URL de storage
    face_descriptor JSONB,     -- descritor facial serializado
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_registration ON students (registration);
CREATE INDEX IF NOT EXISTS idx_students_class_group ON students (class_group);
