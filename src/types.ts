export enum UserRole {
  CUSTOMER = 'Customer',
  PARKING_ATTENDANT = 'Parking Attendant',
  SERVICE_TECHNICIAN = 'Service Technician',
  SERVICE_MANAGER = 'Service Manager',
  ADMINISTRATOR = 'Administrator',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  isAuthorizedStaff?: boolean;
  authorizationStatus?: 'Authorized' | 'Pending Approval' | 'Customer';
  isVerified?: boolean;
  verificationToken?: string;
  verificationCode?: string;
  verificationSentAt?: string;
  verifiedAt?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  mileage: number;
  vin?: string;
}

export enum ParkingSpaceStatus {
  AVAILABLE = 'Available',
  RESERVED = 'Reserved',
  OCCUPIED = 'Occupied',
}

export interface ParkingSpace {
  id: string;
  location: string;
  floor: string;
  section: string;
  spaceNumber: string;
  status: ParkingSpaceStatus;
  pricePerHour: number; // in UGX (as specified in prompt: UGX 5,000)
}

export enum ReservationStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface ParkingReservation {
  id: string;
  userId: string;
  vehicleId: string;
  parkingId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  amount: number;
  qrCode: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export enum ServiceStatus {
  BOOKED = 'Booked',
  INSPECTION = 'Vehicle Inspection',
  OIL_CHANGE = 'Oil Change',
  BRAKE_INSPECTION = 'Brake Inspection',
  WHEEL_ALIGNMENT = 'Wheel Alignment',
  CAR_WASH = 'Car Wash',
  DISPATCHED = 'Mobile Van Dispatched',
  COMPLETED = 'Completed',
  READY_FOR_PICKUP = 'Ready for Pickup',
}

export interface VehicleService {
  id: string;
  vehicleId: string;
  customerId: string;
  serviceType: string;
  technicianId?: string;
  status: ServiceStatus;
  cost: number;
  bookingDate: string;
  completionDate?: string;
  diagnosticNotes?: string;

  // Home Servicing & Location fields
  isHomeService?: boolean;
  homeAddress?: string;
  homeCity?: string;
  homeLandmark?: string;
  contactPhone?: string;

  // Hand-off & Multi-Role Coordination (Technician -> Manager + Customer + Parking Attendant)
  assignmentStatus?: 'Pending' | 'Accepted' | 'Rejected';
  rejectionReason?: string;
  assignedAt?: string;
  acceptedAt?: string;
  managerNotifiedOfCompletion?: boolean;
  completionNotificationSentAt?: string;
  customerNotifiedByManager?: boolean;
  customerNotificationSentAt?: string;
  assignedDeliveryBay?: string; // e.g. "Slot A12 (Floor G)" or "Home Driveway"
  attendantHandoffStatus?: 'Pending Attendant Verification' | 'Attendant Verified in Bay' | 'Customer Handed Over';
  completionHandOffNotes?: string;
  managerNotified?: boolean;
  customerNotified?: boolean;
  attendantNotified?: boolean;
  notifiedAt?: string;
}

export interface ServiceItem {
  id: string;
  serviceId: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: 'Mobile Money' | 'Credit Card' | 'Bank Transfer' | 'Digital Wallet';
  transactionId: string;
  status: 'Pending' | 'Success' | 'Failed';
  date: string;
  reservationId?: string;
  serviceId?: string;
  paymentDetails?: string;
}

export interface InventoryItem {
  id: string;
  partName: string;
  quantity: number;
  minRequired: number;
  price: number;
}
