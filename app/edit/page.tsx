"use client";

import { useEffect, useState } from "react";

import BookingForm from "@/components/forms/BookingForm";

import ReceiptPreview from "@/components/previews/ReceiptPreview";
import VoucherPreview from "@/components/previews/VoucherPreview";
import SchedulePreview from "@/components/previews/SchedulePreview";
import { getBooking } from "@/lib/db";
import { Booking, Firm } from "@/lib/types";
import { firmMaster } from "@/lib/firm-master";

type PreviewType =
  | "receipt"
  | "voucher"
  | "schedule"
  | null;

export default function EditBookingPage() {
  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [previewType, setPreviewType] =
    useState<PreviewType>(null);

  const [loading, setLoading] =
    useState(true);

  function getSelectedFirm(): Firm | null {
    if (!booking?.firmId) {
      return null;
    }

    return (
      firmMaster.find(
        (firm) => firm.id === booking.firmId
      ) || null
    );
  }

  const selectedFirm = getSelectedFirm();

  function handleReceipt() {
    setPreviewType("receipt");
  }

  function handleVoucher() {
    setPreviewType("voucher");
  }

  function handlePaymentSchedule() {
    setPreviewType("schedule");
  }

 useEffect(() => {
   try {
     const params = new URLSearchParams(
       window.location.search
     );

     const bookingId =
       params.get("id") || params.get("bookingId");

     if (!bookingId) {
       setLoading(false);
       return;
     }

     const savedBooking =
       getBooking(bookingId);

     if (savedBooking) {
       setBooking(savedBooking);
     }
   } catch (error) {
     console.error(
       "Failed to load booking:",
       error
     );
   } finally {
     setLoading(false);
   }
 }, []);

  /* =====================================================
     NO BOOKING
  ====================================================== */

  if (!booking) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-5xl">

          <button
            type="button"
            onClick={() =>
              window.location.href = "/"
            }
            className="mb-6 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>

          <div className="mb-8">

            <p className="mb-1 text-sm font-medium text-blue-600">
              Uranote Operations
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Edit Booking
            </h1>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
              —
            </div>

            <h2 className="mt-4 font-semibold text-gray-900">
              No saved booking found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Create a new booking first, then return here
              to edit it.
            </p>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* =====================================================
            BOOKING FORM
        ====================================================== */}

        {!previewType && (
          <>

            {/* Header */}

            <div className="mb-8">

              <button
                type="button"
                onClick={() =>
                  window.location.href = "/"
                }
                className="mb-5 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
              >
                ← Back to Dashboard
              </button>

              <div>

                <p className="mb-1 text-sm font-medium text-blue-600">
                  Uranote Operations
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Edit Booking
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Update booking details, services,
                  payments and operational information.
                </p>

              </div>

            </div>


            {/* Form */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

              <BookingForm
                initialBooking={booking}
                onChange={setBooking}
                onReceipt={handleReceipt}
                onVoucher={handleVoucher}
                onPaymentSchedule={
                  handlePaymentSchedule
                }
              />

            </div>

          </>
        )}


        {/* =====================================================
            PREVIEW
        ====================================================== */}

        {previewType && selectedFirm && (
          <div>

            {/* Preview Header */}

            <div className="mb-6">

              <button
                type="button"
                onClick={() =>
                  setPreviewType(null)
                }
                className="mb-5 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
              >
                ← Back to Booking
              </button>

              <div>

                <p className="mb-1 text-sm font-medium text-blue-600">
                  Document Preview
                </p>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900">

                  {previewType === "receipt" &&
                    "Receipt Preview"}

                  {previewType === "voucher" &&
                    "Voucher Preview"}

                  {previewType === "schedule" &&
                    "Payment Schedule Preview"}

                </h1>

              </div>

            </div>


            {/* Receipt */}

            {previewType === "receipt" && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <ReceiptPreview
                  booking={booking}
                  firm={selectedFirm}
                />

              </div>
            )}


            {/* Voucher */}

            {previewType === "voucher" && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <VoucherPreview
                  booking={booking}
                  firm={selectedFirm}
                />

              </div>
            )}


            {/* Payment Schedule */}

            {previewType === "schedule" && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

                <SchedulePreview
                  booking={booking}
                  firm={selectedFirm}
                />

              </div>
            )}

          </div>
        )}


        {/* =====================================================
            FIRM MISSING
        ====================================================== */}

        {previewType && !selectedFirm && (
          <div>

            <button
              type="button"
              onClick={() =>
                setPreviewType(null)
              }
              className="mb-6 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50"
            >
              ← Back to Booking
            </button>

            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">

              <p className="text-sm font-semibold text-red-800">
                Firm selection required
              </p>

              <p className="mt-1 text-sm text-red-700">
                Please select a firm before previewing
                the document.
              </p>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}