import jsPDF from "jspdf";
import autoTable, {
    CellInput,
    UserOptions,
} from "jspdf-autotable";

/*
 * =========================================================
 * URANOTE PDF DOCS ENGINE
 * =========================================================
 *
 * Shared PDF presentation engine for:
 *
 * 1. Receipt
 * 2. Reservation Voucher
 * 3. Payment Schedule
 *
 * Fonts:
 *   - Body: Source Sans 3 Regular
 *   - Bold: Source Sans 3 SemiBold
 *   - Heading: Source Sans 3 SemiBold
 *   - Fallback: Noto Sans
 *
 * Font files:
 *
 *   public/fonts/SourceSans3-Regular.ttf
 *   public/fonts/SourceSans3-SemiBold.ttf
 *   public/fonts/NotoSans-Regular.ttf
 *   public/fonts/NotoSans-Bold.ttf
 *
 * IMPORTANT:
 *
 * Font loading is asynchronous because browser-side
 * JavaScript must fetch the TTF files from /public/fonts/.
 *
 * Therefore:
 *
 *   createPdfDocument()
 *
 * and
 *
 *   createPdfWithHeader()
 *
 * are asynchronous.
 *
 * Usage:
 *
 *   const doc = await createPdfDocument();
 *
 * or:
 *
 *   const { doc, startY } =
 *       await createPdfWithHeader(
 *           "Receipt",
 *           firm
 *       );
 *
 * =========================================================
 */


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface PdfFirm {
    name: string;
    code?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
    issuedBy?: string;
    thankYouMessage?: string;
}

export interface PdfOptions {
    fileName: string;
    title: string;
    firm?: PdfFirm;
    showHeader?: boolean;
    showFooter?: boolean;
}

export interface PdfTableColumn {
    header: string;
    dataKey: string;
}

export interface PdfTableRow {
    [key: string]: CellInput;
}


/*
 * =========================================================
 * PAGE CONSTANTS
 * =========================================================
 */

export const PDF_PAGE = {
    width: 210,
    height: 297,

    margin: {
        left: 18,
        right: 18,
        top: 20,
        bottom: 20,
    },

    contentWidth: 174,
};


/*
 * =========================================================
 * COLOUR PALETTE
 * =========================================================
 */

export const PDF_COLORS = {
    primary: [31, 41, 55] as [number, number, number],

    secondary: [107, 114, 128] as [
        number,
        number,
        number
    ],

    muted: [156, 163, 175] as [
        number,
        number,
        number
    ],

    border: [209, 213, 219] as [
        number,
        number,
        number
    ],

    lightBackground: [249, 250, 251] as [
        number,
        number,
        number
    ],

    accent: [30, 58, 95] as [
        number,
        number,
        number
    ],

    accentLight: [239, 244, 250] as [
        number,
        number,
        number
    ],

    white: [255, 255, 255] as [
        number,
        number,
        number
    ],
};


/*
 * =========================================================
 * FONT CONFIGURATION
 * =========================================================
 */

export const PDF_FONTS = {
    body: "SourceSans3",
    heading: "SourceSans3",
    bold: "SourceSans3",
    italic: "SourceSans3",

    fallback: "NotoSans",
};


/*
 * =========================================================
 * FONT FILE PATHS
 * =========================================================
 */

const PDF_FONT_FILES = {
    sourceSansRegular:
        "/fonts/SourceSans3-Regular.ttf",

    sourceSansSemiBold:
        "/fonts/SourceSans3-SemiBold.ttf",

    notoSansRegular:
        "/fonts/NotoSans-Regular.ttf",

    notoSansBold:
        "/fonts/NotoSans-Bold.ttf",
};


/*
 * =========================================================
 * FONT CACHE
 * =========================================================
 *
 * Fetching the same TTF files for every generated PDF is
 * unnecessary.
 *
 * The browser keeps the Base64 font data in memory after
 * the first successful load.
 *
 * =========================================================
 */

let fontCache: {
    sourceSansRegular?: string;
    sourceSansSemiBold?: string;
    notoSansRegular?: string;
    notoSansBold?: string;
} = {};


