import jsPDF from "jspdf";

import {
  Firm,
  VendorBookingRequest,
} from "@/lib/types";

import {
  createPdfWithHeader,
  drawInfoBox,
  drawNoteBox,
  drawSectionHeading,
  drawTable,
  drawTotalsBox,
  ensureSpace,
  finalizePdf,
  formatCurrency,
  formatDate,
  formatNumber,
  getContentBottomY,
  getContentStartY,
  PDF_COLORS,
  PDF_PAGE,
  PdfFirm,
  PdfTableRow,
  setBodyFont,
} from "@/lib/pdf/pdf-engine";

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

function safeText(value: string): string {
  const trimmed = String(value || "").trim();

  return trimmed || "—";
}

function safeCount(value: number): string {
  const number = Number(value || 0);

  return number > 0 ? formatNumber(number) : "—";
}

/*
 * =========================================================
 * WRAPPED REQUIREMENTS BOX
 * =========================================================
 *
 * Special requirements can be several lines long. The shared
 * note box is a single block, so this helper keeps the same
 * visual language while allowing the content to continue onto
 * a new page when required.
 */

function drawRequirementsBox(
  doc: jsPDF,
  text: string,
  startY: number
): number {
  const x = PDF_PAGE.margin.left;
  const width = PDF_PAGE.contentWidth;
  const padding = 5;
  const lineHeight = 4.2;

  setBodyFont(doc, 9);

  const lines = doc.splitTextToSize(
    safeText(text),
    width - padding * 2
  );

  let index = 0;
  let currentY = startY;

  while (index < lines.length) {
    const availableBodyHeight =
      getContentBottomY() -
      (currentY + padding * 2);

    const fit = Math.floor(
      availableBodyHeight / lineHeight
    );

    if (fit < 1) {
      doc.addPage();
      currentY = getContentStartY();
      continue;
    }

    const chunk = lines.slice(
      index,
      index + Math.min(fit, lines.length - index)
    );

    const boxHeight =
      chunk.length * lineHeight + padding * 2;

    doc.setFillColor(...PDF_COLORS.lightBackground);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);

    doc.roundedRect(
      x,
      currentY,
      width,
      boxHeight,
      2,
      2,
      "FD"
    );

    setBodyFont(doc, 9);

    doc.text(
      chunk,
      x + padding,
      currentY + padding + 1,
      {
        lineHeightFactor: 1.32,
      }
    );

    index += chunk.length;
    currentY += boxHeight;

    if (index < lines.length) {
      doc.addPage();
      currentY = getContentStartY();
    }
  }

  return currentY;
}

/*
 * =========================================================
 * MAIN PDF GENERATOR
 * =========================================================
 *
 * Generates a temporary Hotel Booking Request PDF for a
 * vendor. Nothing here is stored as a booking record.
 */

