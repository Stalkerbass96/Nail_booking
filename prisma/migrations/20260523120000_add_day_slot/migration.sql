-- CreateTable
CREATE TABLE "day_slots" (
    "id" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "day_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "day_slots_date_slot_key" ON "day_slots"("date", "slot");

-- CreateIndex
CREATE INDEX "day_slots_date_idx" ON "day_slots"("date");
