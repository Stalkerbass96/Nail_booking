-- Create table
CREATE TABLE "line_link_sessions" (
    "id" BIGSERIAL NOT NULL,
    "session_token" VARCHAR(120) NOT NULL,
    "line_user_id" BIGINT NOT NULL,
    "line_link_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "line_link_sessions_pkey" PRIMARY KEY ("id")
);

-- Constraints
CREATE UNIQUE INDEX "line_link_sessions_session_token_key" ON "line_link_sessions"("session_token");
CREATE INDEX "line_link_sessions_line_user_id_expires_at_idx" ON "line_link_sessions"("line_user_id", "expires_at");
CREATE INDEX "line_link_sessions_expires_at_idx" ON "line_link_sessions"("expires_at");

ALTER TABLE "line_link_sessions"
ADD CONSTRAINT "line_link_sessions_line_user_id_fkey"
FOREIGN KEY ("line_user_id") REFERENCES "line_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
