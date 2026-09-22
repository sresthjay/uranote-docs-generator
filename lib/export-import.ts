import { Booking, ServiceItem } from "@/lib/types";

export const EXPORT_APP_ID = "uranote-docs-generator";
export const EXPORT_VERSION = 1;

export const BOOKINGS_KEY = "uranote-bookings";
export const CURRENT_BOOKING_KEY = "uranote-current-booking";
export const THEME_KEY = "uranote-theme";

export interface ExportData {
  bookings: Booking[];
  currentBooking: Booking | null;
  theme: string | null;
}

export interface ExportPayload {
  app: string;
  version: number;
  exportedAt: string;
  data: ExportData;
}

/**
 * Collect all app data into a single portable structure.
 */
export function buildExportPayload(): ExportPayload {
  let bookings: Booking[] = [];
  let currentBooking: Booking | null = null;
  let theme: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          bookings = parsed as Booking[];
        }
      }
    } catch {
      bookings = [];
    }

    try {
      const raw = localStorage.getItem(CURRENT_BOOKING_KEY);

      currentBooking = raw
        ? (JSON.parse(raw) as Booking)
        : null;
    } catch {
      currentBooking = null;
    }

    try {
      theme = localStorage.getItem(THEME_KEY);
    } catch {
      theme = null;
    }
  }

  return {
    app: EXPORT_APP_ID,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      bookings,
      currentBooking,
      theme,
    },
  };
}

/**
 * Trigger a browser download of the current app data.
 */
export function downloadExportFile(): void {
  const payload = buildExportPayload();

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  const date = new Date()
    .toISOString()
    .slice(0, 10);

  link.href = url;
  link.download = `uranote-backup-${date}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

type RecordValue = Record<string, unknown>;

function isRecord(
  value: unknown
): value is RecordValue {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeService(
  input: RecordValue
): ServiceItem {
  return {
    type: [
      "taxi",
      "hotel",
      "flight",
      "miscellaneous",
    ].includes(String(input.type))
      ? (String(input.type) as ServiceItem["type"])
      : "miscellaneous",
    description:
      typeof input.description === "string"
        ? input.description
        : "",
    quantity: Number(input.quantity) || 0,
    amount: Number(input.amount) || 0,
  };
}

/**
 * Validate and normalize a single booking object.
 * Returns null when the booking is structurally invalid.
 */
function normalizeBooking(
  input: unknown
): Booking | null {
  if (!isRecord(input)) {
    return null;
  }

  if (
    typeof input.bookingId !== "string" ||
    input.bookingId.trim() === ""
  ) {
    return null;
  }

  if (typeof input.firmId !== "string") {
    return null;
  }

  const services = Array.isArray(input.services)
    ? (input.services as unknown[])
        .filter(isRecord)
        .map(normalizeService)
    : [];

  const customerValue = isRecord(
    input.customer
  )
    ? input.customer
    : {};

  const customer = {
    name:
      typeof customerValue.name === "string"
        ? customerValue.name
        : "",
    phone:
      typeof customerValue.phone === "string"
        ? customerValue.phone
        : "",
    email:
      typeof customerValue.email === "string"
        ? customerValue.email
        : "",
  };

  return {
    bookingId: input.bookingId,
    firmId: input.firmId,
    bookingSequence:
      Number(input.bookingSequence) || 1,
    ...(typeof input.bookingNumber === "string" &&
    input.bookingNumber.trim() !== ""
      ? { bookingNumber: input.bookingNumber }
      : {}),
    bookingDate:
      typeof input.bookingDate === "string"
        ? input.bookingDate
        : "",
    customer,
    travelStartDate:
      typeof input.travelStartDate === "string"
        ? input.travelStartDate
        : "",
    travelEndDate:
      typeof input.travelEndDate === "string"
        ? input.travelEndDate
        : "",
    services,
    amountReceived:
      Number(input.amountReceived) || 0,
    paymentSchedule: Array.isArray(
      input.paymentSchedule
    )
      ? (input.paymentSchedule as Booking["paymentSchedule"])
      : [],
    ...(isRecord(input.taxi)
      ? {
          taxi: input.taxi as unknown as Booking["taxi"],
        }
      : {}),
    hotels: Array.isArray(input.hotels)
      ? (input.hotels as Booking["hotels"])
      : [],
    otherServices: Array.isArray(
      input.otherServices
    )
      ? (input.otherServices as Booking["otherServices"])
      : [],
  };
}

export type ValidateResult =
  | { ok: true; data: ExportPayload }
  | { ok: false; error: string };

/**
 * Validate an imported backup file before applying it.
 * No storage is modified while validating.
 */
export function validateExportData(
  rawText: string
): ValidateResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: "The selected file is not valid JSON.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error:
        "The selected file is not a valid Uranote backup.",
    };
  }

  if (parsed.app !== EXPORT_APP_ID) {
    return {
      ok: false,
      error:
        "This file was not created by the Uranote docs generator.",
    };
  }

  if (
    typeof parsed.version !== "number" ||
    parsed.version > EXPORT_VERSION
  ) {
    return {
      ok: false,
      error: `Backup version "${String(
        parsed.version
      )}" is not supported by this app.`,
    };
  }

  if (
    !isRecord(parsed.data) ||
    !Array.isArray(parsed.data.bookings)
  ) {
    return {
      ok: false,
      error:
        "The backup file does not contain a bookings list.",
    };
  }

  const bookings: Booking[] = [];

  const rawBookings = parsed.data
    .bookings as unknown[];

  for (let i = 0; i < rawBookings.length; i += 1) {
    const booking = normalizeBooking(
      rawBookings[i]
    );

    if (!booking) {
      return {
        ok: false,
        error: `Booking #${
          i + 1
        } in the backup is invalid and cannot be restored.`,
      };
    }

    bookings.push(booking);
  }

  return {
    ok: true,
    data: {
      app: EXPORT_APP_ID,
      version: EXPORT_VERSION,
      exportedAt:
        typeof parsed.exportedAt === "string"
          ? parsed.exportedAt
          : new Date().toISOString(),
      data: {
        bookings,
        currentBooking: isRecord(
          parsed.data.currentBooking
        )
          ? normalizeBooking(
              parsed.data.currentBooking
            )
          : null,
        theme:
          typeof parsed.data.theme === "string"
            ? parsed.data.theme
            : null,
      },
    },
  };
}

