import {
  ReservationVoucher as VoucherData,
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
  drawNoteBox,
  formatCurrency,
  formatDate,
  ensureSpace,
  PDF_PAGE,
  PdfFirm,
  PdfTableRow,
  rightAlignTableColumn,
  centerAlignTableColumn,
  mergeTableOptions,
} from "@/lib/pdf/pdf-engine";

import { calculatePendingAmount } from "@/lib/calculations";
import { formatBookingNumber } from "@/lib/booking-number";


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getPdfFirm(firm: Firm): PdfFirm {
  return {
    name: firm.name,
    code: firm.code,
    logo: firm.logo,
    email: firm.email,
    phone: firm.phone,
    website: firm.website,
    issuedBy: firm.issuedBy,
    thankYouMessage: firm.thankYouMessage,
  };
}


/*
 * =========================================================
 * SERVICE LABELS
 * =========================================================
 */

function getOtherServiceValue(
  value: unknown
): string {
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
 * MAIN EXPORT
 * =========================================================
 *
 * Generates and downloads a Booking Voucher PDF.
 *
 * The renderer intentionally uses the shared PDF engine
 * for typography, spacing, tables, colours and footer.
 *
 * =========================================================
 */

export async function exportVoucherPdf(
  voucher: VoucherData,
  firm: Firm
): Promise<void> {
  const { booking } = voucher;

  const pdfFirm = getPdfFirm(firm);

  /*
   * -------------------------------------------------------
   * CREATE DOCUMENT
   * -------------------------------------------------------
   */

  const { doc, startY } =
    await createPdfWithHeader(
      "Booking Voucher",
      pdfFirm,
      formatDate(voucher.date),
      formatBookingNumber(booking, firm),
    );


  /*
   * -------------------------------------------------------
   * DOCUMENT METADATA
   * -------------------------------------------------------
   */

  doc.setProperties({
    title: "Booking Voucher",
    subject: `Booking Voucher - ${formatBookingNumber(
      booking,
      firm
    )}`,
    author:
      firm.name || "Uranote",
    creator:
      "Uranote Docs Generator",
  });


  /*
   * -------------------------------------------------------
   * CLIENT INFORMATION
   * -------------------------------------------------------
   */

  let currentY = startY;

  currentY = ensureSpace(
    doc,
    currentY,
    45
  );

  currentY = drawSectionHeading(
    doc,
    "Client Information",
    currentY
  );

  const clientName =
    booking.customer?.name || "—";

  const clientPhone =
    booking.customer?.phone || "—";

  const clientEmail =
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

  currentY = drawTwoColumnInfoBox(
    doc,
    {
      left: [
        {
          label: "Customer Name",
          value: clientName,
        },
        {
          label: "Contact Number",
          value: clientPhone,
        },
        {
          label: "Email Id",
          value: clientEmail,
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


  /*
   * -------------------------------------------------------
   * SERVICES
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = drawSectionHeading(
    doc,
    "Hotel & Taxi",
    currentY
  );


  /*
   * -------------------------------------------------------
   * TAXI
   * -------------------------------------------------------
   */

  if (booking.taxi) {
    currentY = ensureSpace(
      doc,
      currentY,
      38
    );

    const taxiRows: PdfTableRow[] = [
      {
        vehicle:
          booking.taxi.vehicle ||
          "N/A",

        pickup:
          formatDate(
            booking.travelStartDate
          ),

        drop:
          formatDate(
            booking.travelEndDate
          ),

        contact:
          booking.taxi.contact ||
          "N/A",
      },
    ];

    currentY = drawTable(
      doc,
      [
        {
          header: "Taxi / Vehicle",
          dataKey: "vehicle",
        },
        {
          header: "Pick-up",
          dataKey: "pickup",
        },
        {
          header: "Drop",
          dataKey: "drop",
        },
        {
          header: "Contact",
          dataKey: "contact",
        },
      ],
      taxiRows,
      {
        startY: currentY,

        styles: {
          fontSize: 9.5,
        },

        headStyles: {
          fontSize: 9,
        },

        columnStyles: {
          vehicle: {
            cellWidth: 52,
          },

          pickup: {
            cellWidth: 36,
          },

          drop: {
            cellWidth: 36,
          },

          contact: {
            cellWidth: 50,
          },
        },
      }
    );

    currentY += 6;
  }


  /*
   * -------------------------------------------------------
   * HOTELS
   * -------------------------------------------------------
   */

  if (
    booking.hotels &&
    booking.hotels.length > 0
  ) {
    currentY = ensureSpace(
      doc,
      currentY,
      35
    );

    const hotelRows: PdfTableRow[] =
      booking.hotels.map(
        (hotel) => ({
          hotel:
            hotel.name ||
            "N/A",

          checkIn:
            formatDate(
              hotel.checkIn
            ),

          checkOut:
            formatDate(
              hotel.checkOut
            ),

          contact:
            hotel.contact ||
            "N/A",
        })
      );

    currentY = drawTable(
      doc,
      [
        {
          header: "Hotel",
          dataKey: "hotel",
        },
        {
          header: "Check-in",
          dataKey: "checkIn",
        },
        {
          header: "Check-out",
          dataKey: "checkOut",
        },
        {
          header: "Contact",
          dataKey: "contact",
        },
      ],
      hotelRows,
      {
        startY: currentY,

        styles: {
          fontSize: 9.5,
        },

        headStyles: {
          fontSize: 9,
        },

        columnStyles: {
          hotel: {
            cellWidth: 62,
          },

          checkIn: {
            cellWidth: 31,
            halign: "center",
          },

          checkOut: {
            cellWidth: 31,
            halign: "center",
          },

          contact: {
            cellWidth: 44,
          },
        },
      }
    );

    currentY += 6;
  }


  /*
   * -------------------------------------------------------
   * OTHER SERVICES
   * -------------------------------------------------------
   */

  if (
    booking.otherServices &&
    booking.otherServices.length > 0
  ) {
    currentY = ensureSpace(
      doc,
      currentY,
      35
    );

    currentY = drawSectionHeading(
      doc,
      "Other Services",
      currentY
    );

    const otherServiceRows: PdfTableRow[] =
      booking.otherServices.map(
        (service) => ({
          service:
            service.name ||
            "N/A",

          details:
            service.details ||
            "N/A",

          contact:
            service.contact ||
            "N/A",
        })
      );

    currentY = drawTable(
      doc,
      [
        {
          header: "Service",
          dataKey: "service",
        },
        {
          header: "Details",
          dataKey: "details",
        },
        {
          header: "Contact",
          dataKey: "contact",
        },
      ],
      otherServiceRows,
      {
        startY: currentY,

        styles: {
          fontSize: 9.5,
        },

        headStyles: {
          fontSize: 9,
        },

        columnStyles: {
          service: {
            cellWidth: 48,
          },

          details: {
            cellWidth: 82,
          },

          contact: {
            cellWidth: 38,
          },
        },
      }
    );

    currentY += 7;
  }


  /*
   * -------------------------------------------------------
   * FINANCIAL SUMMARY
   * -------------------------------------------------------
   */

  const bookingValue =
    booking.services.reduce(
      (total, service) =>
        total +
        Number(service.amount || 0),
      0
    );

  const amountReceived =
    Number(
      booking.amountReceived || 0
    );

  const balanceDue =
    calculatePendingAmount(
      bookingValue,
      amountReceived
    );


  currentY = ensureSpace(
    doc,
    currentY,
    55
  );

  currentY += 3;

  currentY = drawSectionHeading(
    doc,
    "Financial Summary",
    currentY
  );


  currentY = drawPaymentSummary(
    doc,
    bookingValue,
    amountReceived,
    balanceDue,
    currentY
  );


  /*
   * -------------------------------------------------------
   * ISSUED BY
   * -------------------------------------------------------
   */

  currentY += 14;

  currentY = ensureSpace(
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

  const bookingNumber =
    formatBookingNumber(
      booking,
      firm
    );

  const customerName =
    booking.customer?.name ||
    "Customer";

  const fileName =
    `Booking Voucher - ${bookingNumber} - ${customerName}`;

  finalizePdf(
    doc,
    {
      fileName,
      title: "Booking Voucher",
      firm: pdfFirm,
      showFooter: true,
    }
  );
}


/*
 * =========================================================
 * DEFAULT EXPORT
 * =========================================================
 */

export default exportVoucherPdf;