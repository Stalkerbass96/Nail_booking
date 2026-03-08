-- Create enums
CREATE TYPE "CustomerType" AS ENUM ('lead', 'active');
CREATE TYPE "CustomerCreatedFrom" AS ENUM ('line', 'admin', 'legacy_web');
CREATE TYPE "AppointmentSourceChannel" AS ENUM ('line_showcase', 'admin_manual', 'legacy_web');

-- Alter customers
ALTER TABLE "customers"
  ADD COLUMN "customer_type" "CustomerType" NOT NULL DEFAULT 'lead',
  ADD COLUMN "created_from" "CustomerCreatedFrom" NOT NULL DEFAULT 'legacy_web',
  ADD COLUMN "first_booked_at" TIMESTAMPTZ(6),
  ALTER COLUMN "email" DROP NOT NULL;

DROP INDEX IF EXISTS "customers_email_key";
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_customer_type_idx" ON "customers"("customer_type");

-- Alter line users
ALTER TABLE "line_users"
  ADD COLUMN "home_entry_token" VARCHAR(120),
  ADD COLUMN "welcome_sent_at" TIMESTAMPTZ(6),
  ADD COLUMN "last_home_link_sent_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "line_users_home_entry_token_key" ON "line_users"("home_entry_token");

-- Create showcase items
CREATE TABLE "showcase_items" (
  "id" BIGSERIAL NOT NULL,
  "category_id" BIGINT NOT NULL,
  "service_package_id" BIGINT NOT NULL,
  "title_zh" VARCHAR(120) NOT NULL,
  "title_ja" VARCHAR(120) NOT NULL,
  "description_zh" TEXT,
  "description_ja" TEXT,
  "image_url" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "showcase_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "showcase_items_category_id_sort_order_idx" ON "showcase_items"("category_id", "sort_order");
CREATE INDEX "showcase_items_service_package_id_idx" ON "showcase_items"("service_package_id");
CREATE INDEX "showcase_items_is_published_sort_order_idx" ON "showcase_items"("is_published", "sort_order");

ALTER TABLE "showcase_items"
  ADD CONSTRAINT "showcase_items_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "showcase_items"
  ADD CONSTRAINT "showcase_items_service_package_id_fkey"
  FOREIGN KEY ("service_package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Alter appointments
ALTER TABLE "appointments"
  ADD COLUMN "showcase_item_id" BIGINT,
  ADD COLUMN "source_channel" "AppointmentSourceChannel" NOT NULL DEFAULT 'legacy_web';

CREATE INDEX "appointments_showcase_item_id_idx" ON "appointments"("showcase_item_id");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_showcase_item_id_fkey"
  FOREIGN KEY ("showcase_item_id") REFERENCES "showcase_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill customer lifecycle state
UPDATE "customers" c
SET
  "customer_type" = CASE
    WHEN EXISTS (SELECT 1 FROM "appointments" a WHERE a."customer_id" = c."id") THEN 'active'::"CustomerType"
    ELSE 'lead'::"CustomerType"
  END,
  "first_booked_at" = (
    SELECT MIN(a."created_at")
    FROM "appointments" a
    WHERE a."customer_id" = c."id"
  ),
  "created_from" = CASE
    WHEN EXISTS (SELECT 1 FROM "line_users" lu WHERE lu."customer_id" = c."id") THEN 'line'::"CustomerCreatedFrom"
    ELSE 'legacy_web'::"CustomerCreatedFrom"
  END;
