"use client";

import { useState } from "react";

import { firmMaster } from "@/lib/firm-master";
import {
  Firm,
  VendorBookingRequest,
} from "@/lib/types";
import {
  exportVendorBookingRequestPdf,
} from "@/lib/pdf/vendor-booking-request-pdf";

import "./BookingForm.css";

const defaultFirm = firmMaster[0];

interface VendorBookingRequestFormProps {
  onClose: () => void;
}

interface StayValues {
  checkIn: string;
  checkOut: string;
  numberOfNights: string;
}

interface FormValues {
  firmId: string;
  guestName: string;
  contactNumber: string;
  numberOfGuests: string;
  propertyName: string;
  destination: string;
  stays: StayValues[];
  numberOfRooms: string;
  roomType: string;
  mealPlan: string;
  specialRequirements: string;
  totalCost: string;
  advancePayment: string;
}

function createStayValues(): StayValues {
  return {
    checkIn: "",
    checkOut: "",
    numberOfNights: "",
  };
}

function createInitialValues(): FormValues {
  return {
    firmId: defaultFirm?.id || "",
    guestName: "",
    contactNumber: "",
    numberOfGuests: "",
    propertyName: "",
    destination: "",
    stays: [createStayValues()],
    numberOfRooms: "",
    roomType: "",
    mealPlan: "",
    specialRequirements: "",
    totalCost: "",
    advancePayment: "",
  };
}

function calculateNights(
  checkIn: string,
  checkOut: string
): number | null {
  if (!checkIn || !checkOut) {
    return null;
  }

  const start = new Date(
    `${checkIn}T00:00:00Z`
  ).getTime();

  const end = new Date(
    `${checkOut}T00:00:00Z`
  ).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.round((end - start) / 86400000)
  );
}

