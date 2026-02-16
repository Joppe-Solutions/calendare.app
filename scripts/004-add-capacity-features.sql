-- Add capacity and booking features for boat tours / shared services

-- Add capacity and pricing type to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type TEXT DEFAULT 'total' CHECK (price_type IN ('total', 'per_person'));
ALTER TABLE services ADD COLUMN IF NOT EXISTS meeting_point TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS meeting_instructions TEXT;

-- Add spots (number of people) to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS spots INTEGER DEFAULT 1;

-- Add business settings
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS show_weather_warning BOOLEAN DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS requires_advance_payment BOOLEAN DEFAULT false;

-- Create index for faster capacity queries
CREATE INDEX IF NOT EXISTS idx_appointments_business_time ON appointments(business_id, start_time, end_time);