/*
 * =========================================================
 * FETCH FONT AS BASE64
 * =========================================================
 */

async function fetchFontAsBase64(
    path: string
): Promise<string> {
    const response =
        await fetch(path);

    if (!response.ok) {
        throw new Error(
            `Failed to load PDF font: ${path}`
        );
    }

    const buffer =
        await response.arrayBuffer();

    const bytes =
        new Uint8Array(buffer);

    let binary = "";

    const chunkSize = 0x8000;

    for (
        let i = 0;
        i < bytes.length;
        i += chunkSize
    ) {
        const chunk =
            bytes.subarray(
                i,
                Math.min(
                    i + chunkSize,
                    bytes.length
                )
            );

        binary += String.fromCharCode(
            ...chunk
        );
    }

    return btoa(binary);
}


/*
 * =========================================================
 * LOAD ALL FONTS
 * =========================================================
 */

async function loadFonts(): Promise<{
    sourceSansRegular: string;
    sourceSansSemiBold: string;
    notoSansRegular: string;
    notoSansBold: string;
}> {
    if (
        fontCache.sourceSansRegular &&
        fontCache.sourceSansSemiBold &&
        fontCache.notoSansRegular &&
        fontCache.notoSansBold
    ) {
        return {
            sourceSansRegular:
                fontCache.sourceSansRegular,

            sourceSansSemiBold:
                fontCache.sourceSansSemiBold,

            notoSansRegular:
                fontCache.notoSansRegular,

            notoSansBold:
                fontCache.notoSansBold,
        };
    }

    const [
        sourceSansRegular,
        sourceSansSemiBold,
        notoSansRegular,
        notoSansBold,
    ] = await Promise.all([
        fetchFontAsBase64(
            PDF_FONT_FILES.sourceSansRegular
        ),

        fetchFontAsBase64(
            PDF_FONT_FILES.sourceSansSemiBold
        ),

        fetchFontAsBase64(
            PDF_FONT_FILES.notoSansRegular
        ),

        fetchFontAsBase64(
            PDF_FONT_FILES.notoSansBold
        ),
    ]);

    fontCache = {
        sourceSansRegular,
        sourceSansSemiBold,
        notoSansRegular,
        notoSansBold,
    };

    return {
        sourceSansRegular,
        sourceSansSemiBold,
        notoSansRegular,
        notoSansBold,
    };
}


/*
 * =========================================================
 * REGISTER FONTS
 * =========================================================
 *
 * IMPORTANT:
 *
 * This function MUST receive a jsPDF instance.
 *
 * There is no top-level `doc` usage here.
 *
 * =========================================================
 */

export async function registerFonts(
    doc: jsPDF
): Promise<void> {
    const fonts =
        await loadFonts();


    /*
     * -------------------------------------------------------
     * SOURCE SANS 3 — REGULAR
     * -------------------------------------------------------
     */

    doc.addFileToVFS(
        "SourceSans3-Regular.ttf",
        fonts.sourceSansRegular
    );

    doc.addFont(
        "SourceSans3-Regular.ttf",
        "SourceSans3",
        "normal"
    );


    /*
     * -------------------------------------------------------
     * SOURCE SANS 3 — SEMIBOLD
     * -------------------------------------------------------
     */

    doc.addFileToVFS(
        "SourceSans3-SemiBold.ttf",
        fonts.sourceSansSemiBold
    );

    doc.addFont(
        "SourceSans3-SemiBold.ttf",
        "SourceSans3",
        "bold"
    );


    /*
     * -------------------------------------------------------
     * NOTO SANS — REGULAR
     * -------------------------------------------------------
     *
     * Used as a fallback for Unicode-heavy text such as
     * the Indian Rupee symbol.
     * -------------------------------------------------------
     */

    doc.addFileToVFS(
        "NotoSans-Regular.ttf",
        fonts.notoSansRegular
    );

    doc.addFont(
        "NotoSans-Regular.ttf",
        "NotoSans",
        "normal"
    );


    /*
     * -------------------------------------------------------
     * NOTO SANS — BOLD
     * -------------------------------------------------------
     */

    doc.addFileToVFS(
        "NotoSans-Bold.ttf",
        fonts.notoSansBold
    );

    doc.addFont(
        "NotoSans-Bold.ttf",
        "NotoSans",
        "bold"
    );
}


