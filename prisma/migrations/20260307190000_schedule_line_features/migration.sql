-- Create enums
CREATE TYPE "LineMessageDirection" AS ENUM ('incoming', 'outgoing', 'system');
CREATE TYPE "LineMessageStatus" AS ENUM ('received', 'queued', 'sent', 'failed');

-- Create tables
CREATE TABLE "booking_blocks" (
    "id" BIGSERIAL NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(255),
    "created_by_admin_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "booking_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_blocks_end_after_start" CHECK ("end_at" > "start_at")
);

CREATE TABLE "line_users" (
    "id" BIGSERIAL NOT NULL,
    "line_user_id" VARCHAR(120) NOT NULL,
    "customer_id" BIGINT,
    "display_name" VARCHAR(120),
    "picture_url" TEXT,
    "status_message" TEXT,
    "is_following" BOOLEAN NOT NULL DEFAULT true,
    "linked_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "line_messages" (
    "id" BIGSERIAL NOT NULL,
    "line_user_id" BIGINT NOT NULL,
    "direction" "LineMessageDirection" NOT NULL,
    "status" "LineMessageStatus" NOT NULL DEFAULT 'received',
    "message_type" VARCHAR(40) NOT NULL,
    "text" TEXT,
    "raw_json" JSONB,
    "sent_by_admin_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "line_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "line_link_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token" VARCHAR(120) NOT NULL,
    "line_user_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "line_link_tokens_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "line_users_line_user_id_key" ON "line_users"("line_user_id");
CREATE UNIQUE INDEX "line_users_customer_id_key" ON "line_users"("customer_id");
CREATE UNIQUE INDEX "line_link_tokens_token_key" ON "line_link_tokens"("token");

-- Query indexes
CREATE INDEX "booking_blocks_start_at_idx" ON "booking_blocks"("start_at");
CREATE INDEX "booking_blocks_end_at_idx" ON "booking_blocks"("end_at");
CREATE INDEX "booking_blocks_start_at_end_at_idx" ON "booking_blocks"("start_at", "end_at");
CREATE INDEX "line_messages_line_user_id_created_at_idx" ON "line_messages"("line_user_id", "created_at" DESC);
CREATE INDEX "line_messages_created_at_idx" ON "line_messages"("created_at" DESC);
CREATE INDEX "line_link_tokens_customer_id_expires_at_idx" ON "line_link_tokens"("customer_id", "expires_at");
CREATE INDEX "line_link_tokens_line_user_id_expires_at_idx" ON "line_link_tokens"("line_user_id", "expires_at");

-- Foreign keys
ALTER TABLE "booking_blocks"
ADD CONSTRAINT "booking_blocks_created_by_admin_id_fkey"
FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "line_users"
ADD CONSTRAINT "line_users_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "line_messages"
ADD CONSTRAINT "line_messages_line_user_id_fkey"
FOREIGN KEY ("line_user_id") REFERENCES "line_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "line_messages"
ADD CONSTRAINT "line_messages_sent_by_admin_id_fkey"
FOREIGN KEY ("sent_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "line_link_tokens"
ADD CONSTRAINT "line_link_tokens_line_user_id_fkey"
FOREIGN KEY ("line_user_id") REFERENCES "line_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "line_link_tokens"
ADD CONSTRAINT "line_link_tokens_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