export async function exportVendorBookingRequestPdf(
  request: VendorBookingRequest,
  firm: Firm
): Promise<void> {
  const pdfFirm = getPdfFirm(firm);

  const generatedOn = new Date().toLocaleDateString("en-CA");

  const propertyName = request.propertyName.trim();
  const destination = request.destination.trim();
  const guestName = request.guestName.trim() || "Guest";

  const hotelLabel = propertyName
    ? /^hotel\b/i.test(propertyName)
      ? propertyName
      : `Hotel ${propertyName}`
    : "Hotel";

  const bookingLabel = [
    hotelLabel,
    destination,
    "Booking Request",
  ]
    .filter(Boolean)
    .join(" ");

  const {
    doc,
    startY,
  } = await createPdfWithHeader(
    "Hotel Booking Request",
    pdfFirm,
    formatDate(generatedOn)
  );

  doc.setProperties({
    title: "Hotel Booking Request",
    subject: bookingLabel,
    author: firm.name || "Uranote",
    creator: "Uranote Docs Generator",
  });

  let currentY = startY;

  /*
   * -------------------------------------------------------
   * GUEST DETAILS
   * -------------------------------------------------------
   */

  currentY = ensureSpace(doc, currentY, 42);

  currentY = drawSectionHeading(
    doc,
    "Guest Details",
    currentY
  );

  currentY = drawInfoBox(
    doc,
    [
      {
        label: "Guest Name",
        value: safeText(request.guestName),
      },
      {
        label: "Contact Number",
        value: safeText(request.contactNumber),
      },
      {
        label: "Number of Guests",
        value: safeCount(request.numberOfGuests),
      },
    ],
    PDF_PAGE.margin.left,
    currentY,
    PDF_PAGE.contentWidth,
    40
  );

  /*
   * -------------------------------------------------------
   * PROPERTY DETAILS
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 34);

  currentY = drawSectionHeading(
    doc,
    "Property Details",
    currentY
  );

  currentY = drawInfoBox(
    doc,
    [
      {
        label: "Property Name",
        value: safeText(request.propertyName),
      },
      {
        label: "Destination",
        value: safeText(request.destination),
      },
    ],
    PDF_PAGE.margin.left,
    currentY,
    PDF_PAGE.contentWidth,
    40
  );

  /*
   * -------------------------------------------------------
   * STAY DETAILS
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 66);

  currentY = drawSectionHeading(
    doc,
    "Stay Details",
    currentY
  );

  const stayRows: PdfTableRow[] =
    request.stays.map((stay) => ({
      checkIn: formatDate(stay.checkIn),
      checkOut: formatDate(stay.checkOut),
      nights: safeCount(stay.numberOfNights),
    }));

  currentY = drawTable(
    doc,
    [
      {
        header: "Check-in",
        dataKey: "checkIn",
      },
      {
        header: "Check-out",
        dataKey: "checkOut",
      },
      {
        header: "Nights",
        dataKey: "nights",
      },
    ],
    stayRows,
    {
      startY: currentY,

      styles: {
        fontSize: 9.5,
      },

      headStyles: {
        fontSize: 9,
      },

      columnStyles: {
        checkIn: {
          cellWidth: 62,
          halign: "center",
        },

        checkOut: {
          cellWidth: 62,
          halign: "center",
        },

        nights: {
          cellWidth: 50,
          halign: "center",
        },
      },
    }
  );

  currentY += 6;

  currentY = ensureSpace(doc, currentY, 30);

  currentY = drawInfoBox(
    doc,
    [
      {
        label: "Number of Rooms",
        value: safeCount(request.numberOfRooms),
      },
      {
        label: "Room Type",
        value: safeText(request.roomType),
      },
    ],
    PDF_PAGE.margin.left,
    currentY,
    PDF_PAGE.contentWidth,
    40
  );

  /*
   * -------------------------------------------------------
   * MEAL DETAILS
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 30);

  currentY = drawSectionHeading(
    doc,
    "Meal Details",
    currentY
  );

  currentY = drawInfoBox(
    doc,
    [
      {
        label: "Meal Plan",
        value: safeText(request.mealPlan),
      },
    ],
    PDF_PAGE.margin.left,
    currentY,
    PDF_PAGE.contentWidth,
    40
  );

  /*
   * -------------------------------------------------------
   * SPECIAL REQUIREMENTS
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 40);

  currentY = drawSectionHeading(
    doc,
    "Special Requirements",
    currentY
  );

  currentY = drawRequirementsBox(
    doc,
    request.specialRequirements.trim() || "None",
    currentY
  );

  /*
   * -------------------------------------------------------
   * FINANCIAL DETAILS
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 48);

  currentY = drawSectionHeading(
    doc,
    "Financial Details",
    currentY
  );

  const totalCost = Number(request.totalCost || 0);
  const advancePayment = Number(
    request.advancePayment || 0
  );
  const balancePayable = Math.max(
    totalCost - advancePayment,
    0
  );

  currentY = drawTotalsBox(
    doc,
    [
      {
        label: "Total Cost",
        value: formatCurrency(totalCost),
      },
      {
        label: "Advance Payment",
        value: formatCurrency(advancePayment),
      },
      {
        label: "Balance Payable",
        value: formatCurrency(balancePayable),
        bold: true,
      },
    ],
    currentY,
    {
      width: 82,
    }
  );

  /*
   * -------------------------------------------------------
   * CONFIRMATION REQUEST
   * -------------------------------------------------------
   */

  currentY += 10;

  currentY = ensureSpace(doc, currentY, 42);

  currentY = drawSectionHeading(
    doc,
    "Confirmation Request",
    currentY
  );

  currentY = drawNoteBox(
    doc,
    "Request to the Property",
    `Kindly confirm the availability of the requested rooms at ${
      safeText(request.propertyName) === "—"
        ? "your property"
        : request.propertyName
    } and share your banking details so that we can process the advance payment at the earliest. We look forward to your confirmation.`,
    currentY
  );

  /*
   * -------------------------------------------------------
   * CONTACT PERSON
   * -------------------------------------------------------
   */

  currentY += 9;

  currentY = ensureSpace(doc, currentY, 42);

  currentY = drawSectionHeading(
    doc,
    "Contact Person",
    currentY
  );

  drawInfoBox(
    doc,
    [
      {
        label: "Name",
        value: safeText(firm.issuedBy || firm.name),
      },
      {
        label: "Phone",
        value: safeText(firm.phone),
      },
      {
        label: "Firm",
        value: safeText(firm.name),
      },
    ],
    PDF_PAGE.margin.left,
    currentY,
    PDF_PAGE.contentWidth,
    40
  );

  /*
   * -------------------------------------------------------
   * FINALIZE
   * -------------------------------------------------------
   */

  finalizePdf(doc, {
    fileName: `${bookingLabel} - ${guestName}`,
    title: "Hotel Booking Request",
    firm: pdfFirm,
    showFooter: true,
  });
}

export default exportVendorBookingRequestPdf;