/*
 * =========================================================
 * CREATE DOCUMENT
 * =========================================================
 */

export async function createPdfDocument(): Promise<jsPDF> {
    const doc =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
            compress: true,
        });


    /*
     * Register fonts BEFORE any text is rendered.
     */

    await registerFonts(doc);


    /*
     * PDF metadata
     */

    doc.setProperties({
        title: "Uranote Document",
        subject: "Uranote Travel Document",
        author: "Uranote",
        creator: "Uranote Docs Generator",
    });


    return doc;
}


/*
 * =========================================================
 * BASIC FONT HELPERS
 * =========================================================
 */

export function setBodyFont(
    doc: jsPDF,
    size = 10
) {
    doc.setFont(
        PDF_FONTS.body,
        "normal"
    );

    doc.setFontSize(size);

    doc.setTextColor(
        ...PDF_COLORS.primary
    );
}


export function setBoldFont(
    doc: jsPDF,
    size = 10
) {
    doc.setFont(
        PDF_FONTS.bold,
        "bold"
    );

    doc.setFontSize(size);

    doc.setTextColor(
        ...PDF_COLORS.primary
    );
}


export function setHeadingFont(
    doc: jsPDF,
    size = 15
) {
    doc.setFont(
        PDF_FONTS.heading,
        "bold"
    );

    doc.setFontSize(size);

    doc.setTextColor(
        ...PDF_COLORS.primary
    );
}


export function setMutedFont(
    doc: jsPDF,
    size = 9
) {
    doc.setFont(
        PDF_FONTS.body,
        "normal"
    );

    doc.setFontSize(size);

    doc.setTextColor(
        ...PDF_COLORS.secondary
    );
}


/*
 * =========================================================
 * CURRENCY / NUMBER FORMATTING
 * =========================================================
 */

