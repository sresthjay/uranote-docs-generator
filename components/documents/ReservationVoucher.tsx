import {
    ReservationVoucher as VoucherData,
    Firm,
} from "@/lib/types";
import DocumentHeader from "@/components/shared/DocumentHeader";
import DocumentFooter from "@/components/shared/DocumentFooter";
import DocumentPage from "@/components/shared/DocumentPage";
import { calculatePendingAmount } from "@/lib/calculations";
import { formatBookingNumber } from "@/lib/booking-number";

interface ReservationVoucherProps {
    voucher: VoucherData;
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

export default function ReservationVoucher({
    voucher,
    firm,
}: ReservationVoucherProps) {
    const { booking } = voucher;

    const bookingValue = booking.services.reduce(
        (total, service) => total + service.amount,
        0
    );

    const balanceDue = calculatePendingAmount(
        bookingValue,
        booking.amountReceived
    );

    return (
        <DocumentPage>
            <div className="print-document">

                {/* Header */}
                <DocumentHeader
                    firm={firm}
                    title="Booking Voucher"
                    documentNumber={formatBookingNumber(booking, firm)}
                    date={voucher.date}
                />

                {/* Client Information */}
                <section className="mt-5 rounded border border-gray-300 px-4 py-3">
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">

                        <div>
                            <span className="font-semibold">
                                Client Name:
                            </span>{" "}
                            {booking.customer.name}
                        </div>

                        <div>
                            <span className="font-semibold">
                                Contact:
                            </span>{" "}
                            {booking.customer.phone}
                        </div>

                        <div>
                            <span className="font-semibold">
                                Travel Dates:
                            </span>{" "}
                            {formatDate(
                                booking.travelStartDate
                            )}
                            {" – "}
                            {formatDate(
                                booking.travelEndDate
                            )}
                        </div>

                    </div>
                </section>


                {/* Hotel & Taxi */}
                <section className="mt-6">

                    <h3 className="mb-3 border-b-2 border-gray-900 pb-2 text-sm font-bold uppercase tracking-wide">
                        Hotel & Taxi
                    </h3>


                    {/* Taxi */}
                    {booking.taxi && (
                        <div className="service-group mb-8 rounded border border-gray-300 px-4 py-3">

                            <div className="grid grid-cols-4 gap-3 text-sm">

                                <div className="font-bold uppercase">
                                    Taxi (
                                    {booking.taxi.vehicle ||
                                        "N/A"}
                                    )
                                </div>

                                <div>
                                    <span className="font-semibold">
                                        PickUp:
                                    </span>{" "}
                                    {formatDate(
                                        booking.travelStartDate
                                    )}
                                </div>

                                <div>
                                    <span className="font-semibold">
                                        Drop:
                                    </span>{" "}
                                    {formatDate(
                                        booking.travelEndDate
                                    )}
                                </div>

                                <div>
                                    <span className="font-semibold">
                                        Contact:
                                    </span>{" "}
                                    {booking.taxi.contact ||
                                        "N/A"}
                                </div>

                            </div>
                        </div>
                    )}


                    {/* Hotels */}
                    {booking.hotels.length > 0 && (
                        <div className="service-group mt-3">

                            <div className="grid grid-cols-[minmax(0,1fr)_90px_90px_125px] gap-2 border-b border-gray-300 pb-2 text-xs font-bold uppercase">

                                <div>Hotel</div>
                                <div>Check-in</div>
                                <div>Check-out</div>
                                <div>Contact</div>

                            </div>

                            {booking.hotels.map(
                                (hotel, index) => (
                                    <div
                                        key={`${hotel.name}-${index}`}
                                        className="grid grid-cols-[minmax(0,1fr)_90px_90px_125px] gap-2 border-b border-gray-200 py-2 text-sm"
                                    >

                                        <div className="font-medium">
                                            {hotel.name}
                                        </div>

                                        <div>
                                            {formatDate(
                                                hotel.checkIn
                                            )}
                                        </div>

                                        <div>
                                            {formatDate(
                                                hotel.checkOut
                                            )}
                                        </div>

                                        <div>
                                            {hotel.contact ||
                                                "N/A"}
                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}


                    {/* Other Services */}
                    {booking.otherServices.length > 0 && (
                        <div className="service-group mt-4">

                            <div className="grid grid-cols-3 gap-3 border-b border-gray-300 pb-2 text-xs font-bold uppercase">
                                <div>Service</div>
                                <div>Details</div>
                                <div>Contact</div>
                            </div>

                            {booking.otherServices.map(
                                (service, index) => (
                                    <div
                                        key={`${service.name}-${index}`}
                                        className="grid grid-cols-3 gap-3 border-b border-gray-200 py-2 text-sm"
                                    >

                                        <div className="font-medium">
                                            {service.name}
                                        </div>

                                        <div>
                                            {service.details ||
                                                "N/A"}
                                        </div>

                                        <div>
                                            {service.contact ||
                                                "N/A"}
                                        </div>

                                    </div>
                                )
                            )}

                        </div>
                    )}

                </section>


                {/* Financial Summary */}
                <section className="mt-8 ml-auto w-full max-w-sm">

                    <div className="space-y-2 text-sm">

                        <div className="flex justify-between">
                            <span>Total Cost</span>

                            <span>
                                {formatCurrency(
                                    bookingValue
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Advance Received</span>

                            <span>
                                {formatCurrency(
                                    booking.amountReceived
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between border-t border-gray-300 pt-2 font-bold">
                            <span>Yet to Pay</span>

                            <span>
                                {formatCurrency(
                                    balanceDue
                                )}
                            </span>
                        </div>

                    </div>

                </section>


                <DocumentFooter firm={firm} />

            </div>
        </DocumentPage>
    );
}