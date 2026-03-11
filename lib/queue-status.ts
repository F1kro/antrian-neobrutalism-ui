export interface BookingCancellationInfo {
  cancel_reason?: string | null
  notes?: string | null
  status?: string
}

const ADMIN_CANCEL_REASONS = [
  "Orang tidak ada di tempat",
  "Dokumen tidak lengkap",
  "Minta reschedule",
]

const ADMIN_REASON_DISPLAY: Record<string, string> = {
  "Orang tidak ada di tempat": "Tidak hadir saat dipanggil",
  "Dokumen tidak lengkap": "Dokumen tidak lengkap",
  "Minta reschedule": "Meminta jadwal ulang",
}

export const isAdminCancelled = (booking: BookingCancellationInfo) => {
  if (booking.status !== "cancelled") return false
  const notes = booking.notes?.trim()
  if (!notes) return false
  return ADMIN_CANCEL_REASONS.includes(notes)
}

export const getCancelReason = (booking: BookingCancellationInfo) => {
  const userReason = booking.cancel_reason?.trim()
  if (userReason) return userReason

  const notes = booking.notes?.trim()
  if (!notes) return "Tidak ada keterangan"

  if (ADMIN_CANCEL_REASONS.includes(notes)) {
    return ADMIN_REASON_DISPLAY[notes] || notes
  }

  return notes
}
