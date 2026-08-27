import {
  PaymentSchedule as PaymentScheduleData,
  Firm,
} from "@/lib/types";

import { calculatePendingAmount } from "@/lib/calculations";
import { PAYMENT_TERMS } from "@/lib/payment-terms";
import { formatBookingNumber } from "@/lib/booking-number";

import {
  createPdfWithHeader,
  drawTwoColumnInfoBox,
  drawHighlightBox,
  drawSectionHeading,
  drawTotalsBox,
  drawIssuedBy,
  drawNoteBox,
  ensureSpace,
  finalizePdf,
  formatCurrency,
  formatDate,
  PDF_PAGE,
  setBodyFont,
  setBoldFont,
  setMutedFont,
} from "@/lib/pdf/pdf-engine";

interface PaymentSchedulePdfOptions {
  fileName?: string;
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function safeString(value: unknown): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

/*
 * =========================================================
 * PAYMENT SECTION
 * =========================================================
 */

interface PaymentEntryLike {
  label: string;
  amount: number;
  dueDate?: string;
}

import jsPDF from "jspdf";

function drawPaymentSection(
  doc: jsPDF,
  title: string,
  entries: PaymentEntryLike[],
  total: number,
  startY: number
): number {
  let y = ensureSpace(doc, startY, 25);

    y = drawSectionHeading(
      doc,
      title,
      y
    );

    /*
     * -------------------------------------------------------
     * Section container
     * -------------------------------------------------------
     */

    const x = PDF_PAGE.margin.left;
    const width = PDF_PAGE.contentWidth;

    const labelX = x + 5;
    const amountX =
      x + width - 5;

    /*
     * Estimate row heights.
     *
     * Each payment can have:
     *   - label
     *   - optional due date
     */

    const rowHeights = entries.map(
      (entry) =>
        entry.dueDate
          ? 13
          : 9
    );

    const contentHeight =
      rowHeights.reduce(
        (sum, height) =>
          sum + height,
        0
      );

    const totalHeight = 8;

    const boxHeight =
      contentHeight +
      totalHeight +
      6;

    y = ensureSpace(
      doc,
      y,
      boxHeight + 5
    );

    doc.setFillColor(
      255,
      255,
      255
    );

    doc.setDrawColor(
      209,
      213,
      219
    );

    doc.setLineWidth(0.3);

    doc.roundedRect(
      x,
      y,
      width,
      boxHeight,
      2,
      2,
      "S"
    );

    let currentY = y + 7;

    entries.forEach(
      (entry, index) => {
        const rowHeight =
          rowHeights[index];

        setBodyFont(doc, 10);

        doc.text(
          safeString(entry.label),
          labelX,
          currentY
        );

        setBoldFont(doc, 10);

        doc.text(
          formatCurrency(
            Number(entry.amount || 0)
          ),
          amountX,
          currentY,
          {
            align: "right",
          }
        );

        if (entry.dueDate) {
          setMutedFont(doc, 8.5);

          doc.text(
            `Due: ${formatDate(
              entry.dueDate
            )}`,
            labelX,
            currentY + 5
          );
        }

        if (
          index <
          entries.length - 1
        ) {
          doc.setDrawColor(
            229,
            231,
            235
          );

          doc.setLineWidth(0.2);

          doc.line(
            x + 5,
            currentY +
            rowHeight -
            3,
            x + width - 5,
            currentY +
            rowHeight -
            3
          );
        }

        currentY += rowHeight;
      }
    );

    /*
     * -------------------------------------------------------
     * Total row
     * -------------------------------------------------------
     */

    const totalLineY =
      y +
      boxHeight -
      totalHeight -
      1;

    doc.setDrawColor(
      156,
      163,
      175
    );

    doc.setLineWidth(0.4);

    doc.line(
      x + 5,
      totalLineY,
      x + width - 5,
      totalLineY
    );

    setBoldFont(doc, 9.5);

    doc.text(
      `${title.replace(
        / Payments?$/i,
        ""
      )} Total`,
      labelX,
      totalLineY + 6
    );

    setBoldFont(doc, 10);

    doc.text(
      formatCurrency(total),
      amountX,
      totalLineY + 6,
      {
        align: "right",
      }
    );

    return y + boxHeight;
  }


  /*
   * =========================================================
   * MAIN PDF GENERATOR
   * =========================================================
   */

