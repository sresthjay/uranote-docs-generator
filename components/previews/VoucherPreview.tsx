"use client";

import { useMemo } from "react";
import {
  ReservationVoucher as VoucherData,
  Firm,
  Booking,
} from "@/lib/types";

import ReservationVoucher from "@/components/documents/ReservationVoucher";

interface VoucherPreviewProps {
  booking: Booking;
  firm: Firm;
}

export default function VoucherPreview({
  booking,
  firm,
}: VoucherPreviewProps) {
  const voucher = useMemo<VoucherData>(
    () => ({
      date: booking.bookingDate,
      booking,
    }),
    [booking]
  );

  return (
    <ReservationVoucher
      voucher={voucher}
      firm={firm}
    />
  );
}