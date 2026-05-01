-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_name TEXT,
  category TEXT,
  objective TEXT,
  benefits JSONB DEFAULT '[]',
  differentials JSONB DEFAULT '[]',
  offer TEXT,
  affiliate_url TEXT,
  keywords JSONB DEFAULT '[]',
  ad_groups JSONB DEFAULT '[]',
  extensions JSONB DEFAULT '{}',
  negative_keywords JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'exported')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ
);

-- Page analyses table (cache)
CREATE TABLE IF NOT EXISTS page_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analyses_user_id ON page_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analyses_url ON page_analyses(url);
CREATE INDEX IF NOT EXISTS idx_page_analyses_cache_expires ON page_analyses(cache_expires_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- RLS Policies for campaigns
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- RLS Policies for page_analyses
CREATE POLICY "Users can view own analyses"
  ON page_analyses FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own analyses"
  ON page_analyses FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own analyses"
  ON page_analyses FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role full access users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access campaigns"
  ON campaigns FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access analyses"
  ON page_analyses FOR ALL
  USING (auth.role() = 'service_role');
