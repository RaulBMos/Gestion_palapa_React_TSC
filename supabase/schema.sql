-- ============================================================
-- CasaGestión Database Schema for Supabase
-- Version: 1.0.0
-- Date: 2026-01-31
-- Description: Complete schema for PWA rental management system
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  phone TEXT NOT NULL CHECK (char_length(phone) >= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete support
  
  -- Metadata for sync
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
  ) STORED
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  cabin_count INTEGER NOT NULL CHECK (cabin_count > 0 AND cabin_count <= 20),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  adults INTEGER NOT NULL DEFAULT 1 CHECK (adults >= 0),
  children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('Información', 'Confirmada', 'Completada', 'Cancelada')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prevent overlapping reservations (business rule)
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_guest_count CHECK (adults + children > 0)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('Ingreso', 'Gasto')),
  category TEXT NOT NULL CHECK (char_length(category) >= 2),
  description TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Transferencia')),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Metadata
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- System Configuration Table (for app settings like total_cabins)
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (Performance optimization)
-- ============================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_clients_deleted ON clients(deleted_at);

-- Reservations indexes
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON reservations(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(start_date, end_date) WHERE deleted_at IS NULL AND status != 'Cancelada';
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_archived ON reservations(is_archived) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_deleted ON reservations(deleted_at);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_reservation ON transactions(reservation_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_deleted ON transactions(deleted_at);

-- System Config indexes
CREATE INDEX IF NOT EXISTS idx_system_config_user_id ON system_config(user_id);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Clients RLS policies
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Reservations RLS policies
CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own reservations"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own reservations"
  ON reservations FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions RLS policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- System Config RLS policies
CREATE POLICY "Users can view their own config"
  ON system_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON system_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON system_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================

-- Function to check cabin availability for a date range
CREATE OR REPLACE FUNCTION check_cabin_availability(
  p_start_date DATE,
  p_end_date DATE,
  p_cabin_count INTEGER,
  p_total_cabins INTEGER,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS TABLE(date DATE, available_cabins INTEGER, occupied_cabins INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date - INTERVAL '1 day', INTERVAL '1 day')::DATE AS check_date
  ),
  occupied_per_date AS (
    SELECT 
      ds.check_date,
      COALESCE(SUM(r.cabin_count), 0)::INTEGER AS occupied
    FROM date_series ds
    LEFT JOIN reservations r ON (
      r.start_date <= ds.check_date 
      AND r.end_date > ds.check_date
      AND r.status IN ('Información', 'Confirmada', 'Completada')
      AND r.deleted_at IS NULL
      AND (p_exclude_reservation_id IS NULL OR r.id != p_exclude_reservation_id)
    )
    GROUP BY ds.check_date
  )
  SELECT 
    opd.check_date,
    (p_total_cabins - opd.occupied)::INTEGER AS available_cabins,
    opd.occupied AS occupied_cabins
  FROM occupied_per_date opd
  WHERE (p_total_cabins - opd.occupied) < p_cabin_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get financial summary
CREATE OR REPLACE FUNCTION get_financial_summary(
  p_user_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_income NUMERIC,
  total_expenses NUMERIC,
  net_profit NUMERIC,
  profit_margin NUMERIC,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type = 'Ingreso' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'Gasto' THEN amount ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'Ingreso' THEN amount ELSE -amount END), 0) AS net_profit,
    CASE 
      WHEN SUM(CASE WHEN type = 'Ingreso' THEN amount ELSE 0 END) > 0 
      THEN (SUM(CASE WHEN type = 'Ingreso' THEN amount ELSE -amount END) / 
            NULLIF(SUM(CASE WHEN type = 'Ingreso' THEN amount ELSE 0 END), 0) * 100)
      ELSE 0
    END AS profit_margin,
    COUNT(*)::INTEGER AS transaction_count
  FROM transactions
  WHERE user_id = p_user_id
    AND deleted_at IS NULL
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get occupancy statistics
CREATE OR REPLACE FUNCTION get_occupancy_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_total_cabins INTEGER
)
RETURNS TABLE(
  total_nights INTEGER,
  occupied_nights INTEGER,
  occupancy_rate NUMERIC,
  total_revenue NUMERIC,
  adr NUMERIC,
  revpar NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH reservation_nights AS (
    SELECT 
      r.id,
      r.cabin_count,
      (r.end_date - r.start_date) AS nights,
      r.total_amount
    FROM reservations r
    WHERE r.user_id = p_user_id
      AND r.deleted_at IS NULL
      AND r.status IN ('Confirmada', 'Completada')
      AND r.start_date < p_end_date
      AND r.end_date > p_start_date
  )
  SELECT 
    (p_total_cabins * (p_end_date - p_start_date))::INTEGER AS total_nights,
    COALESCE(SUM(rn.cabin_count * rn.nights), 0)::INTEGER AS occupied_nights,
    CASE 
      WHEN p_total_cabins > 0 
      THEN (COALESCE(SUM(rn.cabin_count * rn.nights), 0)::NUMERIC / 
            (p_total_cabins * (p_end_date - p_start_date)) * 100)
      ELSE 0
    END AS occupancy_rate,
    COALESCE(SUM(rn.total_amount), 0) AS total_revenue,
    CASE 
      WHEN SUM(rn.cabin_count * rn.nights) > 0 
      THEN COALESCE(SUM(rn.total_amount) / SUM(rn.cabin_count * rn.nights), 0)
      ELSE 0
    END AS adr,
    CASE 
      WHEN p_total_cabins * (p_end_date - p_start_date) > 0 
      THEN COALESCE(SUM(rn.total_amount) / (p_total_cabins * (p_end_date - p_start_date)), 0)
      ELSE 0
    END AS revpar
  FROM reservation_nights rn;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- SEED DATA (Optional - for development)
-- ============================================================

-- Insert default system configuration
-- Note: This will be user-specific in production
-- INSERT INTO system_config (key, value, description, user_id)
-- VALUES ('total_cabins', '5', 'Total number of cabins available', auth.uid());

-- ============================================================
-- VIEWS (Optional - for complex queries)
-- ============================================================

-- Active reservations view
CREATE OR REPLACE VIEW v_active_reservations AS
SELECT 
  r.*,
  c.name AS client_name,
  c.email AS client_email,
  c.phone AS client_phone,
  (r.end_date - r.start_date) AS nights,
  CASE 
    WHEN r.total_amount > 0 AND (r.end_date - r.start_date) > 0
    THEN r.total_amount / (r.end_date - r.start_date)
    ELSE 0
  END AS daily_rate
FROM reservations r
INNER JOIN clients c ON r.client_id = c.id
WHERE r.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND r.status != 'Cancelada'
  AND r.is_archived = FALSE;

-- Financial transactions with reservation details
CREATE OR REPLACE VIEW v_transactions_detailed AS
SELECT 
  t.*,
  r.client_id,
  r.start_date AS reservation_start,
  r.end_date AS reservation_end,
  c.name AS client_name
FROM transactions t
LEFT JOIN reservations r ON t.reservation_id = r.id
LEFT JOIN clients c ON r.client_id = c.id
WHERE t.deleted_at IS NULL;

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE clients IS 'Stores customer information for the rental management system';
COMMENT ON TABLE reservations IS 'Stores cabin reservation records with dates and guest counts';
COMMENT ON TABLE transactions IS 'Stores all financial transactions (income and expenses)';
COMMENT ON TABLE system_config IS 'Stores system-wide configuration like total cabin count';

COMMENT ON COLUMN reservations.cabin_count IS 'Number of cabins reserved (changed from specific cabin IDs)';
COMMENT ON COLUMN reservations.is_archived IS 'Soft archive for moving Information status items to history';
COMMENT ON COLUMN clients.search_vector IS 'Full-text search index for client name, email, and phone';

-- ============================================================
-- PERMISSIONS (For service role - optional)
-- ============================================================

-- Grant usage on schema (if using custom schema)
-- GRANT USAGE ON SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================
-- AUDIT LOG (Optional - for tracking changes)
-- ============================================================

/*
-- Uncomment if you want to track all changes to data

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Function to log changes
CREATE OR REPLACE FUNCTION log_audit_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_entry();

CREATE TRIGGER audit_reservations AFTER INSERT OR UPDATE OR DELETE ON reservations
  FOR EACH ROW EXECUTE FUNCTION log_audit_entry();

CREATE TRIGGER audit_transactions AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION log_audit_entry();
*/

-- ============================================================
-- END OF SCHEMA
-- ============================================================
