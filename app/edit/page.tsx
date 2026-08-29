"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

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

function subscribeToUrl() {
  return () => {};
}

function getUrlSnapshot() {
  return window.location.search;
}

function getUrlServerSnapshot() {
  return "";
}

export default function EditBookingPage() {
  const router = useRouter();

  const search = useSyncExternalStore(
    subscribeToUrl,
    getUrlSnapshot,
    getUrlServerSnapshot
  );

  const bookingId =
    new URLSearchParams(search).get("id") ||
    new URLSearchParams(search).get("bookingId");

  const [booking, setBooking] =
    useState<Booking | null>(null);

  const [previewType, setPreviewType] =
    useState<PreviewType>(null);

  const [showToTop, setShowToTop] =
    useState(false);

  /*
   * =========================================================
   * LOAD BOOKING
   * =========================================================
   */

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    const loadBooking = () => {
      const savedBooking = getBooking(bookingId);

      if (savedBooking) {
        setBooking(savedBooking);
      }
    };

    const timeoutId = window.setTimeout(
      loadBooking,
      0
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookingId]);

  /*
   * =========================================================
   * SCROLL
   * =========================================================
   */

  useEffect(() => {
    const handleScroll = () => {
      setShowToTop(window.scrollY > 400);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

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

  function goToDashboard() {
    router.push("/");
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * =========================================================
   * LOADING / NOT FOUND
   * =========================================================
   */

  if (!booking) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          <button
            type="button"
            onClick={goToDashboard}
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

            <p className="mt-2 text-sm text-gray-500">
              Loading booking...
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-gray-500">
              Loading booking...
            </p>

          </div>

        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN RENDER
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {!previewType && (
          <>
            <div className="mb-8">

              <button
                type="button"
                onClick={goToDashboard}
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

        {previewType && selectedFirm && (
          <div>

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

            {previewType === "receipt" && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <ReceiptPreview
                  booking={booking}
                  firm={selectedFirm}
                />
              </div>
            )}

            {previewType === "voucher" && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <VoucherPreview
                  booking={booking}
                  firm={selectedFirm}
                />
              </div>
            )}

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

      {showToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-md transition hover:bg-gray-50"
        >
          ↑
        </button>
      )}

    </main>
  );
}

