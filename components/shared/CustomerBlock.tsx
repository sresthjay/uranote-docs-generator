import { Customer } from "@/lib/types";

interface CustomerBlockProps {
  customer: Customer;
  bookingId: string;
  travelStartDate: string;
  travelEndDate: string;
}

function formatDate(date: string) {
  if (!date) return "";

  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CustomerBlock({
  customer,
  bookingId,
  travelStartDate,
  travelEndDate,
}: CustomerBlockProps) {
  return (
    <section className="mt-6 rounded border border-gray-300 p-4">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
        Guest / Customer
      </h3>

      <div className="grid gap-3 text-sm sm:grid-cols-2">

        <div>
          <p>
            <span className="font-semibold">
              Guest Name:
            </span>{" "}{customer.name}
          </p>

          <p><span className="font-semibold">
              Contact Number:
            </span>{" "}{customer.phone}</p>

          {customer.email && (
            <p>{customer.email}</p>
          )}
        </div>

        <div>
          <p>
            <span className="font-semibold">
              Travel Dates:
            </span>{" "}
            {formatDate(travelStartDate)}
            {" – "}
            {formatDate(travelEndDate)}
          </p>
        </div>

      </div>
    </section>
  );
}