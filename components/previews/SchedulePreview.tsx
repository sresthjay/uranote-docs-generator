"use client";

import PaymentSchedule from "@/components/documents/PaymentSchedule";
import { Booking, Firm } from "@/lib/types";

interface SchedulePreviewProps {
  booking: Booking;
  firm: Firm;
}

export default function SchedulePreview({
   booking,
   firm, 
  }: SchedulePreviewProps) {
  const schedule = {
    date: booking.bookingDate, 
    booking, 
  };

  return (
    <PaymentSchedule
      schedule={schedule}
      firm={firm}
    />
  );
}