-- Create enums
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'completed', 'canceled');
CREATE TYPE "PointTxType" AS ENUM ('earn', 'use', 'adjust');

-- Create tables
CREATE TABLE "admins" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "total_spent_jpy" INTEGER NOT NULL DEFAULT 0,
    "current_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_categories" (
    "id" BIGSERIAL NOT NULL,
    "name_zh" VARCHAR(80) NOT NULL,
    "name_ja" VARCHAR(80) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_packages" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT NOT NULL,
    "name_zh" VARCHAR(120) NOT NULL,
    "name_ja" VARCHAR(120) NOT NULL,
    "desc_zh" TEXT,
    "desc_ja" TEXT,
    "image_url" TEXT,
    "price_jpy" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_addons" (
    "id" BIGSERIAL NOT NULL,
    "name_zh" VARCHAR(120) NOT NULL,
    "name_ja" VARCHAR(120) NOT NULL,
    "desc_zh" TEXT,
    "desc_ja" TEXT,
    "price_jpy" INTEGER NOT NULL,
    "duration_increase_min" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "service_addons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "package_addon_links" (
    "id" BIGSERIAL NOT NULL,
    "package_id" BIGINT NOT NULL,
    "addon_id" BIGINT NOT NULL,
    CONSTRAINT "package_addon_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
    "id" BIGSERIAL NOT NULL,
    "booking_no" VARCHAR(40) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "package_id" BIGINT NOT NULL,
    "style_note" TEXT,
    "customer_note" TEXT,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "auto_cancel_at" TIMESTAMPTZ(6) NOT NULL,
    "cancel_reason" TEXT,
    "confirmed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "actual_paid_jpy" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointments_end_after_start" CHECK ("end_at" > "start_at")
);

CREATE TABLE "appointment_addons" (
    "id" BIGSERIAL NOT NULL,
    "appointment_id" BIGINT NOT NULL,
    "addon_id" BIGINT NOT NULL,
    "price_snapshot_jpy" INTEGER NOT NULL,
    "duration_snapshot_min" INTEGER NOT NULL,
    CONSTRAINT "appointment_addons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "point_ledger" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "appointment_id" BIGINT,
    "type" "PointTxType" NOT NULL,
    "points" INTEGER NOT NULL,
    "jpy_value" INTEGER NOT NULL,
    "operator_admin_id" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_hours" (
    "id" BIGSERIAL NOT NULL,
    "weekday" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL,
    "open_time" TIME(6),
    "close_time" TIME(6),
    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "special_business_dates" (
    "id" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "is_open" BOOLEAN NOT NULL,
    "open_time" TIME(6),
    "close_time" TIME(6),
    "note" TEXT,
    CONSTRAINT "special_business_dates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_settings" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX "package_addon_links_package_id_addon_id_key" ON "package_addon_links"("package_id", "addon_id");
CREATE UNIQUE INDEX "appointments_booking_no_key" ON "appointments"("booking_no");
CREATE UNIQUE INDEX "special_business_dates_date_key" ON "special_business_dates"("date");
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- Query indexes
CREATE INDEX "appointments_start_at_idx" ON "appointments"("start_at");
CREATE INDEX "appointments_status_start_at_idx" ON "appointments"("status", "start_at");
CREATE INDEX "appointments_customer_id_created_at_idx" ON "appointments"("customer_id", "created_at" DESC);

-- Foreign keys
ALTER TABLE "service_packages"
ADD CONSTRAINT "service_packages_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "package_addon_links"
ADD CONSTRAINT "package_addon_links_package_id_fkey"
FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "package_addon_links"
ADD CONSTRAINT "package_addon_links_addon_id_fkey"
FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_package_id_fkey"
FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "appointment_addons"
ADD CONSTRAINT "appointment_addons_appointment_id_fkey"
FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_addons"
ADD CONSTRAINT "appointment_addons_addon_id_fkey"
FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "point_ledger"
ADD CONSTRAINT "point_ledger_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "point_ledger"
ADD CONSTRAINT "point_ledger_appointment_id_fkey"
FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "point_ledger"
ADD CONSTRAINT "point_ledger_operator_admin_id_fkey"
FOREIGN KEY ("operator_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
