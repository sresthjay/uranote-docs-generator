import { Booking, Firm } from "@/lib/types";

/**
 * Financial-year month code
 *
 * April     A
 * May       B
 * June      C
 * July      D
 * August    E
 * September F
 * October   G
 * November  H
 * December  I
 * January   J
 * February  K
 * March     L
 */

const MONTH_CODES: Record<number, string> = {
  4: "A",
  5: "B",
  6: "C",
  7: "D",
  8: "E",
  9: "F",
  10: "G",
  11: "H",
  12: "I",
  1: "J",
  2: "K",
  3: "L",
};

export function formatBookingNumber(
  booking: Booking,
  firm: Firm
): string {
  const firmCode = firm.code;

  const bookingDate = booking.bookingDate;

  const monthNumber = Number(
  bookingDate.slice(5, 7)
);

  const monthCode =
    MONTH_CODES[monthNumber];

  if (!monthCode) {
    return `${firmCode} ${String(
      booking.bookingSequence
    ).padStart(3, "0")}`;
  }

  const sequence = String(
    booking.bookingSequence
  ).padStart(3, "0");

  return `${firmCode}${monthCode} ${sequence}`;
}