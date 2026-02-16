-- Add subscription fields to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Add payment settings to businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_access_token TEXT,
ADD COLUMN IF NOT EXISTS payment_public_key TEXT,
ADD COLUMN IF NOT EXISTS payment_webhook_secret VARCHAR(255);

-- Add service enhancements
ALTER TABLE services
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'on_site',
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 0;

-- Add payment fields to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_amount_cents INTEGER,
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_id ON businesses(subscription_id);
CREATE INDEX IF NOT EXISTS idx_businesses_plan_id ON businesses(plan_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointments(payment_id);