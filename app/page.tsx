"use client";

import { useMemo, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Booking } from "@/lib/types";
import { firmMaster } from "@/lib/firm-master";
import { formatBookingNumber } from "@/lib/booking-number";

const STORAGE_KEY = "uranote-bookings";

function subscribeToBookings(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("uranote-bookings-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("uranote-bookings-updated", callback);
  };
}

function getBookingsSnapshot() {
  return localStorage.getItem(STORAGE_KEY) || "[]";
}

function getBookingsServerSnapshot() {
  return "[]";
}

export default function DashboardPage() {
  const [search, setSearch] = useState("");

  const storedBookings = useSyncExternalStore(
    subscribeToBookings,
    getBookingsSnapshot,
    getBookingsServerSnapshot
  );

  const bookings = useMemo<Booking[]>(() => {
    try {
      const parsed = JSON.parse(storedBookings);

      return Array.isArray(parsed)
        ? (parsed as Booking[])
        : [];
    } catch {
      return [];
    }
  }, [storedBookings]);

  function formatDate(date: string) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatCurrency(amount: number) {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function getBookingValue(booking: Booking) {
    return booking.services.reduce(
      (total, service) =>
        total + Number(service.amount || 0),
      0
    );
  }

  function getBalanceDue(booking: Booking) {
    return Math.max(
      getBookingValue(booking) -
        Number(booking.amountReceived || 0),
      0
    );
  }

  function getBookingNumber(booking: Booking) {
    if (booking.bookingNumber) {
      return booking.bookingNumber;
    }

    const firm = firmMaster.find(
      (item) => item.id === booking.firmId
    );

    if (!firm) {
      return `Booking #${booking.bookingSequence || "—"}`;
    }

    return formatBookingNumber(booking, firm);
  }

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = bookings.filter((booking) => {
      if (!query) {
        return true;
      }

      const bookingNumber = getBookingNumber(booking);

      const searchableText = [
        bookingNumber,
        booking.bookingId,
        booking.customer?.name,
        booking.customer?.phone,
        booking.customer?.email,
        booking.travelStartDate,
        booking.travelEndDate,
        booking.bookingDate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });

    // Latest saved booking first.
    // localStorage stores bookings in save order,
    // so reversing the filtered array puts the newest first.
    return [...filtered].reverse();
  }, [bookings, search]);

  function handleDeleteBooking(booking: Booking) {
    const bookingNumber = getBookingNumber(booking);

    const confirmed = window.confirm(
      `Are you sure you want to delete booking ${bookingNumber}?\n\nThis will permanently remove the booking from this browser.`
    );

    if (!confirmed) {
      return;
    }

    const updatedBookings = bookings.filter(
      (item) =>
        item.bookingId !== booking.bookingId
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedBookings)
    );

    window.dispatchEvent(
      new Event("uranote-bookings-updated")
    );

    const currentBooking =
      localStorage.getItem(
        "uranote-current-booking"
      );

    if (currentBooking) {
      try {
        const parsed = JSON.parse(currentBooking);

        if (
          parsed?.bookingId === booking.bookingId
        ) {
          localStorage.removeItem(
            "uranote-current-booking"
          );
        }
      } catch {
        localStorage.removeItem(
          "uranote-current-booking"
        );
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-600">
              Uranote Operations
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Booking Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Search and manage saved bookings.
            </p>
          </div>

          <Link
            href="/new"
            className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + New Booking
          </Link>
        </div>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Bookings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {bookings.length}{" "}
                {bookings.length === 1
                  ? "booking"
                  : "bookings"}{" "}
                saved
              </p>
            </div>

            <div className="w-full sm:max-w-md">
              <label
                htmlFor="booking-search"
                className="sr-only"
              >
                Search bookings
              </label>

              <input
                id="booking-search"
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search booking no., customer, phone..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500">
              +
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No bookings saved
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Create your first booking to see it here.
            </p>

            <Link
              href="/new"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Create New Booking
            </Link>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h3 className="font-semibold text-gray-900">
              No matching bookings
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try searching by booking number, customer name or phone number.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <section className="space-y-5">
            {filteredBookings.map((booking) => {
              const bookingValue =
                getBookingValue(booking);

              const balanceDue =
                getBalanceDue(booking);

              const activeServices =
                booking.services.filter(
                  (service) =>
                    Number(service.amount || 0) > 0 ||
                    Number(service.quantity || 0) > 0
                );

              return (
                <article
                  key={booking.bookingId}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Booking
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-gray-900">
                        {getBookingNumber(booking)}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Booking Date:{" "}
                        <span className="font-medium text-gray-700">
                          {booking.bookingDate
                            ? formatDate(
                                booking.bookingDate
                              )
                            : "—"}
                        </span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Booking Value
                      </p>

                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {formatCurrency(bookingValue)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-0 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Customer
                      </p>

                      <p className="mt-2 font-semibold text-gray-900">
                        {booking.customer?.name || "—"}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {booking.customer?.phone ||
                          "No phone"}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Travel
                      </p>

                      <p className="mt-2 font-semibold text-gray-900">
                        {formatDate(
                          booking.travelStartDate
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        to
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(
                          booking.travelEndDate
                        )}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Payment Received
                      </p>

                      <p className="mt-2 font-semibold text-gray-900">
                        {formatCurrency(
                          Number(
                            booking.amountReceived || 0
                          )
                        )}
                      </p>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Balance Due
                      </p>

                      <p
                        className={`mt-2 font-semibold ${
                          balanceDue > 0
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatCurrency(balanceDue)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 p-5">
                    <p className="mb-3 text-sm font-semibold text-gray-900">
                      Services
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {activeServices.map(
                        (service) => (
                          <span
                            key={service.type}
                            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium capitalize text-gray-700"
                          >
                            {service.type}
                          </span>
                        )
                      )}

                      {activeServices.length === 0 && (
                        <span className="text-sm text-gray-500">
                          No services added yet.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 bg-gray-50/50 p-5">
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteBooking(booking)
                      }
                      className="inline-flex items-center rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50"
                    >
                      Delete
                    </button>

                    <Link
                      href={`/edit?bookingId=${encodeURIComponent(
                        booking.bookingId
                      )}`}
                      className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Edit Booking
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}