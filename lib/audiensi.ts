// Konstanta & helper untuk fitur Permohonan Audiensi Investor

export type AudiensiStatus = 'menunggu' | 'disetujui' | 'ditolak' | 'dijadwalkan_ulang'

export interface AudiensiRow {
  id: string
  kode: string
  nama_perusahaan: string
  jenis_investasi: string
  nilai_investasi: number | string
  estimasi_tenaga_kerja: number
  tanggal_audiensi: string
  nama_pemohon: string
  no_whatsapp: string
  status: AudiensiStatus
  catatan_admin: string | null
  tanggal_ditetapkan: string | null
  created_at: string
  updated_at: string
}

export const MIN_LEAD_DAYS = 3
export const MAX_LEAD_DAYS = 365

export const JENIS_INVESTASI_OPTIONS = [
  'Pertanian & Perkebunan',
  'Perikanan & Kelautan',
  'Pariwisata & Perhotelan',
  'Industri Pengolahan',
  'Perdagangan & Jasa',
  'Energi & Pertambangan',
  'Teknologi Digital',
  'Infrastruktur',
  'Lainnya',
]

export const STATUS_LABEL: Record<AudiensiStatus, string> = {
  menunggu: 'Menunggu Verifikasi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  dijadwalkan_ulang: 'Dijadwalkan Ulang',
}

export const STATUS_STYLE: Record<AudiensiStatus, string> = {
  menunggu: 'bg-amber-400 text-black',
  disetujui: 'bg-emerald-500 text-white',
  ditolak: 'bg-red-600 text-white',
  dijadwalkan_ulang: 'bg-sky-500 text-white',
}

export const STATUS_ORDER: AudiensiStatus[] = [
  'menunggu',
  'disetujui',
  'ditolak',
  'dijadwalkan_ulang',
]

// Pesan error dari kode yang dilempar RPC create_audiensi
export const RPC_ERROR_MESSAGE: Record<string, string> = {
  INVALID_NAMA_PERUSAHAAN: 'Nama perusahaan tidak valid (minimal 3 karakter, tanpa simbol < > ` \\).',
  INVALID_JENIS_INVESTASI: 'Jenis investasi tidak valid.',
  INVALID_NILAI_INVESTASI: 'Nilai investasi tidak valid. Masukkan angka bulat lebih dari 0 (maksimal 15 digit).',
  INVALID_TENAGA_KERJA: 'Estimasi tenaga kerja tidak valid. Masukkan angka bulat 0 atau lebih.',
  INVALID_TANGGAL: `Tanggal audiensi harus minimal H+${MIN_LEAD_DAYS} dari hari ini, hari Senin-Jumat, dan maksimal ${MAX_LEAD_DAYS} hari ke depan.`,
  INVALID_NAMA_PEMOHON: 'Nama pemohon tidak valid (hanya huruf, spasi, titik, apostrof, dan strip).',
  INVALID_NO_WHATSAPP: 'Nomor WhatsApp tidak valid. Masukkan 10-13 digit angka saja.',
  TOO_MANY_REQUESTS: 'Anda sudah mengajukan terlalu banyak permohonan dalam 24 jam terakhir. Silakan coba lagi nanti.',
}

export function mapRpcError(message: string): string {
  const code = Object.keys(RPC_ERROR_MESSAGE).find((k) => message.includes(k))
  return code ? RPC_ERROR_MESSAGE[code] : 'Terjadi kesalahan. Silakan periksa kembali data Anda.'
}

// Format angka jadi "5.000.000.000"
export function formatRupiah(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return '-'
  return new Intl.NumberFormat('id-ID').format(n)
}

// Ambil hanya digit dari input rupiah (untuk dikirim ke RPC sebagai teks digit murni)
export function parseRupiahDigits(input: string): string {
  return input.replace(/[^0-9]/g, '')
}

export function formatDateID(value?: string | null): string {
  if (!value) return '-'
  try {
    return new Date(value + 'T00:00:00').toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

export function formatDateTimeID(value?: string | null): string {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

// Nomor HP -> format wa.me (62xxxxxxxxxx)
export function toWaLink(phone: string, message?: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1)
  else if (!cleaned.startsWith('62')) cleaned = '62' + cleaned
  const base = `https://wa.me/${cleaned}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

// Validasi client-side (bantuan UX saja — validasi sebenarnya ada di server/RPC)
export function isValidWhatsapp(phone: string): boolean {
  return /^[0-9]{10,13}$/.test(phone.replace(/[\s-]/g, ''))
}

export function isValidNamaPemohon(name: string): boolean {
  return /^[A-Za-zÀ-ÿ\s.'-]{3,150}$/.test(name.trim())
}

// Tanggal minimal yang boleh dipilih (H+3, WITA), dipakai untuk atribut `min` pada <input type="date">
export function getMinAudiensiDate(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
  now.setDate(now.getDate() + MIN_LEAD_DAYS)
  return now.toISOString().slice(0, 10)
}

export function getMaxAudiensiDate(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Makassar' }))
  now.setDate(now.getDate() + MAX_LEAD_DAYS)
  return now.toISOString().slice(0, 10)
}

// Cek apakah tanggal yang dipilih user adalah Senin-Jumat (client-side helper)
export function isWeekday(dateStr: string): boolean {
  if (!dateStr) return false
  const day = new Date(dateStr + 'T00:00:00').getDay() // 0=Minggu, 6=Sabtu
  return day >= 1 && day <= 5
}