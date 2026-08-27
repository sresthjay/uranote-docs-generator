import { Booking } from "@/lib/types";

const BOOKINGS_KEY = "uranote-bookings";
const LEGACY_BOOKING_KEY = "uranote-current-booking";

/**
 * Get all saved bookings.
 * Also migrates the old single-booking storage if necessary.
 */
export function getBookings(): Booking[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedBookings =
      localStorage.getItem(BOOKINGS_KEY);

    if (savedBookings) {
      const parsed = JSON.parse(savedBookings);

      if (Array.isArray(parsed)) {
        return parsed as Booking[];
      }
    }

    // ---------------------------------------------------------
    // Legacy migration
    // ---------------------------------------------------------

    const legacyBooking =
      localStorage.getItem(LEGACY_BOOKING_KEY);

    if (legacyBooking) {
      const parsed =
        JSON.parse(legacyBooking) as Booking;

      const bookings = [parsed];

      localStorage.setItem(
        BOOKINGS_KEY,
        JSON.stringify(bookings)
      );

      localStorage.removeItem(
        LEGACY_BOOKING_KEY
      );

      return bookings;
    }

    return [];
  } catch (error) {
    console.error(
      "Failed to load bookings:",
      error
    );

    return [];
  }
}


/**
 * Get a single booking by bookingId.
 */
export function getBooking(
  bookingId: string
): Booking | null {
  const bookings = getBookings();

  return (
    bookings.find(
      (booking) =>
        booking.bookingId === bookingId
    ) || null
  );
}


/**
 * Save a new booking.
 *
 * If the booking already exists, it is updated.
 * Otherwise it is added to the collection.
 */
export function saveBooking(
  booking: Booking
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const bookings = getBookings();

    const existingIndex =
      bookings.findIndex(
        (item) =>
          item.bookingId ===
          booking.bookingId
      );

    if (existingIndex >= 0) {
      bookings[existingIndex] = booking;
    } else {
      bookings.push(booking);
    }

    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(bookings)
    );
  } catch (error) {
    console.error(
      "Failed to save booking:",
      error
    );
  }
}


/**
 * Update an existing booking.
 */
export function updateBooking(
  booking: Booking
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const bookings = getBookings();

    const index =
      bookings.findIndex(
        (item) =>
          item.bookingId ===
          booking.bookingId
      );

    if (index === -1) {
      console.warn(
        "Booking not found:",
        booking.bookingId
      );

      return;
    }

    bookings[index] = booking;

    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(bookings)
    );
  } catch (error) {
    console.error(
      "Failed to update booking:",
      error
    );
  }
}


/**
 * Delete a booking by bookingId.
 */
export function deleteBooking(
  bookingId: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const bookings = getBookings();

    const filteredBookings =
      bookings.filter(
        (booking) =>
          booking.bookingId !==
          bookingId
      );

    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(
        filteredBookings
      )
    );
  } catch (error) {
    console.error(
      "Failed to delete booking:",
      error
    );
  }
}


/**
 * Replace the complete booking collection.
 * Useful for future bulk operations.
 */
export function saveBookings(
  bookings: Booking[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(bookings)
    );
  } catch (error) {
    console.error(
      "Failed to save bookings:",
      error
    );
  }
}