  export async function generatePaymentSchedulePdf(
    schedule: PaymentScheduleData,
    firm: Firm,
    options?: PaymentSchedulePdfOptions
  ): Promise<void> {
    const { booking } = schedule;

    /*
     * -------------------------------------------------------
     * Booking value
     * -------------------------------------------------------
     */

    const bookingValue =
      booking.services.reduce(
        (total, service) =>
          total +
          Number(service.amount || 0),
        0
      );

    /*
     * -------------------------------------------------------
     * Payment categories
     * -------------------------------------------------------
     */

    const hotelPayments =
      booking.paymentSchedule.filter(
        (entry) =>
          entry.category === "hotel"
      );

    const taxiPayments =
      booking.paymentSchedule.filter(
        (entry) =>
          entry.category === "taxi"
      );

    const otherPayments =
      booking.paymentSchedule.filter(
        (entry) =>
          entry.category === "other"
      );

    /*
     * -------------------------------------------------------
     * Category totals
     * -------------------------------------------------------
     */

    const hotelTotal =
      hotelPayments.reduce(
        (total, entry) =>
          total +
          Number(entry.amount || 0),
        0
      );

    const taxiTotal =
      taxiPayments.reduce(
        (total, entry) =>
          total +
          Number(entry.amount || 0),
        0
      );

    const otherTotal =
      otherPayments.reduce(
        (total, entry) =>
          total +
          Number(entry.amount || 0),
        0
      );

    /*
     * The payment schedule represents the remaining
     * operational payment commitments.
     */

    const totalPending =
      hotelTotal +
      taxiTotal +
      otherTotal;

    /*
     * -------------------------------------------------------
     * Create PDF
     * -------------------------------------------------------
     */

    const { doc, startY } =
      await createPdfWithHeader(
        "Remaining Payment Schedule",
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
        formatDate(schedule.date),
        formatBookingNumber(booking, firm),
        booking.bookingId
      );

    /*
     * -------------------------------------------------------
     * Guest Information
     * -------------------------------------------------------
     */

    let y = startY;

    y = drawTwoColumnInfoBox(
      doc,
      {
        left: [
          {
            label: "Guest",
            value:
              booking.customer?.name ||
              "—",
          },
          {
            label: "Contact",
            value:
              booking.customer?.phone ||
              "—",
          },
        ],

        right: [
          {
            label: "Travel Start",
            value: formatDate(
              booking.travelStartDate
            ),
          },
          {
            label: "Travel End",
            value: formatDate(
              booking.travelEndDate
            ),
          },
        ],
      },
      y
    );

    y += 8;

    /*
     * -------------------------------------------------------
     * Total Pending Payment
     * -------------------------------------------------------
     */

    y = drawHighlightBox(
      doc,
      "Total Pending Payment",
      formatCurrency(
        totalPending
      ),
      y,
      {
        width: 78,
        align: "right",
      }
    );

    y += 8;

    /*
     * -------------------------------------------------------
     * Payment Breakdown
     * -------------------------------------------------------
     */

    if (
      hotelPayments.length > 0
    ) {
      y = drawPaymentSection(
        doc,
        "Hotel Payments",
        hotelPayments,
        hotelTotal,
        y
      );

      y += 7;
    }

    if (
      taxiPayments.length > 0
    ) {
      y = drawPaymentSection(
        doc,
        "Taxi Payments",
        taxiPayments,
        taxiTotal,
        y
      );

      y += 7;
    }

    if (
      otherPayments.length > 0
    ) {
      y = drawPaymentSection(
        doc,
        "Other Payments",
        otherPayments,
        otherTotal,
        y
      );

      y += 7;
    }

    /*
     * -------------------------------------------------------
     * No payment schedule
     * -------------------------------------------------------
     */

    if (
      booking.paymentSchedule
        .length === 0
    ) {
      y = ensureSpace(
        doc,
        y,
        28
      );

      y = drawNoteBox(
        doc,
        "Payment Schedule",
        "No remaining payment entries have been added to this booking.",
        y
      );

      y += 8;
    }
    PAYMENT_TERMS.forEach(
      (term, index) => {
        const resolvedTerm =
          term.replace(
            "{firmName}",
            firm.name
          );

        const lines =
          doc.splitTextToSize(
            `${index + 1}. ${resolvedTerm}`,
            PDF_PAGE.contentWidth -
            5
          );

        const lineHeight = 4.3;

        const requiredHeight =
          lines.length *
          lineHeight +
          3;

        y = ensureSpace(
          doc,
          y,
          requiredHeight
        );

        setBodyFont(
          doc,
          10
        );

        doc.text(
          lines,
          PDF_PAGE.margin.left,
          y,
          {
            lineHeightFactor:
              1.25,
          }
        );

        y +=
          lines.length *
          lineHeight +
          3;
      }
    );

    /*
     * -------------------------------------------------------
     * Issued By
     * -------------------------------------------------------
     */

    y += 8;

    y = ensureSpace(
      doc,
      y,
      20
    );

    drawIssuedBy(
      doc,
      firm.issuedBy,
      y
    );

    /*
     * -------------------------------------------------------
     * Finalize
     * -------------------------------------------------------
     */

    const bookingNumber =
      formatBookingNumber(
        booking,
        firm
      );

    const defaultFileName =
      `${bookingNumber} - Payment Schedule`;

    finalizePdf(
      doc,
      {
        fileName:
          options?.fileName ||
          defaultFileName,
        title:
          "Remaining Payment Schedule",
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
   * ALIAS
   * =========================================================
   *
   * Kept as a convenient alternative name if the UI uses
   * "exportPaymentSchedulePdf".
   * =========================================================
   */

  export const exportPaymentSchedulePdf =
    generatePaymentSchedulePdf;