/**
 * Write validated backup data into localStorage.
 * mode "merge" keeps existing bookings (import wins on id clash),
 * mode "replace" overwrites the whole booking collection.
 * Returns how many bookings were imported.
 */
export function applyExportData(
  payload: ExportPayload,
  mode: "merge" | "replace"
): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const imported = payload.data.bookings;

  let target: Booking[];

  if (mode === "replace") {
    target = [...imported];
  } else {
    let existing: Booking[] = [];

    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          existing = parsed as Booking[];
        }
      }
    } catch {
      existing = [];
    }

    const byId = new Map<string, Booking>();

    for (const booking of existing) {
      if (booking && booking.bookingId) {
        byId.set(booking.bookingId, booking);
      }
    }

    for (const booking of imported) {
      byId.set(booking.bookingId, booking);
    }

    target = Array.from(byId.values());
  }

  localStorage.setItem(
    BOOKINGS_KEY,
    JSON.stringify(target)
  );

  if (payload.data.currentBooking) {
    localStorage.setItem(
      CURRENT_BOOKING_KEY,
      JSON.stringify(payload.data.currentBooking)
    );
  } else if (mode === "replace") {
    localStorage.removeItem(CURRENT_BOOKING_KEY);
  }

  if (
    payload.data.theme === "dark" ||
    payload.data.theme === "light"
  ) {
    try {
      localStorage.setItem(
        THEME_KEY,
        payload.data.theme
      );

      if (payload.data.theme === "dark") {
        document.documentElement.classList.add(
          "dark"
        );
      } else {
        document.documentElement.classList.remove(
          "dark"
        );
      }
    } catch {
      /* ignore */
    }
  }

  window.dispatchEvent(
    new Event("uranote-bookings-updated")
  );

  return imported.length;
}