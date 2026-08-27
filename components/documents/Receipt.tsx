import { Receipt as ReceiptData, Firm } from "@/lib/types";
import DocumentHeader from "@/components/shared/DocumentHeader";
import CustomerBlock from "@/components/shared/CustomerBlock";
import DocumentFooter from "@/components/shared/DocumentFooter";
import DocumentPage from "@/components/shared/DocumentPage";
import { formatBookingNumber } from "@/lib/booking-number";
import {
  calculatePendingAmount,
  calculateSubtotal,
} from "@/lib/calculations";

interface ReceiptProps {
  receipt: ReceiptData;
  firm: Firm;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function serviceName(type: string) {
  switch (type) {
    case "taxi":
      return "Taxi/s";
    case "hotel":
      return "Hotel/s";
    case "flight":
      return "Flight Ticket/s";
    case "miscellaneous":
      return "Miscellaneous";
    default:
      return type;
  }
}

export default function Receipt({
  receipt,
  firm,
}: ReceiptProps) {
  const { booking } = receipt;

  // Booking value is calculated directly from the services.
  const bookingValue = calculateSubtotal(booking.services);

  // amountReceived represents the cumulative amount received
  // against this booking.
  const balanceDue = calculatePendingAmount(
    bookingValue,
    booking.amountReceived
  );

  return (
    <DocumentPage>
      <div className="print-document">
        <DocumentHeader
          firm={firm}
          title="Receipt"
          documentNumber={formatBookingNumber(booking, firm)}
          date={receipt.date}
        />

        <CustomerBlock
          customer={booking.customer}
          bookingId={booking.bookingId}
          travelStartDate={booking.travelStartDate}
          travelEndDate={booking.travelEndDate}
        />

        <section className="mt-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y-2 border-gray-900">
                <th className="px-3 py-3 text-left">
                  Service
                </th>

                <th className="px-3 py-3 text-left">
                  Description
                </th>

                <th className="px-3 py-3 text-center">
                  Qty
                </th>

                <th className="px-3 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {booking.services.map((service, index) => (
                <tr
                  key={`${service.type}-${index}`}
                  className="border-b border-gray-200"
                >
                  <td className="px-3 py-3 font-medium">
                    {serviceName(service.type)}
                  </td>

                  <td className="px-3 py-3">
                    {service.description || "N/A"}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {service.quantity}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {formatCurrency(service.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 ml-auto w-full max-w-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Booking Value</span>
              <span>
                {formatCurrency(bookingValue)}
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
              <span>Total</span>
              <span>
                {formatCurrency(bookingValue)}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span>Payment Received</span>
              <span>
                {formatCurrency(booking.amountReceived)}
              </span>
            </div>

            <div className="flex justify-between font-bold">
              <span>Balance Due</span>
              <span>
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </section>

        {(receipt.paymentMethod ||
          receipt.transactionReference) && (
            <section className="mt-6 rounded border border-gray-200 p-4 text-sm">
              <h3 className="mb-2 font-bold">
                Payment Details
              </h3>

              {receipt.paymentMethod && (
                <p>
                  <span className="font-semibold">
                    Mode:
                  </span>{" "}
                  {receipt.paymentMethod}
                </p>
              )}

              {receipt.transactionReference && (
                <p>
                  <span className="font-semibold">
                    Reference:
                  </span>{" "}
                  {receipt.transactionReference}
                </p>
              )}
            </section>
          )}

        <DocumentFooter firm={firm} />
      </div>
    </DocumentPage>
  );
}