function parseNumber(value: string): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export default function VendorBookingRequestForm({
  onClose,
}: VendorBookingRequestFormProps) {
  const [values, setValues] =
    useState<FormValues>(createInitialValues);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] = useState("");

  function updateValue(
    field: Exclude<keyof FormValues, "stays">,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateStayDate(
    index: number,
    field: "checkIn" | "checkOut",
    value: string
  ) {
    setValues((current) => {
      const stays = current.stays.map(
        (stay, stayIndex) => {
          if (stayIndex !== index) {
            return stay;
          }

          const updatedStay = {
            ...stay,
            [field]: value,
          };

          const nights = calculateNights(
            updatedStay.checkIn,
            updatedStay.checkOut
          );

          return {
            ...updatedStay,
            numberOfNights:
              nights !== null
                ? String(nights)
                : "",
          };
        }
      );

      return {
        ...current,
        stays,
      };
    });
  }

  function updateStayNights(
    index: number,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      stays: current.stays.map(
        (stay, stayIndex) =>
          stayIndex === index
            ? {
              ...stay,
              numberOfNights: value,
            }
            : stay
      ),
    }));
  }

  function addStay() {
    setValues((current) => ({
      ...current,
      stays: [
        ...current.stays,
        createStayValues(),
      ],
    }));
  }

  function removeStay(index: number) {
    setValues((current) => ({
      ...current,
      stays: current.stays.filter(
        (_stay, stayIndex) =>
          stayIndex !== index
      ),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (exporting) {
      return;
    }

    const firm: Firm | undefined =
      firmMaster.find(
        (item) => item.id === values.firmId
      );

    if (!firm) {
      setError(
        "Please select a firm before exporting the PDF."
      );
      return;
    }

    const request: VendorBookingRequest = {
      firmId: firm.id,

      guestName: values.guestName.trim(),
      contactNumber:
        values.contactNumber.trim(),
      numberOfGuests: Math.max(
        0,
        parseNumber(values.numberOfGuests)
      ),

      propertyName:
        values.propertyName.trim(),
      destination: values.destination.trim(),

      stays: values.stays.map((stay) => ({
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        numberOfNights: Math.max(
          0,
          parseNumber(stay.numberOfNights)
        ),
      })),

      numberOfRooms: Math.max(
        0,
        parseNumber(values.numberOfRooms)
      ),
      roomType: values.roomType.trim(),

      mealPlan: values.mealPlan.trim(),

      specialRequirements:
        values.specialRequirements.trim(),

      totalCost: Math.max(
        0,
        parseNumber(values.totalCost)
      ),
      advancePayment: Math.max(
        0,
        parseNumber(values.advancePayment)
      ),
    };

    setError("");
    setExporting(true);

    try {
      await exportVendorBookingRequestPdf(
        request,
        firm
      );
    } catch (exportError) {
      console.error(exportError);

      setError(
        "Unable to generate the PDF right now. Please try again."
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="booking-form flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Firm */}

        <section>
          <h2>Issuing Firm</h2>

          <div>
            <label htmlFor="vendor-firm">
              Firm
            </label>

            <select
              id="vendor-firm"
              value={values.firmId}
              onChange={(event) =>
                updateValue(
                  "firmId",
                  event.target.value
                )
              }
              required
            >
              {firmMaster.map((firm) => (
                <option
                  key={firm.id}
                  value={firm.id}
                >
                  {firm.name}
                </option>
              ))}
            </select>

            <p className="helper-text">
              The contact person and phone number
              on the PDF come from this firm&apos;s
              Firm Master record.
            </p>
          </div>
        </section>

        {/* Guest Details */}

        <section>
          <h2>Guest Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vendor-guest-name">
                Guest Name
              </label>

              <input
                id="vendor-guest-name"
                type="text"
                value={values.guestName}
                onChange={(event) =>
                  updateValue(
                    "guestName",
                    event.target.value
                  )
                }
                placeholder="Full name"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="vendor-contact-number">
                Contact Number
              </label>

              <input
                id="vendor-contact-number"
                type="tel"
                inputMode="tel"
                value={values.contactNumber}
                onChange={(event) =>
                  updateValue(
                    "contactNumber",
                    event.target.value
                  )
                }
                placeholder="+91..."
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="vendor-guest-count">
                Number of Guests
              </label>

              <input
                id="vendor-guest-count"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.numberOfGuests}
                onChange={(event) =>
                  updateValue(
                    "numberOfGuests",
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </div>
          </div>
        </section>

        {/* Property Details */}

        <section>
          <h2>Property Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vendor-property-name">
                Property Name
              </label>

              <input
                id="vendor-property-name"
                type="text"
                value={values.propertyName}
                onChange={(event) =>
                  updateValue(
                    "propertyName",
                    event.target.value
                  )
                }
                placeholder="Hotel / resort name"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label htmlFor="vendor-destination">
                Destination
              </label>

              <input
                id="vendor-destination"
                type="text"
                value={values.destination}
                onChange={(event) =>
                  updateValue(
                    "destination",
                    event.target.value
                  )
                }
                placeholder="City / destination"
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        {/* Stay Details */}

        <section>
          <h2>Stay Details</h2>

          <div className="space-y-4">
            {values.stays.map((stay, index) => {
              const suffix =
                index === 0 ? "" : `-${index}`;

              return (
                <div
                  key={index}
                  className="form-card"
                >
                  <div className="form-card-header">
                    <span className="text-sm font-semibold">
                      Stay {index + 1}
                    </span>

                    {values.stays.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          removeStay(index)
                        }
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div>
                      <label
                        htmlFor={`vendor-check-in${suffix}`}
                      >
                        Check-in Date
                      </label>

                      <input
                        id={`vendor-check-in${suffix}`}
                        type="date"
                        value={stay.checkIn}
                        onChange={(event) =>
                          updateStayDate(
                            index,
                            "checkIn",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`vendor-check-out${suffix}`}
                      >
                        Check-out Date
                      </label>

                      <input
                        id={`vendor-check-out${suffix}`}
                        type="date"
                        value={stay.checkOut}
                        min={
                          stay.checkIn || undefined
                        }
                        onChange={(event) =>
                          updateStayDate(
                            index,
                            "checkOut",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {index ===
                      values.stays.length - 1 && (
                      <button
                        type="button"
                        onClick={addStay}
                        className="btn-add w-full sm:w-auto"
                        title="Add another check-in and check-out date"
                        aria-label="Add another check-in and check-out date"
                      >
                        + Add Dates
                      </button>
                    )}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`vendor-nights${suffix}`}
                    >
                      Number of Nights
                    </label>

                    <input
                      id={`vendor-nights${suffix}`}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={stay.numberOfNights}
                      onChange={(event) =>
                        updateStayNights(
                          index,
                          event.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="helper-text">
            Number of nights is calculated from each
            check-in and check-out pair. You can edit
            it if needed. Use &quot;Add Dates&quot; when
            the stay has more than one date range.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vendor-rooms">
                Number of Rooms
              </label>

              <input
                id="vendor-rooms"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={values.numberOfRooms}
                onChange={(event) =>
                  updateValue(
                    "numberOfRooms",
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="vendor-room-type">
                Room Type
              </label>

              <input
                id="vendor-room-type"
                type="text"
                value={values.roomType}
                onChange={(event) =>
                  updateValue(
                    "roomType",
                    event.target.value
                  )
                }
                placeholder="Deluxe, Suite, Double, etc."
                autoComplete="off"
              />
            </div>
          </div>
        </section>

        {/* Meal Details */}

        <section>
          <h2>Meal Details</h2>

          <div>
            <label htmlFor="vendor-meal-plan">
              Meal Plan
            </label>

            <input
              id="vendor-meal-plan"
              type="text"
              list="vendor-meal-plan-options"
              value={values.mealPlan}
              onChange={(event) =>
                updateValue(
                  "mealPlan",
                  event.target.value
                )
              }
              placeholder="EP, CP, MAP, AP or custom"
              autoComplete="off"
            />

            <datalist id="vendor-meal-plan-options">
              <option value="EP" />
              <option value="CP" />
              <option value="MAP" />
              <option value="AP" />
            </datalist>

            <p className="helper-text">
              Choose a standard plan or type your
              own meal arrangement.
            </p>
          </div>
        </section>

        {/* Special Requirements */}

        <section>
          <h2>Special Requirements</h2>

          <div>
            <label htmlFor="vendor-special-requirements">
              Requirements
            </label>

            <textarea
              id="vendor-special-requirements"
              rows={5}
              value={values.specialRequirements}
              onChange={(event) =>
                updateValue(
                  "specialRequirements",
                  event.target.value
                )
              }
              placeholder={
                "Date-wise meal requirements, bonfire, room preferences, arrival details and any other special arrangements."
              }
            />
          </div>
        </section>

        {/* Financial Details */}

        <section>
          <h2>Financial Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vendor-total-cost">
                Total Cost
              </label>

              <input
                id="vendor-total-cost"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={values.totalCost}
                onChange={(event) =>
                  updateValue(
                    "totalCost",
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="vendor-advance-payment">
                Advance Payment
              </label>

              <input
                id="vendor-advance-payment"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={values.advancePayment}
                onChange={(event) =>
                  updateValue(
                    "advancePayment",
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}

      <div className="border-t border-gray-200 bg-white p-4 sm:px-6">
        {error && (
          <p className="mb-3 mt-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="btn-secondary w-full sm:w-auto"
          >
            Close
          </button>

          <button
            type="submit"
            disabled={exporting}
            className="btn-primary w-full sm:w-auto"
          >
            {exporting
              ? "Generating PDF..."
              : "Export PDF"}
          </button>
        </div>
      </div>
    </form>
  );
}
