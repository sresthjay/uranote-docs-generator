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