export function formatCurrency(
    amount: number
): string {
    const safeAmount =
        Number(amount || 0);

    return `₹${safeAmount.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}


export function formatDate(
    date?: string
): string {
    if (!date) {
        return "—";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


export function formatNumber(
    value: number
): string {
    return Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    );
}


/*
 * =========================================================
 * PAGE POSITIONING
 * =========================================================
 */

export function getContentStartY(): number {
    return PDF_PAGE.margin.top;
}


export function getContentBottomY(): number {
    return (
        PDF_PAGE.height -
        PDF_PAGE.margin.bottom
    );
}


export function getContentHeight(): number {
    return (
        getContentBottomY() -
        getContentStartY()
    );
}


export function getPageWidth(): number {
    return PDF_PAGE.width;
}


export function getContentWidth(): number {
    return PDF_PAGE.contentWidth;
}


/*
 * =========================================================
 * PAGE BREAK
 * =========================================================
 */

export function ensureSpace(
    doc: jsPDF,
    currentY: number,
    requiredHeight: number,
    options?: {
        headerHeight?: number;
    }
): number {
    const bottom =
        getContentBottomY();

    if (
        currentY +
        requiredHeight <=
        bottom
    ) {
        return currentY;
    }

    doc.addPage();

    return (
        getContentStartY() +
        (options?.headerHeight || 0)
    );
}


/*
 * =========================================================
 * HEADER
 * =========================================================
 */

export function drawHeader(
    doc: jsPDF,
    firm: PdfFirm | undefined,
    title: string,
    date?: string,
    number?: string,
    bookingId?: string
): number {
    const left = PDF_PAGE.margin.left;
    const right =
        PDF_PAGE.width - PDF_PAGE.margin.right;

    const y = PDF_PAGE.margin.top;

    /*
     * -------------------------------------------------------
     * LEFT SIDE — FIRM NAME
     * -------------------------------------------------------
     */

    setBoldFont(doc, 16);

    doc.text(
        firm?.name || "Uranote",
        left,
        y
    );

    /*
     * -------------------------------------------------------
     * LEFT SIDE — CONTACT DETAILS
     * -------------------------------------------------------
     */

    const contactParts: string[] = [];

    if (firm?.phone) {
        contactParts.push(firm.phone);
    }

    if (firm?.email) {
        contactParts.push(firm.email);
    }

    if (firm?.website) {
        contactParts.push(firm.website);
    }

    if (contactParts.length > 0) {
        setMutedFont(doc, 7.5);

        doc.text(
            contactParts.join("  •  "),
            left,
            y + 5
        );
    }

    /*
     * -------------------------------------------------------
     * RIGHT SIDE — DOCUMENT TITLE
     * -------------------------------------------------------
     */

    setHeadingFont(doc, 14);

    doc.text(
        title.toUpperCase(),
        right,
        y,
        {
            align: "right",
        }
    );

    /*
     * -------------------------------------------------------
     * RIGHT SIDE — DOCUMENT NUMBER / DATE / ID
     * -------------------------------------------------------
     */

    let metaY = y + 5.5;

    if (number) {
        setMutedFont(doc, 7.5);

        doc.text(
            `No. ${String(number)}`,
            right,
            metaY,
            {
                align: "right",
            }
        );
        metaY += 4.5;
    }

    if (date) {
        setMutedFont(doc, 7.5);

        doc.text(
            `Date: ${String(date)}`,
            right,
            metaY,
            {
                align: "right",
            }
        );
        metaY += 4.5;
    }

    if (bookingId) {
        setMutedFont(doc, 7.5);

        doc.text(
            `ID: ${String(bookingId)}`,
            right,
            metaY,
            {
                align: "right",
            }
        );
        metaY += 4.5;
    }

    /*
     * -------------------------------------------------------
     * HEADER LINE
     * -------------------------------------------------------
     */

    const lineY = Math.max(y + 17, metaY + 1);

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.setLineWidth(0.35);

    doc.line(
        left,
        lineY,
        right,
        lineY
    );

    return lineY + 9;
}


/*
 * =========================================================
 * FOOTER
 * =========================================================
 */

export function drawFooter(
    doc: jsPDF,
    firm?: PdfFirm
) {
    const pageCount =
        doc.getNumberOfPages();

    for (
        let page = 1;
        page <= pageCount;
        page++
    ) {
        doc.setPage(page);

        const y =
            PDF_PAGE.height -
            10;

        const left =
            PDF_PAGE.margin.left;

        const right =
            PDF_PAGE.width -
            PDF_PAGE.margin.right;


        /*
         * Footer divider
         */

        doc.setDrawColor(
            ...PDF_COLORS.border
        );

        doc.setLineWidth(
            0.25
        );

        doc.line(
            left,
            y - 4,
            right,
            y - 4
        );


        /*
         * Footer text
         */

        setMutedFont(
            doc,
            7.5
        );

        const footerText =
            firm?.thankYouMessage ||
            "Thank you for choosing Uranote.";

        doc.text(
            footerText,
            left,
            y
        );


        /*
         * Page number
         */

        doc.text(
            `Page ${page} of ${pageCount}`,
            right,
            y,
            {
                align: "right",
            }
        );
    }
}


/*
 * =========================================================
 * DOCUMENT TITLE
 * =========================================================
 */

export function drawDocumentTitle(
    doc: jsPDF,
    title: string,
    subtitle?: string,
    y = 40
): number {
    setHeadingFont(
        doc,
        18
    );

    doc.text(
        title,
        PDF_PAGE.margin.left,
        y
    );

    if (subtitle) {
        setMutedFont(
            doc,
            9
        );

        doc.text(
            subtitle,
            PDF_PAGE.margin.left,
            y + 6
        );

        return y + 13;
    }

    return y + 8;
}


/*
 * =========================================================
 * INFO BOX
 * =========================================================
 */

export interface InfoRow {
    label: string;
    value: string;
}


export function drawInfoBox(
    doc: jsPDF,
    rows: InfoRow[],
    x = PDF_PAGE.margin.left,
    y = 50,
    width = PDF_PAGE.contentWidth,
    labelWidth = 35
): number {
    const rowHeight = 7;

    const height =
        rows.length *
        rowHeight +
        8;


    /*
     * Background
     */

    doc.setFillColor(
        ...PDF_COLORS.lightBackground
    );

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.setLineWidth(
        0.3
    );

    doc.roundedRect(
        x,
        y,
        width,
        height,
        2,
        2,
        "FD"
    );


    let currentY =
        y + 6;

    rows.forEach(
        (row) => {
            setMutedFont(
                doc,
                8
            );

            doc.text(
                row.label,
                x + 5,
                currentY
            );

            setBoldFont(
                doc,
                8.5
            );

            doc.text(
                row.value || "—",
                x + labelWidth,
                currentY
            );

            currentY +=
                rowHeight;
        }
    );


    return y + height;
}


/*
 * =========================================================
 * TWO COLUMN INFO BOX
 * =========================================================
 */

export interface TwoColumnInfo {
    left: InfoRow[];
    right: InfoRow[];
}


export function drawTwoColumnInfoBox(
    doc: jsPDF,
    info: TwoColumnInfo,
    y: number,
    options?: {
        height?: number;
    }
): number {
    const x =
        PDF_PAGE.margin.left;

    const width =
        PDF_PAGE.contentWidth;

    const gap = 6;

    const columnWidth =
        (width - gap) / 2;

    const height =
        options?.height || 32;


    /*
     * Left box
     */

    doc.setFillColor(
        ...PDF_COLORS.lightBackground
    );

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.roundedRect(
        x,
        y,
        columnWidth,
        height,
        2,
        2,
        "FD"
    );


    /*
     * Right box
     */

    doc.roundedRect(
        x +
        columnWidth +
        gap,
        y,
        columnWidth,
        height,
        2,
        2,
        "FD"
    );


    function renderRows(
        rows: InfoRow[],
        startX: number
    ) {
        let currentY =
            y + 7;

        rows.forEach(
            (row) => {
                setMutedFont(
                    doc,
                    7.5
                );

                doc.text(
                    row.label,
                    startX + 5,
                    currentY
                );

                setBoldFont(
                    doc,
                    8.5
                );

                doc.text(
                    row.value || "—",
                    startX + 32,
                    currentY
                );

                currentY += 7;
            }
        );
    }


    renderRows(
        info.left,
        x
    );

    renderRows(
        info.right,
        x +
        columnWidth +
        gap
    );


    return y + height;
}


/*
 * =========================================================
 * SECTION HEADING
 * =========================================================
 */

export function drawSectionHeading(
    doc: jsPDF,
    title: string,
    y: number,
    options?: {
        subtitle?: string;
    }
): number {
    setBoldFont(
        doc,
        10.5
    );

    doc.text(
        title,
        PDF_PAGE.margin.left,
        y
    );

    let currentY =
        y + 4;


    if (options?.subtitle) {
        setMutedFont(
            doc,
            8
        );

        doc.text(
            options.subtitle,
            PDF_PAGE.margin.left,
            currentY + 3
        );

        currentY += 8;
    }


    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.setLineWidth(
        0.3
    );

    doc.line(
        PDF_PAGE.margin.left,
        currentY,
        PDF_PAGE.width -
        PDF_PAGE.margin.right,
        currentY
    );


    return currentY + 6;
}


/*
 * =========================================================
 * LABEL / VALUE
 * =========================================================
 */

export function drawLabelValue(
    doc: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    options?: {
        labelWidth?: number;
        valueBold?: boolean;
    }
) {
    setMutedFont(
        doc,
        8
    );

    doc.text(
        label,
        x,
        y
    );


    if (
        options?.valueBold !== false
    ) {
        setBoldFont(
            doc,
            8.5
        );
    } else {
        setBodyFont(
            doc,
            8.5
        );
    }


    doc.text(
        value || "—",
        x +
        (options?.labelWidth ||
            30),
        y
    );
}


/*
 * =========================================================
 * HIGHLIGHT BOX
 * =========================================================
 */

export function drawHighlightBox(
    doc: jsPDF,
    label: string,
    value: string,
    y: number,
    options?: {
        width?: number;
        align?: "left" | "right";
    }
): number {
    const width =
        options?.width || 60;

    const x =
        options?.align === "right"
            ? PDF_PAGE.width -
            PDF_PAGE.margin.right -
            width
            : PDF_PAGE.margin.left;

    const height = 22;


    doc.setFillColor(
        ...PDF_COLORS.accentLight
    );

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.roundedRect(
        x,
        y,
        width,
        height,
        2,
        2,
        "FD"
    );


    setMutedFont(
        doc,
        7.5
    );

    doc.text(
        label.toUpperCase(),
        x + 5,
        y + 7
    );


    setBoldFont(
        doc,
        12
    );

    doc.setTextColor(
        ...PDF_COLORS.accent
    );

    doc.text(
        value,
        x + 5,
        y + 15
    );


    return y + height;
}


/*
 * =========================================================
 * DIVIDER
 * =========================================================
 */

export function drawDivider(
    doc: jsPDF,
    y: number,
    options?: {
        margin?: number;
    }
) {
    const margin =
        options?.margin || 0;

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.setLineWidth(
        0.25
    );

    doc.line(
        PDF_PAGE.margin.left +
        margin,
        y,
        PDF_PAGE.width -
        PDF_PAGE.margin.right -
        margin,
        y
    );
}


/*
 * =========================================================
 * TABLE
 * =========================================================
 */

export function drawTable(
    doc: jsPDF,
    columns: PdfTableColumn[],
    rows: PdfTableRow[],
    options?: Partial<UserOptions>
): number {
    const startY =
        options?.startY ||
        PDF_PAGE.margin.top;


    autoTable(doc, {
        startY,

        margin: {
            left:
                PDF_PAGE.margin.left,

            right:
                PDF_PAGE.margin.right,

            top:
                PDF_PAGE.margin.top,

            bottom:
                PDF_PAGE.margin.bottom,
        },

        tableWidth: "auto",


        columns:
            columns.map(
                (column) => ({
                    header:
                        column.header,

                    dataKey:
                        column.dataKey,
                })
            ),


        body: rows,


        theme: "grid",


        styles: {
            font:
                PDF_FONTS.body,

            fontStyle:
                "normal",

            fontSize:
                10.5,

            textColor:
                PDF_COLORS.primary,

            lineColor:
                PDF_COLORS.border,

            lineWidth:
                0.25,

            cellPadding: {
                top: 3.5,
                right: 4,
                bottom: 3.5,
                left: 4,
            },

            valign:
                "middle",
        },


        headStyles: {
            font:
                PDF_FONTS.bold,

            fontStyle:
                "bold",

            fontSize:
                9,

            textColor:
                PDF_COLORS.white,

            fillColor:
                PDF_COLORS.accent,

            lineColor:
                PDF_COLORS.accent,

            lineWidth:
                0.25,

            cellPadding: {
                top: 3.5,
                right: 4,
                bottom: 3.5,
                left: 4,
            },
        },


        alternateRowStyles: {
            fillColor:
                PDF_COLORS.lightBackground,
        },


        bodyStyles: {
            minCellHeight: 8,
        },


        ...options,
    });


    return (
        (
            doc as jsPDF & {
                lastAutoTable?: {
                    finalY: number;
                };
            }
        ).lastAutoTable?.finalY ||
        startY
    );
}


/*
 * =========================================================
 * TOTALS BOX
 * =========================================================
 */

export interface TotalRow {
    label: string;
    value: string;
    bold?: boolean;
}


export function drawTotalsBox(
    doc: jsPDF,
    rows: TotalRow[],
    y: number,
    options?: {
        width?: number;
    }
): number {
    const width =
        options?.width || 72;

    const x =
        PDF_PAGE.width -
        PDF_PAGE.margin.right -
        width;

    const rowHeight = 8;

    const height =
        rows.length *
        rowHeight +
        8;


    doc.setFillColor(
        ...PDF_COLORS.lightBackground
    );

    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.roundedRect(
        x,
        y,
        width,
        height,
        2,
        2,
        "FD"
    );


    let currentY =
        y + 7;


    rows.forEach(
        (row) => {
            if (row.bold) {
                setBoldFont(
                    doc,
                    9
                );
            } else {
                setMutedFont(
                    doc,
                    8
                );
            }


            doc.text(
                row.label,
                x + 5,
                currentY
            );


            if (row.bold) {
                setBoldFont(
                    doc,
                    9
                );
            } else {
                setBodyFont(
                    doc,
                    8
                );
            }


            doc.text(
                row.value,
                x + width - 5,
                currentY,
                {
                    align: "right",
                }
            );


            currentY +=
                rowHeight;
        }
    );


    return y + height;
}


/*
 * =========================================================
 * PAYMENT SUMMARY
 * =========================================================
 */

export function drawPaymentSummary(
    doc: jsPDF,
    bookingValue: number,
    amountReceived: number,
    balanceDue: number,
    y: number
): number {
    return drawTotalsBox(
        doc,
        [
            {
                label:
                    "Booking Value",

                value:
                    formatCurrency(
                        bookingValue
                    ),
            },

            {
                label:
                    "Payment Received",

                value:
                    formatCurrency(
                        amountReceived
                    ),
            },

            {
                label:
                    "Balance Due",

                value:
                    formatCurrency(
                        balanceDue
                    ),

                bold: true,
            },
        ],
        y,
        {
            width: 78,
        }
    );
}


/*
 * =========================================================
 * SIGNATURE / ISSUED BY
 * =========================================================
 */

export function drawIssuedBy(
    doc: jsPDF,
    issuedBy: string | undefined,
    y: number
): number {
    const x =
        PDF_PAGE.width -
        PDF_PAGE.margin.right -
        55;

    const width = 55;


    doc.setDrawColor(
        ...PDF_COLORS.border
    );

    doc.setLineWidth(
        0.3
    );

    doc.line(
        x,
        y,
        x + width,
        y
    );


    setMutedFont(
        doc,
        7.5
    );

    doc.text(
        issuedBy
            ? `Issued by ${issuedBy}`
            : "Issued by",
        x + width / 2,
        y + 5,
        {
            align: "center",
        }
    );


    return y + 12;
}


/*
 * =========================================================
 * NOTE BOX
 * =========================================================
 */

export function drawNoteBox(
    doc: jsPDF,
    title: string,
    text: string,
    y: number
): number {
    const x =
        PDF_PAGE.margin.left;

    const width =
        PDF_PAGE.contentWidth;


    const wrappedText =
        doc.splitTextToSize(
            text,
            width - 10
        );


    const height =
        12 +
        wrappedText.length *
        4.2;


    doc.setFillColor(
        ...PDF_COLORS.lightBackground
    );

    doc.setDrawColor(
        ...PDF_COLORS.border
    );


    doc.roundedRect(
        x,
        y,
        width,
        height,
        2,
        2,
        "FD"
    );


    setBoldFont(
        doc,
        8
    );

    doc.text(
        title,
        x + 5,
        y + 7
    );


    setMutedFont(
        doc,
        8
    );

    doc.text(
        wrappedText,
        x + 5,
        y + 13
    );


    return y + height;
}


/*
 * =========================================================
 * TEXT BLOCK
 * =========================================================
 */

export function drawTextBlock(
    doc: jsPDF,
    text: string,
    y: number,
    options?: {
        fontSize?: number;
        lineHeight?: number;
        width?: number;
        bold?: boolean;
    }
): number {
    const width =
        options?.width ||
        PDF_PAGE.contentWidth;

    const fontSize =
        options?.fontSize || 10;

    const lineHeight =
        options?.lineHeight ||
        fontSize * 0.5;


    if (options?.bold) {
        setBoldFont(
            doc,
            fontSize
        );
    } else {
        setBodyFont(
            doc,
            fontSize
        );
    }


    const lines =
        doc.splitTextToSize(
            text,
            width
        );


    doc.text(
        lines,
        PDF_PAGE.margin.left,
        y,
        {
            lineHeightFactor:
                lineHeight /
                fontSize,
        }
    );


    return (
        y +
        lines.length *
        lineHeight
    );
}


/*
 * =========================================================
 * SAVE / EXPORT
 * =========================================================
 */

export function savePdf(
    doc: jsPDF,
    fileName: string
) {
    const safeFileName =
        fileName
            .trim()
            .replace(
                /[<>:"/\\|?*\x00-\x1F]/g,
                "-"
            );


    doc.save(
        safeFileName.endsWith(
            ".pdf"
        )
            ? safeFileName
            : `${safeFileName}.pdf`
    );
}


/*
 * =========================================================
 * FINALIZE DOCUMENT
 * =========================================================
 */

export function finalizePdf(
    doc: jsPDF,
    options: {
        fileName: string;
        title: string;
        firm?: PdfFirm;
        showFooter?: boolean;
    }
) {
    doc.setProperties({
        title:
            options.title,

        subject:
            `Uranote ${options.title}`,

        author:
            options.firm?.name ||
            "Uranote",

        creator:
            "Uranote Docs Generator",
    });


    if (
        options.showFooter !== false
    ) {
        drawFooter(
            doc,
            options.firm
        );
    }


    savePdf(
        doc,
        options.fileName
    );
}


/*
 * =========================================================
 * CREATE + HEADER CONVENIENCE FUNCTION
 * =========================================================
 *
 * IMPORTANT:
 *
 * This function is asynchronous because the fonts must be
 * loaded before the header text is rendered.
 *
 * Usage:
 *
 *   const {
 *       doc,
 *       startY
 *   } = await createPdfWithHeader(
 *       "Receipt",
 *       pdfFirm
 *   );
 *
 * =========================================================
 */

export async function createPdfWithHeader(
    title: string,
    firm?: PdfFirm,
    date?: string,
    number?: string,
    bookingId?: string
): Promise<{
    doc: jsPDF;
    startY: number;
}> {
    const doc = await createPdfDocument();

    const startY = drawHeader(
        doc,
        firm,
        title,
        date,
        number,
        bookingId
    );

    return {
        doc,
        startY,
    };
}


/*
 * =========================================================
 * PAGE NUMBER HELPER
 * =========================================================
 */

export function addPageNumbers(
    doc: jsPDF
) {
    const pageCount =
        doc.getNumberOfPages();


    for (
        let page = 1;
        page <= pageCount;
        page++
    ) {
        doc.setPage(page);


        setMutedFont(
            doc,
            7
        );


        doc.text(
            `${page}`,
            PDF_PAGE.width / 2,
            PDF_PAGE.height - 7,
            {
                align: "center",
            }
        );
    }
}


/*
 * =========================================================
 * TABLE CELL HELPERS
 * =========================================================
 */

export function rightAlignTableColumn(
    columnName: string
): Partial<UserOptions> {
    return {
        columnStyles: {
            [columnName]: {
                halign: "right",
            },
        },
    };
}


export function centerAlignTableColumn(
    columnName: string
): Partial<UserOptions> {
    return {
        columnStyles: {
            [columnName]: {
                halign: "center",
            },
        },
    };
}


/*
 * =========================================================
 * COMBINE TABLE OPTIONS
 * =========================================================
 */

export function mergeTableOptions(
    ...options: Partial<UserOptions>[]
): Partial<UserOptions> {
    const merged:
        Partial<UserOptions> = {};


    for (
        const option of options
    ) {
        Object.assign(
            merged,
            option
        );
    }


    return merged;
}


/*
 * =========================================================
 * TYPE-SAFE TABLE CELL
 * =========================================================
 */

export function tableText(
    value: unknown
): CellInput {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }


    return String(value);
}