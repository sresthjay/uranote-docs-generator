export function calculatePendingAmount(
  totalAmount: number,
  advancePaid: number
): number {
  return Math.max(totalAmount - advancePaid, 0);
}

export function calculateSubtotal(
  items: { amount: number }[]
): number {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function calculatePaymentScheduleTotal(
  entries: { amount: number }[]
): number {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}