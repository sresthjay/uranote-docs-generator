import {
  PaymentSchedule as PaymentScheduleData,
  Firm,
} from "@/lib/types";
import DocumentHeader from "@/components/shared/DocumentHeader";
import DocumentFooter from "@/components/shared/DocumentFooter";
import DocumentPage from "@/components/shared/DocumentPage";
import { calculatePendingAmount } from "@/lib/calculations";
import { PAYMENT_TERMS } from "@/lib/payment-terms";
import { formatBookingNumber } from "@/lib/booking-number";

interface PaymentScheduleProps {
  schedule: PaymentScheduleData;
  firm: Firm;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function PaymentSchedule({
  schedule,
  firm,
}: PaymentScheduleProps) {
  const { booking } = schedule;

  const bookingValue = booking.services.reduce(
    (total, service) => total + service.amount,
    0
  );

  const hotelPayments = booking.paymentSchedule.filter(
    (entry) => entry.category === "hotel"
  );

  const taxiPayments = booking.paymentSchedule.filter(
    (entry) => entry.category === "taxi"
  );

  const otherPayments = booking.paymentSchedule.filter(
    (entry) => entry.category === "other"
  );

  const hotelTotal = hotelPayments.reduce(
    (total, entry) => total + entry.amount,
    0
  );

  const taxiTotal = taxiPayments.reduce(
    (total, entry) => total + entry.amount,
    0
  );

  const otherTotal = otherPayments.reduce(
    (total, entry) => total + entry.amount,
    0
  );

  const totalPending =
  hotelTotal +
  taxiTotal +
  otherTotal;

  return (
    <DocumentPage>
      <div className="print-document">
        {/* Header */}
        <DocumentHeader
          firm={firm}
          title="Remaining Payment Schedule"
          documentNumber={formatBookingNumber(booking, firm)}
          date={schedule.date}
        />

        {/* Guest Information */}
        <section className="mt-5 rounded border border-gray-300 px-4 py-3">
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-semibold">
                Guest Name:
              </span>{" "}
              {booking.customer.name}
            </div>

            <div>
              <span className="font-semibold">
                Travel Dates:
              </span>{" "}
              {formatDate(booking.travelStartDate)}
              {" – "}
              {formatDate(booking.travelEndDate)}
            </div>
          </div>
        </section>

        {/* Total Pending */}
        <section className="mt-5">
          <div className="rounded border border-gray-300 px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                Total Pending Payment
              </span>

              <span className="text-lg font-bold">
                {formatCurrency(totalPending)}
              </span>
            </div>
          </div>
        </section>

        {/* Hotel Payments */}
        {hotelPayments.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 border-b-2 border-gray-900 pb-2 text-sm font-bold uppercase tracking-wide">
              Hotel Payments
            </h3>

            <div className="rounded border border-gray-300">
              {hotelPayments.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0"
                >
                  <div>
                    <p className="font-medium">
                      {entry.label}
                    </p>

                    {entry.dueDate && (
                      <p className="text-xs text-gray-600">
                        Due: {formatDate(entry.dueDate)}
                      </p>
                    )}
                  </div>

                  <span className="font-semibold">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t-2 border-gray-300 px-4 py-3 text-sm font-bold">
                <span>Hotel Total</span>
                <span>{formatCurrency(hotelTotal)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Taxi Payments */}
        {taxiPayments.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 border-b-2 border-gray-900 pb-2 text-sm font-bold uppercase tracking-wide">
              Taxi Payments
            </h3>

            <div className="rounded border border-gray-300">
              {taxiPayments.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0"
                >
                  <div>
                    <p className="font-medium">
                      {entry.label}
                    </p>

                    {entry.dueDate && (
                      <p className="text-xs text-gray-600">
                        Due: {formatDate(entry.dueDate)}
                      </p>
                    )}
                  </div>

                  <span className="font-semibold">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t-2 border-gray-300 px-4 py-3 text-sm font-bold">
                <span>Taxi Total</span>
                <span>{formatCurrency(taxiTotal)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Other Payments */}
        {otherPayments.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 border-b-2 border-gray-900 pb-2 text-sm font-bold uppercase tracking-wide">
              Other Payments
            </h3>

            <div className="rounded border border-gray-300">
              {otherPayments.map((entry, index) => (
                <div
                  key={`${entry.label}-${index}`}
                  className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0"
                >
                  <span className="font-medium">
                    {entry.label}
                  </span>

                  <span className="font-semibold">
                    {formatCurrency(entry.amount)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t-2 border-gray-300 px-4 py-3 text-sm font-bold">
                <span>Other Total</span>
                <span>{formatCurrency(otherTotal)}</span>
              </div>
            </div>
          </section>
        )}

        {/* Payment Terms */}
        <section className="mt-8">
          <h3 className="mb-3 border-b-2 border-gray-900 pb-2 text-sm font-bold uppercase tracking-wide">
            Payment Terms
          </h3>

          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {PAYMENT_TERMS.map((term, index) => (
              <li key={index}>
                {term.replace("{firmName}", firm.name)}
              </li>
            ))}
          </ol>
        </section>

        <DocumentFooter firm={firm} />
      </div>
    </DocumentPage>
  );
}