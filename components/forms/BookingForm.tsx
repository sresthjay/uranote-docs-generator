"use client";

import { useEffect, useState } from "react";
import {
  Booking,
  ServiceType,
} from "@/lib/types";
import { firmMaster } from "@/lib/firm-master";
import {
  formatBookingNumber,
} from "@/lib/booking-number";

import {
  generateReceiptPdf,
} from "@/lib/pdf/receipt-pdf";

import {
  exportVoucherPdf,
} from "@/lib/pdf/voucher-pdf";

import {
  generatePaymentSchedulePdf,
} from "@/lib/pdf/payment-schedule-pdf";

interface BookingFormProps {
  initialBooking?: Booking;

  onChange?: (booking: Booking) => void;
  onReceipt?: () => void;
  onVoucher?: () => void;
  onPaymentSchedule?: () => void;
  onSaved?: (booking: Booking) => void;
}

const defaultFirm =
  firmMaster.find(
    (firm) =>
      firm.name.toLowerCase() ===
      "uranote holidays".toLowerCase()
  ) || firmMaster[0];

const createInitialBooking = (): Booking => ({
  bookingId: "",
  firmId: defaultFirm?.id || "",
  bookingSequence: 1,
  bookingDate: new Date().toLocaleDateString("en-CA"),

  customer: {
    name: "",
    phone: "",
    email: "",
  },

  travelStartDate: "",
  travelEndDate: "",

  services: [
    {
      type: "taxi",
      description: "N/A",
      quantity: 0,
      amount: 0,
    },
    {
      type: "hotel",
      description: "N/A",
      quantity: 0,
      amount: 0,
    },
    {
      type: "flight",
      description: "N/A",
      quantity: 0,
      amount: 0,
    },
    {
      type: "miscellaneous",
      description: "N/A",
      quantity: 0,
      amount: 0,
    },
  ],

  amountReceived: 0,
  paymentSchedule: [],

  taxi: undefined,
  hotels: [],
  otherServices: [],
});

