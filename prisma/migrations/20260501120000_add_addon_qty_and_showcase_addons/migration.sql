-- Add maxQty to service_addons
ALTER TABLE "service_addons" ADD COLUMN "max_qty" INTEGER NOT NULL DEFAULT 1;

-- Add qty to appointment_addons
ALTER TABLE "appointment_addons" ADD COLUMN "qty" INTEGER NOT NULL DEFAULT 1;

-- Create showcase_item_addons table
CREATE TABLE "showcase_item_addons" (
    "id" BIGSERIAL NOT NULL,
    "showcase_item_id" BIGINT NOT NULL,
    "addon_id" BIGINT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "showcase_item_addons_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one row per showcase_item + addon combination
CREATE UNIQUE INDEX "showcase_item_addons_showcase_item_id_addon_id_key"
    ON "showcase_item_addons"("showcase_item_id", "addon_id");

-- Foreign keys
ALTER TABLE "showcase_item_addons"
    ADD CONSTRAINT "showcase_item_addons_showcase_item_id_fkey"
    FOREIGN KEY ("showcase_item_id") REFERENCES "showcase_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "showcase_item_addons"
    ADD CONSTRAINT "showcase_item_addons_addon_id_fkey"
    FOREIGN KEY ("addon_id") REFERENCES "service_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
