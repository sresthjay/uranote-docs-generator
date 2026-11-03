"use client";

import { useState } from "react";

import VendorBookingRequestModal from "@/components/shared/VendorBookingRequestModal";

export default function VendorBookingRequestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
      >
        Vendor Booking Request
      </button>

      {open && (
        <VendorBookingRequestModal
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
