import {
    Receipt as ReceiptData,
    Firm,
} from "@/lib/types";

import {
    createPdfWithHeader,
    finalizePdf,
    drawTwoColumnInfoBox,
    drawSectionHeading,
    drawTable,
    drawPaymentSummary,
    drawIssuedBy,
    ensureSpace,
    formatCurrency,
    formatDate,
    tableText,
    PDF_PAGE,
} from "@/lib/pdf/pdf-engine";

import {
    calculatePendingAmount,
    calculateSubtotal,
} from "@/lib/calculations";

import {
    formatBookingNumber,
} from "@/lib/booking-number";

/*
 * =========================================================
 * URANOTE RECEIPT PDF
 * =========================================================
 *
 * Generates a formal A4 receipt PDF.
 *
 * The PDF engine handles:
 * - fonts
 * - colours
 * - header
 * - footer
 * - tables
 * - totals
 * - spacing
 * - file export
 *
 * This file handles only receipt-specific content.
 *
 * =========================================================
 */


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface ReceiptPdfOptions {
    receipt: ReceiptData;
    firm: Firm;
    fileName?: string;
}


/*
 * =========================================================
 * SERVICE NAME
 * =========================================================
 */

function serviceName(
    type: string
): string {
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


/*
 * =========================================================
 * MAIN PDF GENERATOR
 * =========================================================
 */

export async function generateReceiptPdf({
    receipt,
    firm,
    fileName,
}: ReceiptPdfOptions): Promise<void> {
    const { booking } = receipt;

    /*
     * -------------------------------------------------------
     * BOOKING CALCULATIONS
     * -------------------------------------------------------
     */

    const bookingValue =
        calculateSubtotal(
            booking.services
        );

    const balanceDue =
        calculatePendingAmount(
            bookingValue,
            booking.amountReceived
        );

    /*
     * -------------------------------------------------------
     * CREATE DOCUMENT
     * -------------------------------------------------------
     */

    const {
        doc,
        startY: headerY,
    } = await createPdfWithHeader(
        "Receipt",
        {
            name: firm.name,
            code: firm.code,
            logo: firm.logo,
            email: firm.email,
            phone: firm.phone,
            website: firm.website,
            issuedBy: firm.issuedBy,
            thankYouMessage:
                firm.thankYouMessage,
        },
        formatDate(receipt.date),
        formatBookingNumber(booking, firm)
    );

    /*
     * -------------------------------------------------------
     * GUEST / CUSTOMER
     * -------------------------------------------------------
     */

    let currentY = headerY;

    currentY = ensureSpace(
        doc,
        currentY,
        45
    );

    currentY = drawSectionHeading(
        doc,
        "Guest / Customer",
        currentY
    );

    const customerName =
        booking.customer?.name || "—";

    const customerPhone =
        booking.customer?.phone || "—";

    const customerEmail =
        booking.customer?.email || "—";

    const travelDates =
        booking.travelStartDate &&
            booking.travelEndDate
            ? `${formatDate(
                booking.travelStartDate
            )} – ${formatDate(
                booking.travelEndDate
            )}`
            : "—";

    drawTwoColumnInfoBox(
        doc,
        {
            left: [
                {
                    label: "Guest Name",
                    value: customerName,
                },
                {
                    label: "Contact Number",
                    value: customerPhone,
                },
                {
                    label: "Email Id",
                    value: customerEmail,
                },
            ],

            right: [
                {
                    label: "Travel Dates",
                    value: travelDates,
                },
            ],
        },

        currentY,
        {
            height: 30,
        }
    );

    currentY += 39;


    /*
     * -------------------------------------------------------
     * SERVICES
     * -------------------------------------------------------
     */

    currentY =
        ensureSpace(
            doc,
            currentY,
            45
        );

    currentY =
        drawSectionHeading(
            doc,
            "Services",
            currentY,
            {
                subtitle:
                    "Services included in this booking",
            }
        );


    /*
     * -------------------------------------------------------
     * SERVICE TABLE
     * -------------------------------------------------------
     */

    const serviceRows =
        booking.services.map(
            (service) => ({
                service:
                    serviceName(
                        service.type
                    ),

                description:
                    service.description ||
                    "—",

                quantity:
                    Number(
                        service.quantity || 0
                    ),

                amount:
                    formatCurrency(
                        Number(
                            service.amount || 0
                        )
                    ),
            })
        );


    currentY =
        drawTable(
            doc,

            [
                {
                    header: "Service",
                    dataKey: "service",
                },

                {
                    header: "Description",
                    dataKey: "description",
                },

                {
                    header: "Qty",
                    dataKey: "quantity",
                },

                {
                    header: "Amount",
                    dataKey: "amount",
                },
            ],

            serviceRows,

            {
                startY: currentY,

                columnStyles: {
                    service: {
                        cellWidth: 34,
                        fontStyle: "bold",
                    },

                    description: {
                        cellWidth: "auto",
                    },

                    quantity: {
                        cellWidth: 18,
                        halign: "center",
                    },

                    amount: {
                        cellWidth: 35,
                        halign: "right",
                    },
                },

                didParseCell: (data) => {
                    /*
                     * Keep numeric / monetary cells visually
                     * aligned and consistent.
                     */
                    if (
                        data.section === "body" &&
                        data.column.dataKey === "quantity"
                    ) {
                        data.cell.text = [
                            String(data.cell.raw ?? "—"),
                        ];
                    }
                },
            }
        );


    /*
     * -------------------------------------------------------
     * PAYMENT SUMMARY
     * -------------------------------------------------------
     */

    currentY += 10;

    currentY =
        ensureSpace(
            doc,
            currentY,
            45
        );

    currentY =
        drawSectionHeading(
            doc,
            "Payment Summary",
            currentY
        );

    currentY =
        drawPaymentSummary(
            doc,
            bookingValue,
            Number(
                booking.amountReceived || 0
            ),
            balanceDue,
            currentY
        );


    /*
     * -------------------------------------------------------
     * PAYMENT DETAILS
     * -------------------------------------------------------
     */

    if (
        receipt.paymentMethod ||
        receipt.transactionReference
    ) {
        currentY += 10;

        currentY =
            ensureSpace(
                doc,
                currentY,
                35
            );

        currentY =
            drawSectionHeading(
                doc,
                "Payment Details",
                currentY
            );

        const paymentRows = [];

        if (
            receipt.paymentMethod
        ) {
            paymentRows.push({
                label: "Payment Mode",
                value:
                    receipt.paymentMethod,
            });
        }

        if (
            receipt.transactionReference
        ) {
            paymentRows.push({
                label:
                    "Transaction Reference",
                value:
                    receipt.transactionReference,
            });
        }

        if (paymentRows.length) {
            drawTwoColumnInfoBox(
                doc,
                {
                    left:
                        paymentRows.slice(
                            0,
                            Math.ceil(
                                paymentRows.length / 2
                            )
                        ),

                    right:
                        paymentRows.slice(
                            Math.ceil(
                                paymentRows.length / 2
                            )
                        ),
                },

                currentY,
                {
                    height: 24,
                }
            );

            currentY += 33;
        }
    }


    /*
     * -------------------------------------------------------
     * RECEIPT STATUS
     * -------------------------------------------------------
     *
     * This is intentionally based on the calculated balance.
     * No additional status field is required in the data model.
     * -------------------------------------------------------
     */

    // currentY += 8;

    currentY =
        ensureSpace(
            doc,
            currentY,
            28
        );


    /*
     * -------------------------------------------------------
     * ISSUED BY
     * -------------------------------------------------------
     */

    currentY += 12;

    currentY =
        ensureSpace(
            doc,
            currentY,
            25
        );

    drawIssuedBy(
        doc,
        firm.issuedBy,
        currentY
    );


    /*
     * -------------------------------------------------------
     * FINALIZE
     * -------------------------------------------------------
     */

    finalizePdf(
        doc,
        {
            fileName:
                fileName ||
                createReceiptFileName(
                    booking,
                    firm
                ),

            title:
                `Receipt - ${formatBookingNumber(
                    booking,
                    firm
                )
                }`,

            firm: {
                name: firm.name,
                code: firm.code,
                logo: firm.logo,
                email: firm.email,
                phone: firm.phone,
                website: firm.website,
                issuedBy: firm.issuedBy,
                thankYouMessage:
                    firm.thankYouMessage,
            },

            showFooter: true,
        }
    );
}


/*
 * =========================================================
 * FILE NAME
 * =========================================================
 */

export function createReceiptFileName(
    booking: ReceiptData["booking"],
    firm: Firm
): string {
    const bookingNumber =
        formatBookingNumber(
            booking,
            firm
        );

    const year =
        new Date()
            .getFullYear()
            .toString()
            .slice(-2);

    const customerName =
        booking.customer?.name ||
        "Customer";

    const safeCustomerName =
        customerName
            .trim()
            .replace(
                /[<>:"/\\|?*\x00-\x1F]/g,
                "-"
            )
            .replace(
                /\s+/g,
                "-"
            );

    const safeBookingNumber =
        `${year}${bookingNumber}`
            .replace(
                /[<>:"/\\|?*\x00-\x1F]/g,
                "-"
            )
            .replace(
                /\s+/g,
                "-"
            );

    return `Receipt-${safeBookingNumber}-${safeCustomerName}.pdf`;
}