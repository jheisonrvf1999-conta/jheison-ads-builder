-- ============================================================
-- Migration 002: Extensions — Google Ads, Subscriptions,
--                Performance Tracking, Audit Logs
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Extend the users table
-- ────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_oauth_token   TEXT,          -- AES-256 encrypted
  ADD COLUMN IF NOT EXISTS google_ads_connected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at           TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────
-- 2. Extend the campaigns table
-- ────────────────────────────────────────────────────────────
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS google_ads_campaign_id TEXT,
  ADD COLUMN IF NOT EXISTS estimated_cpc          DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS real_cpc               DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cpc_deviation          DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS sync_status            TEXT CHECK (sync_status IN ('synced', 'diverged', 'pending')),
  ADD COLUMN IF NOT EXISTS last_sync_at           TIMESTAMPTZ;

-- Update campaigns status enum to include 'synced'
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_status_check;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_status_check
    CHECK (status IN ('draft', 'active', 'exported', 'synced'));

-- ────────────────────────────────────────────────────────────
-- 3. Subscriptions table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                  TEXT NOT NULL DEFAULT 'free'
                          CHECK (plan IN ('free', 'pro', 'enterprise')),
  stripe_customer_id    TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end    TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 4. Campaign performance table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_performance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  keyword       TEXT NOT NULL,
  estimated_cpc DECIMAL(10,2) NOT NULL,
  real_cpc      DECIMAL(10,2),
  impressions   INTEGER,
  clicks        INTEGER,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 5. Audit logs table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 6. Indexes
-- ────────────────────────────────────────────────────────────

-- users
CREATE INDEX IF NOT EXISTS idx_users_google_ads_connected ON users (google_ads_connected)
  WHERE google_ads_connected = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- campaigns (new columns)
CREATE INDEX IF NOT EXISTS idx_campaigns_google_ads_campaign_id ON campaigns (google_ads_campaign_id)
  WHERE google_ads_campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_sync_status ON campaigns (sync_status)
  WHERE sync_status IS NOT NULL;

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id          ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer  ON subscriptions (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub       ON subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_status           ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan             ON subscriptions (plan);

-- campaign_performance
CREATE INDEX IF NOT EXISTS idx_campaign_perf_campaign_id  ON campaign_performance (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_perf_keyword      ON campaign_performance (keyword);
CREATE INDEX IF NOT EXISTS idx_campaign_perf_recorded_at  ON campaign_performance (recorded_at DESC);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status     ON audit_logs (status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 7. updated_at trigger for subscriptions
-- ────────────────────────────────────────────────────────────

-- Reuse the trigger function created in 001_initial.sql if it exists,
-- otherwise create it here.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────
-- 8. Row-Level Security (RLS)
-- ────────────────────────────────────────────────────────────

-- ── subscriptions ──────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription row (initial free plan)
CREATE POLICY "subscriptions_insert_own"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription row
CREATE POLICY "subscriptions_update_own"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role has unrestricted access (bypasses RLS by default,
-- but explicit policies make intent clear when using the anon key
-- with elevated grants for webhooks).
CREATE POLICY "subscriptions_service_role_all"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── campaign_performance ───────────────────────────────────
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;

-- Users can select performance data for their own campaigns
CREATE POLICY "campaign_perf_select_own"
  ON campaign_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_performance.campaign_id
        AND c.user_id = auth.uid()
    )
  );

-- Users can insert performance data for their own campaigns
CREATE POLICY "campaign_perf_insert_own"
  ON campaign_performance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns c
      WHERE c.id = campaign_performance.campaign_id
        AND c.user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "campaign_perf_service_role_all"
  ON campaign_performance FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── audit_logs ─────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs (read-only)
CREATE POLICY "audit_logs_select_own"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only the service role may write audit logs
CREATE POLICY "audit_logs_service_role_all"
  ON audit_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
