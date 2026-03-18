-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services table (21 layanan dinas)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_duration INTEGER DEFAULT 15,
  open_days SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE services
ADD COLUMN IF NOT EXISTS open_days SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6];

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(20) NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'waiting',
  booking_type VARCHAR(20) DEFAULT 'online',
  queue_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  called_at TIMESTAMP WITH TIME ZONE
);

-- Queue History table
CREATE TABLE IF NOT EXISTS queue_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by VARCHAR(255),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance flag (pause booking saat maintenance)
CREATE TABLE IF NOT EXISTS maintenance_flags (
  flag_key TEXT PRIMARY KEY,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO maintenance_flags (flag_key, message)
VALUES ('booking_pause', 'Booking online dihentikan sementara karena maintenance.')
ON CONFLICT (flag_key) DO NOTHING;

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_history ENABLE ROW LEVEL SECURITY;

-- Public policies for services (anyone dapat baca data layanan)
CREATE POLICY IF NOT EXISTS "services_select_public" ON services FOR SELECT USING (true);

-- Public policies for bookings (pembuat antrean bebas insert dan select)
CREATE POLICY IF NOT EXISTS "bookings_select_all" ON bookings FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "bookings_insert_public" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "bookings_update_own" ON bookings FOR UPDATE USING (true);

-- Public policies for queue_history
CREATE POLICY IF NOT EXISTS "queue_history_select_all" ON queue_history FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_queue_history_booking ON queue_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);

-- Insert 21 default services jika belum ada
INSERT INTO services (name, description) VALUES
  ('Pendaftaran Perusahaan Baru', 'Layanan pendaftaran perusahaan/usaha baru'),
  ('Perubahan Data Perusahaan', 'Layanan perubahan data perusahaan'),
  ('Permohonan Izin Usaha', 'Layanan permohonan izin usaha'),
  ('Perpanjangan Izin Usaha', 'Layanan perpanjangan izin usaha'),
  ('Penutupan Usaha', 'Layanan penutupan usaha'),
  ('Sertifikat Domisili', 'Layanan penerbitan sertifikat domisili'),
  ('Rekomendasi Lokasi Usaha', 'Layanan rekomendasi lokasi usaha'),
  ('Perizinan Perdagangan', 'Layanan perizinan perdagangan'),
  ('Perizinan Industri', 'Layanan perizinan industri'),
  ('Perizinan Lingkungan', 'Layanan perizinan lingkungan'),
  ('Izin Prinsip', 'Layanan izin prinsip'),
  ('Izin Operasional', 'Layanan izin operasional'),
  ('Persetujuan Investasi', 'Layanan persetujuan investasi'),
  ('Rekomendasi Tingkat Kabupaten', 'Layanan rekomendasi tingkat kabupaten'),
  ('Rekomendasi Tingkat Provinsi', 'Layanan rekomendasi tingkat provinsi'),
  ('Surat Keterangan Usaha', 'Layanan surat keterangan usaha'),
  ('Konsultasi Investasi', 'Layanan konsultasi investasi'),
  ('Pendaftaran Merek', 'Layanan pendaftaran merek'),
  ('Pengajuan Paten', 'Layanan pengajuan paten'),
  ('Pembayaran Retribusi', 'Layanan pembayaran retribusi'),
  ('Layanan Umum & Informasi', 'Layanan umum dan informasi dinas')
ON CONFLICT DO NOTHING;
