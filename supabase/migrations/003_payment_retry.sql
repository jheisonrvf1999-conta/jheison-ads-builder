-- Migration 003: Add payment retry counter to subscriptions

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER NOT NULL DEFAULT 0;
