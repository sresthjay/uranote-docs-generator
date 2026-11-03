export type ServiceType =
  | "taxi"
  | "hotel"
  | "flight"
  | "miscellaneous";

export interface Customer {
  name: string;
  phone: string;
  email: string;
}

export interface Firm {
  id: string;
  name: string;
  code: string
  logo?: string;
  email: string;
  phone: string;
  website?: string;
  issuedBy?: string;
  thankYouMessage?: string;
}

export interface ServiceItem {
  type: ServiceType;
  description: string;
  quantity: number;
  amount: number;
}

export interface PaymentEntry {
  category: "hotel" | "taxi" | "other";
  label: string;
  dueDate?: string;
  amount: number;
  paymentMethod?: string;
}

export interface HotelBooking {
  name: string;
  checkIn: string;
  checkOut: string;
  contact?: string;
}

export interface TaxiBooking {
  vehicle: string;
  contact?: string;
}

export interface OtherService {
  name: string;
  details?: string;
  contact?: string;
}

export interface Booking {
  bookingId: string;

  firmId: string;

  bookingSequence: number;

  bookingNumber?: string;

  bookingDate: string;

  customer: Customer;

  travelStartDate: string;

  travelEndDate: string;

  services: ServiceItem[];

  amountReceived: number;

  paymentSchedule: PaymentEntry[];

  taxi?: TaxiBooking;

  hotels: HotelBooking[];

  otherServices: OtherService[];
}

export interface Receipt {
  date: string;
  booking: Booking;
  paymentMethod?: string;
  transactionReference?: string;
}

export interface ReservationVoucher {
  date: string;
  booking: Booking;
}

export interface PaymentSchedule {
  date: string;
  booking: Booking;
}

/**
 * A single stay date range for a vendor booking request.
 *
 * A property booking can have more than one check-in and
 * check-out pair, for example when a group splits its stay.
 */
export interface VendorBookingStay {
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
}

/**
 * Temporary form data for a vendor (hotel) booking request.
 *
 * This is intentionally not a saved booking record. It exists
 * only while the request form is open and is used to render
 * the Hotel Booking Request PDF.
 */
export interface VendorBookingRequest {
  firmId: string;

  guestName: string;
  contactNumber: string;
  numberOfGuests: number;

  propertyName: string;
  destination: string;

  stays: VendorBookingStay[];

  numberOfRooms: number;
  roomType: string;

  mealPlan: string;

  specialRequirements: string;

  totalCost: number;
  advancePayment: number;
}