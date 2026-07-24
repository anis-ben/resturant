/**
 * Formats a monetary amount into Algerian Dinars (دج).
 * Formats the number explicitly inside an LTR wrapper to prevent RTL text reversal.
 */
export function formatCurrency(amount: number): string {
  const formattedNumber = new Intl.NumberFormat('fr-DZ', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);

  return `${formattedNumber} دج`;
}

/**
 * Returns formatted relative time string in Arabic (e.g., "منذ 5 دقائق").
 */
export function formatElapsedTime(createdAt: string): string {
  const start = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffInMinutes = Math.floor((now - start) / 60000);

  if (diffInMinutes < 1) return 'الآن';
  if (diffInMinutes === 1) return 'منذ دقيقة واحدة';
  if (diffInMinutes === 2) return 'منذ دقيقتين';
  if (diffInMinutes <= 10) return `منذ ${diffInMinutes} دقائق`;
  return `منذ ${diffInMinutes} دقيقة`;
}

/**
 * Formats a phone number safely.
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return 'غير محدد';
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
}
