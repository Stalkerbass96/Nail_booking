-- Change system_settings.value from VARCHAR(255) to TEXT to support longer LINE message templates
ALTER TABLE "system_settings" ALTER COLUMN "value" TYPE TEXT;
