-- ============================================================
-- FITUR AUDIENSI & KONSULTASI INVESTOR - SIBONA DPMPTSP LOBAR
-- Jalankan script ini di Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabel permohonan audiensi / konsultasi investor
CREATE TABLE IF NOT EXISTS audiensis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code VARCHAR(40) UNIQUE NOT NULL,
  audience_type VARCHAR(20) NOT NULL CHECK (audience_type IN ('audiensi', 'investor')),
  applicant_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(255),
  category VARCHAR(150),
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  preferred_date DATE,
  preferred_time VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'approved', 'done', 'rejected', 'canceled')),
  admin_note TEXT,
  schedule_start TIMESTAMP WITH TIME ZONE,
  schedule_end TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian & filter
CREATE INDEX IF NOT EXISTS idx_audiensis_status ON audiensis(status);
CREATE INDEX IF NOT EXISTS idx_audiensis_type ON audiensis(audience_type);
CREATE INDEX IF NOT EXISTS idx_audiensis_created ON audiensis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audiensis_ticket ON audiensis(ticket_code);

-- Enable RLS
ALTER TABLE audiensis ENABLE ROW LEVEL SECURITY;

-- Kebijakan publik: siapa pun boleh mengirim permohonan
DROP POLICY IF EXISTS "audiensis_insert_public" ON audiensis;
CREATE POLICY "audiensis_insert_public" ON audiensis FOR INSERT WITH CHECK (true);

-- Kebijakan publik: hanya dapat membaca (untuk cek status tiket),
-- admin menggunakan service role / auth untuk update & delete.
DROP POLICY IF EXISTS "audiensis_select_public" ON audiensis;
CREATE POLICY "audiensis_select_public" ON audiensis FOR SELECT USING (true);

-- Kebijakan update/delete hanya untuk user terautentikasi (admin)
DROP POLICY IF EXISTS "audiensis_update_auth" ON audiensis;
CREATE POLICY "audiensis_update_auth" ON audiensis FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "audiensis_delete_auth" ON audiensis;
CREATE POLICY "audiensis_delete_auth" ON audiensis FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger untuk updated_at otomatis
CREATE OR REPLACE FUNCTION set_audiensis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audiensis_updated_at ON audiensis;
CREATE TRIGGER trg_audiensis_updated_at
BEFORE UPDATE ON audiensis
FOR EACH ROW
EXECUTE FUNCTION set_audiensis_updated_at();

-- Fungsi RPC untuk membuat kode tiket unik: AUD-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION generate_audiensis_ticket(p_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR(4);
  v_date VARCHAR(8);
  v_random VARCHAR(4);
  v_ticket VARCHAR(40);
  v_exists BOOLEAN;
BEGIN
  v_prefix := CASE WHEN p_type = 'investor' THEN 'INV' ELSE 'AUD' END;
  v_date := to_char(NOW() AT TIME ZONE 'Asia/Makassar', 'YYYYMMDD');
  LOOP
    v_random := upper(substr(md5(random()::text), 1, 4));
    v_ticket := v_prefix || '-' || v_date || '-' || v_random;
    SELECT EXISTS(SELECT 1 FROM audiensis WHERE ticket_code = v_ticket) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION generate_audiensis_ticket(VARCHAR) TO anon, authenticated;

-- Tambahkan aksi log baru (jika tabel system_logs sudah ada)
-- Tidak perlu ALTER karena action_type bertipe text/varchar bebas.