"use client";

import { useEffect } from "react";

import VendorBookingRequestForm from "@/components/forms/VendorBookingRequestForm";

interface VendorBookingRequestModalProps {
  onClose: () => void;
}

export default function VendorBookingRequestModal({
  onClose,
}: VendorBookingRequestModalProps) {
  useEffect(() => {
    const originalOverflow =
      document.body.style.overflow;

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-booking-request-title"
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
          <div>
            <h2
              id="vendor-booking-request-title"
              className="text-lg font-bold text-gray-900"
            >
              Vendor Booking Request
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Generate a Hotel Booking Request PDF.
              Nothing is saved.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close vendor booking request"
            className="-mr-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <VendorBookingRequestForm
          onClose={onClose}
        />
      </div>
    </div>
  );
}
