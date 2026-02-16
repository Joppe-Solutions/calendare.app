-- Add subscription fields to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_id ON businesses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_businesses_plan_id ON businesses(plan_id);