export default function BookingForm({
  initialBooking,
  onChange,
  onReceipt,
  onVoucher,
  onPaymentSchedule,
  onSaved,
}: BookingFormProps) {
  const [booking, setBooking] = useState<Booking>(
    initialBooking || createInitialBooking()
  );

  const [firmSearch, setFirmSearch] = useState(
    initialBooking
      ? firmMaster.find(
        (firm) =>
          firm.id === initialBooking.firmId
      )?.name || ""
      : defaultFirm?.name || ""
  );

  const [showFirmResults, setShowFirmResults] =
    useState(false);

  const [savedSection, setSavedSection] =
    useState<
      "receipt" | "voucher" | "payment" | null
    >(null);

  const [exporting, setExporting] = useState<
    "receipt" | "voucher" | "payment" | null
  >(null);

  /*
   * ---------------------------------------------------------
   * LOAD BOOKING WHEN EDIT PAGE PROVIDES ONE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!initialBooking) {
      return;
    }

    setBooking(initialBooking);

    const firm = firmMaster.find(
      (item) =>
        item.id === initialBooking.firmId
    );

    setFirmSearch(firm?.name || "");
  }, [initialBooking]);

  /*
   * ---------------------------------------------------------
   * SAVE BOOKING
   * ---------------------------------------------------------
   */

  function saveBooking(): Booking | null {
    if (typeof window === "undefined") {
      return null;
    }

    const bookingId =
      booking.bookingId || crypto.randomUUID();

    const firm = firmMaster.find(
      (item) => item.id === booking.firmId
    );

    if (!firm) {
      console.error(
        "Cannot save booking: firm not found."
      );
      return null;
    }

    const bookingToSave: Booking = {
      ...booking,
      bookingId,

      bookingNumber:
        booking.bookingNumber ||
        formatBookingNumber(
          {
            ...booking,
            bookingId,
          },
          firm
        ),
    };

    const storedBookings =
      localStorage.getItem("uranote-bookings");

    let bookings: Booking[] = [];

    if (storedBookings) {
      try {
        const parsed = JSON.parse(storedBookings);

        if (Array.isArray(parsed)) {
          bookings = parsed;
        }
      } catch {
        bookings = [];
      }
    }

    const existingIndex = bookings.findIndex(
      (item) =>
        item.bookingId ===
        bookingToSave.bookingId
    );

    if (existingIndex >= 0) {
      bookings[existingIndex] = bookingToSave;
    } else {
      bookings.push(bookingToSave);
    }

    localStorage.setItem(
      "uranote-bookings",
      JSON.stringify(bookings)
    );

    localStorage.setItem(
      "uranote-current-booking",
      JSON.stringify(bookingToSave)
    );

    setBooking(bookingToSave);
    onChange?.(bookingToSave);
    onSaved?.(bookingToSave);

    return bookingToSave;
  }

  /*
   * ---------------------------------------------------------
   * SAVE BUTTON HANDLER
   * ---------------------------------------------------------
   */

  function handleSave(
    section:
      | "receipt"
      | "voucher"
      | "payment"
  ) {
    const result = saveBooking();

    if (!result) {
      return;
    }

    setSavedSection(section);

    setTimeout(() => {
      setSavedSection(null);
    }, 2000);
  }

  /*
   * ---------------------------------------------------------
   * DOCUMENT HELPERS
   * ---------------------------------------------------------
   */

  function getFirmForBooking(
    currentBooking: Booking
  ) {
    return firmMaster.find(
      (firm) =>
        firm.id === currentBooking.firmId
    );
  }

  function getTravelDates(
    currentBooking: Booking
  ) {
    if (
      !currentBooking.travelStartDate &&
      !currentBooking.travelEndDate
    ) {
      return "";
    }

    if (
      currentBooking.travelStartDate &&
      !currentBooking.travelEndDate
    ) {
      return currentBooking.travelStartDate;
    }

    if (
      !currentBooking.travelStartDate &&
      currentBooking.travelEndDate
    ) {
      return currentBooking.travelEndDate;
    }

    return `${currentBooking.travelStartDate} to ${currentBooking.travelEndDate}`;
  }

  function getBookingNumber(
    currentBooking: Booking
  ) {
    return (
      currentBooking.bookingNumber ||
      currentBooking.bookingId ||
      ""
    );
  }

  /*
   * ---------------------------------------------------------
   * EXPORT RECEIPT
   * ---------------------------------------------------------
   */

  function handleExportReceipt() {
    const savedBooking = saveBooking();

    if (!savedBooking) {
      return;
    }

    const firm = getFirmForBooking(savedBooking);

    if (!firm) {
      console.error(
        "Cannot export receipt: firm not found."
      );
      return;
    }

    setExporting("receipt");

    try {
      const receipt = {
        booking: savedBooking,

        receiptNo:
          getBookingNumber(savedBooking),

        date:
          savedBooking.bookingDate ||
          new Date().toLocaleDateString("en-CA"),

        customerName:
          savedBooking.customer.name,

        customerPhone:
          savedBooking.customer.phone,

        customerEmail:
          savedBooking.customer.email,

        travelDates:
          getTravelDates(savedBooking),

        totalAmount:
          savedBooking.services.reduce(
            (total, service) =>
              total +
              Number(service.amount || 0),
            0
          ),

        amountReceived:
          Number(
            savedBooking.amountReceived || 0
          ),

        balanceDue:
          Math.max(
            savedBooking.services.reduce(
              (total, service) =>
                total +
                Number(service.amount || 0),
              0
            ) -
            Number(
              savedBooking.amountReceived || 0
            ),
            0
          ),

        services:
          savedBooking.services.map(
            (service) => ({
              serviceName:
                service.type === "taxi"
                  ? "Taxi/s"
                  : service.type === "hotel"
                    ? "Hotel/s"
                    : service.type ===
                      "flight"
                      ? "Ticket/s"
                      : "Miscellaneous",

              description:
                service.description || "N/A",

              quantity:
                Number(
                  service.quantity || 0
                ),

              amount:
                Number(
                  service.amount || 0
                ),
            })
          ),
      };

      generateReceiptPdf({
        receipt,
        firm,
      });
    } catch (error) {
      console.error(
        "Failed to export receipt:",
        error
      );
    } finally {
      setExporting(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * EXPORT VOUCHER
   * ---------------------------------------------------------
   */

  function handleExportVoucher() {
    const savedBooking = saveBooking();

    if (!savedBooking) {
      return;
    }

    const firm = getFirmForBooking(savedBooking);

    if (!firm) {
      console.error(
        "Cannot export voucher: firm not found."
      );
      return;
    }

    setExporting("voucher");

    try {
      const voucher = {
        booking: savedBooking,

        voucherNo:
          getBookingNumber(savedBooking),

        date:
          savedBooking.bookingDate ||
          new Date().toLocaleDateString("en-CA"),

        guestName:
          savedBooking.customer.name,

        guestPhone:
          savedBooking.customer.phone,

        guestEmail:
          savedBooking.customer.email,

        travelDates:
          getTravelDates(savedBooking),

        totalAmount:
          savedBooking.services.reduce(
            (total, service) =>
              total +
              Number(service.amount || 0),
            0
          ),

        advancePayment:
          Number(
            savedBooking.amountReceived || 0
          ),

        yetToBePaid:
          Math.max(
            savedBooking.services.reduce(
              (total, service) =>
                total +
                Number(service.amount || 0),
              0
            ) -
            Number(
              savedBooking.amountReceived || 0
            ),
            0
          ),

        taxi:
          savedBooking.taxi,

        hotels:
          savedBooking.hotels,

        otherServices:
          savedBooking.otherServices,
      };

      exportVoucherPdf(
        voucher,
        firm
      );
    } catch (error) {
      console.error(
        "Failed to export voucher:",
        error
      );
    } finally {
      setExporting(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * EXPORT PAYMENT SCHEDULE
   * ---------------------------------------------------------
   */

  function handleExportPaymentSchedule() {
    const savedBooking = saveBooking();

    if (!savedBooking) {
      return;
    }

    const firm = getFirmForBooking(savedBooking);

    if (!firm) {
      console.error(
        "Cannot export payment schedule: firm not found."
      );
      return;
    }

    setExporting("payment");

    try {
      const totalAmount =
        savedBooking.services.reduce(
          (total, service) =>
            total +
            Number(service.amount || 0),
          0
        );

      const amountReceived =
        Number(
          savedBooking.amountReceived || 0
        );

      const paymentSchedule = {
        booking: savedBooking,

        bookingNumber:
          getBookingNumber(savedBooking),

        date:
          savedBooking.bookingDate ||
          new Date().toLocaleDateString("en-CA"),

        customerName:
          savedBooking.customer.name,

        customerPhone:
          savedBooking.customer.phone,

        customerEmail:
          savedBooking.customer.email,

        travelDates:
          getTravelDates(savedBooking),

        totalAmount,

        amountReceived,

        balanceDue:
          Math.max(
            totalAmount -
            amountReceived,
            0
          ),

        paymentSchedule:
          savedBooking.paymentSchedule,
      };

      generatePaymentSchedulePdf(
        paymentSchedule,
        firm
      );
    } catch (error) {
      console.error(
        "Failed to export payment schedule:",
        error
      );
    } finally {
      setExporting(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * GENERIC BOOKING UPDATES
   * ---------------------------------------------------------
   */

  function updateBooking(
    field:
      | "travelStartDate"
      | "travelEndDate"
      | "firmId"
      | "bookingSequence",
    value: string
  ) {
    const updated: Booking = {
      ...booking,
      [field]:
        field === "bookingSequence"
          ? Number(value)
          : value,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updateCustomer(
    field: "name" | "phone" | "email",
    value: string
  ) {
    const updated: Booking = {
      ...booking,
      customer: {
        ...booking.customer,
        [field]: value,
      },
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updateService(
    type: ServiceType,
    field:
      | "description"
      | "quantity"
      | "amount",
    value: string
  ) {
    const services = [
      ...booking.services,
    ];

    const index = services.findIndex(
      (service) =>
        service.type === type
    );

    if (index === -1) {
      return;
    }

    services[index] = {
      ...services[index],
      [field]:
        field === "description"
          ? value
          : Number(value),
    };

    const updated: Booking = {
      ...booking,
      services,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updateAmountReceived(
    value: string
  ) {
    const updated: Booking = {
      ...booking,
      amountReceived:
        value === ""
          ? 0
          : Number(value),
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function getService(
    type: ServiceType
  ) {
    return (
      booking.services.find(
        (service) =>
          service.type === type
      ) || {
        type,
        description: "N/A",
        quantity: 0,
        amount: 0,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * FIRM
   * ---------------------------------------------------------
   */

  function selectFirm(
    firmId: string
  ) {
    const firm = firmMaster.find(
      (item) => item.id === firmId
    );

    if (!firm) {
      return;
    }

    const updated: Booking = {
      ...booking,
      firmId: firm.id,
    };

    setBooking(updated);
    setFirmSearch(firm.name);
    setShowFirmResults(false);
    onChange?.(updated);
  }

  const filteredFirms =
    firmSearch.trim() === ""
      ? firmMaster
      : firmMaster.filter((firm) =>
        firm.name
          .toLowerCase()
          .startsWith(
            firmSearch
              .trim()
              .toLowerCase()
          )
      );

  /*
   * ---------------------------------------------------------
   * BOOKING VALUE
   * ---------------------------------------------------------
   */

  const bookingValue =
    booking.services.reduce(
      (total, service) =>
        total +
        Number(service.amount || 0),
      0
    );

  const balanceDue = Math.max(
    bookingValue -
    Number(
      booking.amountReceived || 0
    ),
    0
  );

  /*
   * ---------------------------------------------------------
   * TAXI
   * ---------------------------------------------------------
   */

  function updateTaxi(
    field:
      | "vehicle"
      | "startDate"
      | "endDate"
      | "contact",
    value: string
  ) {
    const currentTaxi =
      booking.taxi ?? {
        vehicle: "",
        startDate: "",
        endDate: "",
        contact: "",
      };

    const updatedTaxi = {
      ...currentTaxi,
      [field]: value,
    };

    let updatedServices =
      booking.services;

    if (field === "vehicle") {
      updatedServices =
        booking.services.map(
          (service) =>
            service.type === "taxi"
              ? {
                ...service,
                description:
                  value || "N/A",
              }
              : service
        );
    }

    const updated: Booking = {
      ...booking,
      taxi: updatedTaxi,
      services: updatedServices,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  /*
   * ---------------------------------------------------------
   * HOTELS
   * ---------------------------------------------------------
   */

  function addHotel() {
    const updated: Booking = {
      ...booking,
      hotels: [
        ...booking.hotels,
        {
          name: "",
          checkIn: "",
          checkOut: "",
          contact: "",
        },
      ],
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updateHotel(
    index: number,
    field:
      | "name"
      | "checkIn"
      | "checkOut"
      | "contact",
    value: string
  ) {
    const hotels = [
      ...booking.hotels,
    ];

    hotels[index] = {
      ...hotels[index],
      [field]: value,
    };

    const updated: Booking = {
      ...booking,
      hotels,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function removeHotel(
    index: number
  ) {
    const updated: Booking = {
      ...booking,
      hotels:
        booking.hotels.filter(
          (_, hotelIndex) =>
            hotelIndex !== index
        ),
    };

    setBooking(updated);
    onChange?.(updated);
  }

  /*
   * ---------------------------------------------------------
   * OTHER SERVICES
   * ---------------------------------------------------------
   */

  function addOtherService() {
    const updated: Booking = {
      ...booking,
      otherServices: [
        ...booking.otherServices,
        {
          name: "",
          details: "",
          contact: "",
        },
      ],
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updateOtherService(
    index: number,
    field:
      | "name"
      | "details"
      | "contact",
    value: string
  ) {
    const otherServices = [
      ...booking.otherServices,
    ];

    otherServices[index] = {
      ...otherServices[index],
      [field]: value,
    };

    const updated: Booking = {
      ...booking,
      otherServices,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function removeOtherService(
    index: number
  ) {
    const updated: Booking = {
      ...booking,
      otherServices:
        booking.otherServices.filter(
          (_, serviceIndex) =>
            serviceIndex !== index
        ),
    };

    setBooking(updated);
    onChange?.(updated);
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT SCHEDULE
   * ---------------------------------------------------------
   */

  function addPaymentSchedule(
    category:
      | "hotel"
      | "taxi"
      | "other"
  ) {
    const newEntry = {
      label: "",
      amount: 0,
      category,
      dueDate: "",
    };

    const updated: Booking = {
      ...booking,
      paymentSchedule: [
        ...booking.paymentSchedule,
        newEntry,
      ],
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function updatePaymentScheduleField(
    index: number,
    field:
      | "label"
      | "amount"
      | "dueDate",
    value: string
  ) {
    const paymentSchedule = [
      ...booking.paymentSchedule,
    ];

    paymentSchedule[index] = {
      ...paymentSchedule[index],
      [field]:
        field === "amount"
          ? Number(value)
          : value,
    };

    const updated: Booking = {
      ...booking,
      paymentSchedule,
    };

    setBooking(updated);
    onChange?.(updated);
  }

  function removePaymentSchedule(
    index: number
  ) {
    const updated: Booking = {
      ...booking,
      paymentSchedule:
        booking.paymentSchedule.filter(
          (_, paymentIndex) =>
            paymentIndex !== index
        ),
    };

    setBooking(updated);
    onChange?.(updated);
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-8">

      {/* =====================================================
          BOOKING INFORMATION
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Booking Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">

          {/* Firm */}

          <div className="relative">

            <label className="mb-1 block text-sm font-medium">
              Firm
            </label>

            <input
              type="text"
              value={firmSearch}
              onChange={(e) => {
                const value =
                  e.target.value;

                setFirmSearch(value);

                setShowFirmResults(
                  value.trim() !== ""
                );

                const exactFirm =
                  firmMaster.find(
                    (firm) =>
                      firm.name
                        .toLowerCase() ===
                      value
                        .trim()
                        .toLowerCase()
                  );

                const updated: Booking = {
                  ...booking,
                  firmId:
                    exactFirm?.id || "",
                };

                setBooking(updated);
                onChange?.(updated);
              }}
              onFocus={() => {
                if (
                  firmSearch.trim() !== ""
                ) {
                  setShowFirmResults(true);
                }
              }}
              placeholder="Search firm..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />

            {showFirmResults &&
              firmSearch.trim() !== "" &&
              filteredFirms.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded border border-gray-200 bg-white shadow-lg">

                  {filteredFirms.map(
                    (firm) => (
                      <button
                        key={firm.id}
                        type="button"
                        onClick={() =>
                          selectFirm(
                            firm.id
                          )
                        }
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {firm.name}
                      </button>
                    )
                  )}

                </div>
              )}

          </div>

          {/* Booking Sequence */}

          <div>

            <label className="mb-1 block text-sm font-medium">
              Booking No.
            </label>

            <input
              type="number"
              min="1"
              value={
                booking.bookingSequence ||
                ""
              }
              onChange={(e) =>
                updateBooking(
                  "bookingSequence",
                  e.target.value
                )
              }
              placeholder="10"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />

            <p className="mt-1 text-xs text-gray-500">
              Enter the next assigned
              booking number.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          CUSTOMER
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Customer Details
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">

          <div>

            <label className="mb-1 block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              value={
                booking.customer.name
              }
              onChange={(e) =>
                updateCustomer(
                  "name",
                  e.target.value
                )
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="Customer name"
            />

          </div>

          <div>

            <label className="mb-1 block text-sm font-medium">
              Phone
            </label>

            <input
              type="tel"
              value={
                booking.customer.phone
              }
              onChange={(e) =>
                updateCustomer(
                  "phone",
                  e.target.value
                )
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="+91..."
            />

          </div>

          <div>

            <label className="mb-1 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={
                booking.customer.email
              }
              onChange={(e) =>
                updateCustomer(
                  "email",
                  e.target.value
                )
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              placeholder="customer@email.com"
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          TRAVEL
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Travel Details
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-1 block text-sm font-medium">
              Travel Start Date
            </label>

            <input
              type="date"
              value={
                booking.travelStartDate
              }
              onChange={(e) =>
                updateBooking(
                  "travelStartDate",
                  e.target.value
                )
              }
              onClick={(e) =>
                e.currentTarget.showPicker?.()
              }
              className="w-full cursor-pointer rounded border border-gray-300 px-3 py-2 text-sm"
            />

          </div>

          <div>

            <label className="mb-1 block text-sm font-medium">
              Travel End Date
            </label>

            <input
              type="date"
              value={
                booking.travelEndDate
              }
              onChange={(e) =>
                updateBooking(
                  "travelEndDate",
                  e.target.value
                )
              }
              onClick={(e) =>
                e.currentTarget.showPicker?.()
              }
              className="w-full cursor-pointer rounded border border-gray-300 px-3 py-2 text-sm"
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          RECEIPT SERVICES
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Receipt Services
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px] text-sm">

            <thead>
              <tr className="border-b border-gray-300">

                <th className="px-3 py-2 text-left">
                  Service
                </th>

                <th className="px-3 py-2 text-left">
                  Description
                </th>

                <th className="px-3 py-2 text-center">
                  Qty
                </th>

                <th className="px-3 py-2 text-right">
                  Amount
                </th>

              </tr>
            </thead>

            <tbody>

              {/* Taxi */}

              <tr className="border-b border-gray-200">

                <td className="px-3 py-3 font-medium">
                  Taxi/s
                </td>

                <td className="px-3 py-3">

                  <input
                    type="text"
                    value={
                      booking.taxi?.vehicle ||
                      ""
                    }
                    onChange={(e) =>
                      updateTaxi(
                        "vehicle",
                        e.target.value
                      )
                    }
                    placeholder="Innova Crysta"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("taxi").quantity === 0
                        ? ""
                        : getService("taxi").quantity
                    }
                    onChange={(e) =>
                      updateService(
                        "taxi",
                        "quantity",
                        e.target.value
                      )
                    }
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateService(
                          "taxi",
                          "quantity",
                          "0"
                        );
                      }
                    }}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-center"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("taxi")
                        .amount
                    }
                    onChange={(e) =>
                      updateService(
                        "taxi",
                        "amount",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-right"
                  />

                </td>

              </tr>

              {/* Hotel */}

              <tr className="border-b border-gray-200">

                <td className="px-3 py-3 font-medium">
                  Hotel/s
                </td>

                <td className="px-3 py-3">

                  <input
                    type="text"
                    value={
                      getService("hotel")
                        .description
                    }
                    onChange={(e) =>
                      updateService(
                        "hotel",
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Deluxe"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("hotel").quantity === 0
                        ? ""
                        : getService("hotel").quantity
                    }
                    onChange={(e) =>
                      updateService(
                        "hotel",
                        "quantity",
                        e.target.value
                      )
                    }
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateService(
                          "hotel",
                          "quantity",
                          "0"
                        );
                      }
                    }}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-center"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("hotel")
                        .amount
                    }
                    onChange={(e) =>
                      updateService(
                        "hotel",
                        "amount",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-right"
                  />

                </td>

              </tr>

              {/* Flight */}

              <tr className="border-b border-gray-200">

                <td className="px-3 py-3 font-medium">
                  Ticket/s
                </td>

                <td className="px-3 py-3">

                  <input
                    type="text"
                    value={
                      getService("flight")
                        .description
                    }
                    onChange={(e) =>
                      updateService(
                        "flight",
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="N/A"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("flight").quantity === 0
                        ? ""
                        : getService("flight").quantity
                    }
                    onChange={(e) =>
                      updateService(
                        "flight",
                        "quantity",
                        e.target.value
                      )
                    }
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateService(
                          "flight",
                          "quantity",
                          "0"
                        );
                      }
                    }}
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-center"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("flight")
                        .amount
                    }
                    onChange={(e) =>
                      updateService(
                        "flight",
                        "amount",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-right"
                  />

                </td>

              </tr>

              {/* Miscellaneous */}

              <tr>

                <td className="px-3 py-3 font-medium">
                  Miscellaneous
                </td>

                <td className="px-3 py-3">

                  <input
                    type="text"
                    value={
                      getService(
                        "miscellaneous"
                      ).description
                    }
                    onChange={(e) =>
                      updateService(
                        "miscellaneous",
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Permit"
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService("miscellaneous").quantity === 0
                        ? ""
                        : getService("miscellaneous").quantity
                    }
                    onChange={(e) =>
                      updateService(
                        "miscellaneous",
                        "quantity",
                        e.target.value
                      )
                    }
                    className="w-24 rounded border border-gray-300 px-3 py-2 text-center"
                  />

                </td>

                <td className="px-3 py-3">

                  <input
                    type="number"
                    min="0"
                    value={
                      getService(
                        "miscellaneous"
                      ).amount
                    }
                    onChange={(e) =>
                      updateService(
                        "miscellaneous",
                        "amount",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-right"
                  />

                </td>

              </tr>

            </tbody>

          </table>

        </div>

        {/* =====================================================
            PAYMENT DETAILS
        ====================================================== */}

        <section className="mt-6 rounded-lg border border-gray-200 p-5">

          <h2 className="mb-4 text-lg font-bold">
            Payment Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-1 block text-sm font-medium">
                Amount Received
              </label>

              <input
                type="number"
                min="0"
                value={
                  booking.amountReceived ===
                    0
                    ? ""
                    : booking.amountReceived
                }
                onChange={(e) =>
                  updateAmountReceived(
                    e.target.value
                  )
                }
                placeholder="0.00"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />

            </div>

          </div>

          <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">

            <div className="flex justify-between">

              <span>
                Booking Value
              </span>

              <span>
                ₹
                {bookingValue.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between">

              <span>
                Payment Received
              </span>

              <span>
                ₹
                {Number(
                  booking.amountReceived || 0
                ).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">

              <span>
                Balance Due
              </span>

              <span>
                ₹
                {balanceDue.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

          </div>

          {/* Receipt Actions */}

          <div className="mt-6 border-t border-gray-200 pt-5">

            <div className="flex flex-wrap items-center justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  handleSave("receipt")
                }
                className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Save
              </button>

              <button
                type="button"
                onClick={onReceipt}
                className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Preview
              </button>

              <button
                type="button"
                onClick={handleExportReceipt}
                disabled={
                  exporting !== null
                }
                className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exporting === "receipt"
                  ? "Exporting..."
                  : "PDF"}
              </button>

            </div>

            {savedSection === "receipt" && (
              <div className="mt-2 text-right text-sm text-green-600">
                Receipt Saved
              </div>
            )}

          </div>

        </section>

      </section>

      {/* =====================================================
          VOUCHER DETAILS
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Voucher Details
        </h2>

        {/* Taxi */}

        <div className="rounded-lg border border-gray-200 p-4">

          <h3 className="mb-4 font-semibold">
            Taxi
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div>

              <label className="mb-1 block text-sm font-medium">
                Vehicle
              </label>

              <input
                type="text"
                value={
                  booking.taxi?.vehicle ||
                  ""
                }
                disabled
                placeholder="Innova Crysta"
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
              />

            </div>

            <div>

              <label className="mb-1 block text-sm font-medium">
                Transporter Contact
              </label>

              <input
                type="tel"
                value={
                  booking.taxi?.contact ||
                  ""
                }
                onChange={(e) =>
                  updateTaxi(
                    "contact",
                    e.target.value
                  )
                }
                placeholder="+91..."
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />

            </div>

          </div>

        </div>

        {/* Hotels */}

        <div className="mt-5 rounded-lg border border-gray-200 p-4">

          <div className="mb-4 flex items-center justify-between">

            <h3 className="font-semibold">
              Hotels
            </h3>

            <button
              type="button"
              onClick={addHotel}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              + Add Hotel
            </button>

          </div>

          {booking.hotels.length ===
            0 && (
              <p className="text-sm text-gray-500">
                No hotels added.
              </p>
            )}

          <div className="space-y-4">

            {booking.hotels.map(
              (hotel, index) => (
                <div
                  key={index}
                  className="rounded border border-gray-200 p-4"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm font-medium">
                      Hotel {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeHotel(
                          index
                        )
                      }
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Hotel Name
                      </label>

                      <input
                        type="text"
                        value={hotel.name}
                        onChange={(e) =>
                          updateHotel(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Hotel Ekant"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Check-in
                      </label>

                      <input
                        type="date"
                        value={
                          hotel.checkIn
                        }
                        onChange={(e) =>
                          updateHotel(
                            index,
                            "checkIn",
                            e.target.value
                          )
                        }
                        onClick={(e) =>
                          e.currentTarget.showPicker?.()
                        }
                        className="w-full cursor-pointer rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Check-out
                      </label>

                      <input
                        type="date"
                        value={
                          hotel.checkOut
                        }
                        onChange={(e) =>
                          updateHotel(
                            index,
                            "checkOut",
                            e.target.value
                          )
                        }
                        onClick={(e) =>
                          e.currentTarget.showPicker?.()
                        }
                        className="w-full cursor-pointer rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Contact
                      </label>

                      <input
                        type="tel"
                        value={
                          hotel.contact ||
                          ""
                        }
                        onChange={(e) =>
                          updateHotel(
                            index,
                            "contact",
                            e.target.value
                          )
                        }
                        placeholder="+91..."
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* Other Services */}

        <div className="mt-5 rounded-lg border border-gray-200 p-4">

          <div className="mb-4 flex items-center justify-between">

            <h3 className="font-semibold">
              Other Arranged Services
            </h3>

            <button
              type="button"
              onClick={
                addOtherService
              }
              className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
            >
              + Add Service
            </button>

          </div>

          {booking.otherServices
            .length === 0 && (
              <p className="text-sm text-gray-500">
                No other services added.
              </p>
            )}

          <div className="space-y-4">

            {booking.otherServices.map(
              (service, index) => (
                <div
                  key={index}
                  className="rounded border border-gray-200 p-4"
                >

                  <div className="mb-3 flex items-center justify-between">

                    <span className="text-sm font-medium">
                      Service {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeOtherService(
                          index
                        )
                      }
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>

                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Service
                      </label>

                      <input
                        type="text"
                        value={
                          service.name
                        }
                        onChange={(e) =>
                          updateOtherService(
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Airport Transfer"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Details
                      </label>

                      <input
                        type="text"
                        value={
                          service.details ||
                          ""
                        }
                        onChange={(e) =>
                          updateOtherService(
                            index,
                            "details",
                            e.target.value
                          )
                        }
                        placeholder="Pickup from Chandigarh Airport"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-sm font-medium">
                        Contact
                      </label>

                      <input
                        type="tel"
                        value={
                          service.contact ||
                          ""
                        }
                        onChange={(e) =>
                          updateOtherService(
                            index,
                            "contact",
                            e.target.value
                          )
                        }
                        placeholder="+91..."
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </div>

        {/* Voucher Actions */}

        <div className="mt-6 border-t border-gray-200 pt-5">

          <div className="flex flex-wrap items-center justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                handleSave("voucher")
              }
              className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Save
            </button>

            <button
              type="button"
              onClick={onVoucher}
              className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Preview
            </button>

            <button
              type="button"
              onClick={
                handleExportVoucher
              }
              disabled={
                exporting !== null
              }
              className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting === "voucher"
                ? "Exporting..."
                : "PDF"}
            </button>

          </div>

          {savedSection === "voucher" && (
            <div className="mt-2 text-right text-sm text-green-600">
              Voucher Saved
            </div>
          )}

        </div>

      </section>

      {/* =====================================================
          PAYMENT SCHEDULE
      ====================================================== */}

      <section className="rounded-lg border border-gray-200 p-5">

        <h2 className="mb-4 text-lg font-bold">
          Payment Schedule
        </h2>

        <div className="space-y-5">

          {/* Taxi Payments */}

          <div className="rounded-lg border border-gray-200 p-4">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="font-semibold">
                Taxi Payments
              </h3>

              <button
                type="button"
                onClick={() =>
                  addPaymentSchedule(
                    "taxi"
                  )
                }
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                + Add Taxi Payment
              </button>

            </div>

            {booking.paymentSchedule.filter(
              (entry) =>
                entry.category ===
                "taxi"
            ).length === 0 && (
                <p className="text-sm text-gray-500">
                  No taxi payments added.
                </p>
              )}

            <div className="space-y-3">

              {booking.paymentSchedule.map(
                (entry, index) => {

                  if (
                    entry.category !==
                    "taxi"
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
                    >

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Payment Name
                        </label>

                        <input
                          type="text"
                          value={
                            entry.label
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="Day 1"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Amount
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            entry.amount ===
                              0
                              ? ""
                              : entry.amount
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removePaymentSchedule(
                            index
                          )
                        }
                        className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* Hotel Payments */}

          <div className="rounded-lg border border-gray-200 p-4">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="font-semibold">
                Hotel Payments
              </h3>

              <button
                type="button"
                onClick={() =>
                  addPaymentSchedule(
                    "hotel"
                  )
                }
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                + Add Hotel Payment
              </button>

            </div>

            {booking.paymentSchedule.filter(
              (entry) =>
                entry.category ===
                "hotel"
            ).length === 0 && (
                <p className="text-sm text-gray-500">
                  No hotel payments added.
                </p>
              )}

            <div className="space-y-3">

              {booking.paymentSchedule.map(
                (entry, index) => {

                  if (
                    entry.category !==
                    "hotel"
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
                    >

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Payment Name
                        </label>

                        <input
                          type="text"
                          value={
                            entry.label
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="Hotel Traveller Inn, Shimla"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Amount
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            entry.amount ===
                              0
                              ? ""
                              : entry.amount
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removePaymentSchedule(
                            index
                          )
                        }
                        className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* Other Payments */}

          <div className="rounded-lg border border-gray-200 p-4">

            <div className="mb-4 flex items-center justify-between">

              <h3 className="font-semibold">
                Other Payments
              </h3>

              <button
                type="button"
                onClick={() =>
                  addPaymentSchedule(
                    "other"
                  )
                }
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
              >
                + Add Other Payment
              </button>

            </div>

            {booking.paymentSchedule.filter(
              (entry) =>
                entry.category ===
                "other"
            ).length === 0 && (
                <p className="text-sm text-gray-500">
                  No other payments added.
                </p>
              )}

            <div className="space-y-3">

              {booking.paymentSchedule.map(
                (entry, index) => {

                  if (
                    entry.category !==
                    "other"
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end"
                    >

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Payment Name
                        </label>

                        <input
                          type="text"
                          value={
                            entry.label
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="Permit payment"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <div>

                        <label className="mb-1 block text-sm font-medium">
                          Amount
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            entry.amount ===
                              0
                              ? ""
                              : entry.amount
                          }
                          onChange={(e) =>
                            updatePaymentScheduleField(
                              index,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removePaymentSchedule(
                            index
                          )
                        }
                        className="rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

        {/* Payment Schedule Actions */}

        <div className="mt-6 border-t border-gray-200 pt-5">

          <div className="flex flex-wrap items-center justify-end gap-3">

            <button
              type="button"
              onClick={() =>
                handleSave("payment")
              }
              className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Save
            </button>

            <button
              type="button"
              onClick={
                onPaymentSchedule
              }
              className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Preview
            </button>

            <button
              type="button"
              onClick={
                handleExportPaymentSchedule
              }
              disabled={
                exporting !== null
              }
              className="rounded border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting === "payment"
                ? "Exporting..."
                : "PDF"}
            </button>

          </div>

          {savedSection === "payment" && (
            <div className="mt-2 text-right text-sm text-green-600">
              Schedule Saved
            </div>
          )}

        </div>

      </section>

    </div>
  );
}