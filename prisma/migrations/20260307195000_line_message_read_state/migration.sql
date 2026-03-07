-- Add read state for LINE messages
ALTER TABLE "line_messages"
ADD COLUMN "read_at" TIMESTAMPTZ(6);

CREATE INDEX "line_messages_line_user_id_read_at_idx"
ON "line_messages"("line_user_id", "read_at");
