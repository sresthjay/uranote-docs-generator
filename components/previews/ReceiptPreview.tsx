"use client";

import Receipt from "@/components/documents/Receipt";
import { Booking } from "@/lib/types";
import { Firm } from "@/lib/types";

interface ReceiptPreviewProps {
  booking: Booking;
  firm: Firm;
}

export default function ReceiptPreview({
  booking,
  firm,
}: ReceiptPreviewProps) {
  const receipt = {
    date: booking.bookingDate,
    booking,
  };

  return (
    <Receipt
      receipt={receipt}
      firm={firm}
    />
  );
}