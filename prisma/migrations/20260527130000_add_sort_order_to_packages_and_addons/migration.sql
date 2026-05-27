-- AddColumn: service_packages.sort_order
ALTER TABLE "service_packages" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AddColumn: service_addons.sort_order
ALTER TABLE "service_addons" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
