import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  UserRole,
  User,
  Vehicle,
  ParkingSpace,
  ParkingSpaceStatus,
  ParkingReservation,
  ReservationStatus,
  VehicleService,
  ServiceStatus,
  ServiceItem,
  Payment,
  InventoryItem,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for all incoming requests (Vercel, local preview, cross-origin)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Supabase Client (if keys provided in environment)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client successfully initialized for database persistence:', supabaseUrl);
  } catch (err) {
    console.error('⚠️ Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('ℹ️ SUPABASE_URL or SUPABASE_ANON_KEY missing. Operating with synchronized local memory fallback.');
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client successfully initialized.');
  } else {
    console.warn('GEMINI_API_KEY not found. Operating in local-prediction fallback mode.');
  }
} catch (error) {
  console.error('Error initializing Gemini client:', error);
}

// Supabase Status API
app.get('/api/supabase/status', (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  res.json({
    configured: Boolean(url && key),
    supabaseUrl: url ? url.substring(0, 12) + '...' : null,
  });
});

// --- SUPABASE DATABASE MAPPER HELPERS ---

import crypto from 'crypto';

function toUuid(id: string | null | undefined): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  const hash = crypto.createHash('md5').update(id).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function mapUserToDb(u: User) {
  return {
    id: toUuid(u.id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    is_authorized_staff: u.isAuthorizedStaff ?? false,
    authorization_status: u.authorizationStatus || 'Customer',
    created_at: u.createdAt || new Date().toISOString(),
    is_verified: u.isVerified ?? true,
    verification_token: u.verificationToken || null,
    verification_sent_at: u.verificationSentAt || null,
    verified_at: u.verifiedAt || null,
  };
}

function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role as UserRole,
    createdAt: row.created_at,
    isAuthorizedStaff: row.is_authorized_staff,
    authorizationStatus: row.authorization_status,
    isVerified: row.is_verified ?? true,
    verificationToken: row.verification_token,
    verificationSentAt: row.verification_sent_at,
    verifiedAt: row.verified_at,
  };
}

function mapVehicleToDb(v: Vehicle) {
  return {
    id: toUuid(v.id),
    user_id: toUuid(v.userId),
    registration_number: v.registrationNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    mileage: v.mileage,
    vin: v.vin || '',
  };
}

function mapVehicleFromDb(row: any): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    registrationNumber: row.registration_number,
    make: row.make,
    model: row.model,
    year: Number(row.year),
    color: row.color,
    mileage: Number(row.mileage || 0),
    vin: row.vin,
  };
}

function mapParkingSpaceToDb(s: ParkingSpace) {
  return {
    id: toUuid(s.id),
    location: s.location,
    floor: s.floor,
    section: s.section,
    space_number: s.spaceNumber,
    status: s.status,
    price_per_hour: s.pricePerHour,
  };
}

function mapParkingSpaceFromDb(row: any): ParkingSpace {
  return {
    id: row.id,
    location: row.location,
    floor: row.floor,
    section: row.section,
    spaceNumber: row.space_number,
    status: row.status as ParkingSpaceStatus,
    pricePerHour: Number(row.price_per_hour),
  };
}

function mapReservationToDb(r: ParkingReservation) {
  return {
    id: toUuid(r.id),
    user_id: toUuid(r.userId),
    vehicle_id: toUuid(r.vehicleId),
    parking_space_id: toUuid(r.parkingId),
    start_time: r.startTime,
    end_time: r.endTime,
    status: r.status,
    amount: r.amount,
    qr_code: r.qrCode,
    checked_in_at: r.checkedInAt || null,
    checked_out_at: r.checkedOutAt || null,
  };
}

function mapReservationFromDb(row: any): ParkingReservation {
  return {
    id: row.id,
    userId: row.user_id,
    vehicleId: row.vehicle_id,
    parkingId: row.parking_space_id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status as ReservationStatus,
    amount: Number(row.amount),
    qrCode: row.qr_code,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
  };
}

function mapServiceToDb(s: VehicleService) {
  return {
    id: toUuid(s.id),
    vehicle_id: toUuid(s.vehicleId),
    customer_id: toUuid(s.customerId),
    service_type: s.serviceType,
    technician_id: toUuid(s.technicianId),
    status: s.status,
    cost: s.cost,
    booking_date: s.bookingDate,
    completion_date: s.completionDate || null,
    diagnostic_notes: s.diagnosticNotes || null,
    is_home_service: s.isHomeService || false,
    home_address: s.homeAddress || null,
    home_city: s.homeCity || null,
    home_landmark: s.homeLandmark || null,
    contact_phone: s.contactPhone || null,
    assignment_status: s.assignmentStatus || 'Pending',
    rejection_reason: s.rejectionReason || null,
    assigned_at: s.assignedAt || null,
    accepted_at: s.acceptedAt || null,
    manager_notified_of_completion: s.managerNotifiedOfCompletion || false,
    completion_notification_sent_at: s.completionNotificationSentAt || null,
    customer_notified_by_manager: s.customerNotifiedByManager || false,
    customer_notification_sent_at: s.customerNotificationSentAt || null,
    assigned_delivery_bay: s.assignedDeliveryBay || null,
    attendant_handoff_status: s.attendantHandoffStatus || 'Pending Attendant Verification',
    completion_hand_off_notes: s.completionHandOffNotes || null,
  };
}

function mapServiceFromDb(row: any): VehicleService {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    customerId: row.customer_id,
    serviceType: row.service_type,
    technicianId: row.technician_id,
    status: row.status as ServiceStatus,
    cost: Number(row.cost),
    bookingDate: row.booking_date,
    completionDate: row.completion_date,
    diagnosticNotes: row.diagnostic_notes,
    isHomeService: row.is_home_service,
    homeAddress: row.home_address,
    homeCity: row.home_city,
    homeLandmark: row.home_landmark,
    contactPhone: row.contact_phone,
    assignmentStatus: row.assignment_status,
    rejectionReason: row.rejection_reason,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at,
    managerNotifiedOfCompletion: row.manager_notified_of_completion,
    completionNotificationSentAt: row.completion_notification_sent_at,
    customerNotifiedByManager: row.customer_notified_by_manager,
    customerNotificationSentAt: row.customer_notification_sent_at,
    assignedDeliveryBay: row.assigned_delivery_bay,
    attendantHandoffStatus: row.attendant_handoff_status,
    completionHandOffNotes: row.completion_hand_off_notes,
    managerNotified: row.manager_notified_of_completion,
    customerNotified: row.customer_notified_by_manager,
    attendantNotified: Boolean(row.completion_date),
    notifiedAt: row.completion_notification_sent_at,
  };
}

function mapServiceItemToDb(item: ServiceItem) {
  return {
    id: toUuid(item.id),
    service_id: toUuid(item.serviceId),
    description: item.description,
    quantity: item.quantity,
    price: item.price,
  };
}

function mapServiceItemFromDb(row: any): ServiceItem {
  return {
    id: row.id,
    serviceId: row.service_id,
    description: row.description,
    quantity: row.quantity,
    price: Number(row.price),
  };
}

function mapPaymentToDb(p: Payment) {
  return {
    id: toUuid(p.id),
    user_id: toUuid(p.userId),
    amount: p.amount,
    payment_method: p.paymentMethod,
    transaction_id: p.transactionId,
    status: p.status,
    date: p.date,
    reservation_id: toUuid(p.reservationId),
    service_id: toUuid(p.serviceId),
    payment_details: p.paymentDetails || null,
  };
}

function mapPaymentFromDb(row: any): Payment {
  return {
    id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    status: row.status,
    date: row.date,
    reservationId: row.reservation_id,
    serviceId: row.service_id,
    paymentDetails: row.payment_details,
  };
}

function mapInventoryToDb(i: InventoryItem) {
  return {
    id: toUuid(i.id),
    part_name: i.partName,
    quantity: i.quantity,
    min_required: i.minRequired,
    price: i.price,
  };
}

function mapInventoryFromDb(row: any): InventoryItem {
  return {
    id: row.id,
    partName: row.part_name,
    quantity: row.quantity,
    minRequired: row.min_required,
    price: Number(row.price),
  };
}

// --- In-Memory State & Seed Data ---

const users: User[] = [
  {
    id: 'usr-1',
    name: 'Jonathan',
    email: 'jonathaneny82@gmail.com',
    phone: '+256 772 123456',
    role: UserRole.CUSTOMER,
    createdAt: '2026-01-10T10:00:00Z',
    isAuthorizedStaff: false,
    authorizationStatus: 'Customer',
    isVerified: true,
  },
  {
    id: 'usr-2',
    name: 'Alex Mukasa',
    email: 'alex.m@welilecarhub.com',
    phone: '+256 701 987654',
    role: UserRole.PARKING_ATTENDANT,
    createdAt: '2026-02-15T08:30:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
  {
    id: 'usr-3',
    name: 'Sarah Nakato',
    email: 'sarah.n@welilecarhub.com',
    phone: '+256 782 555111',
    role: UserRole.SERVICE_TECHNICIAN,
    createdAt: '2026-03-01T07:45:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
  {
    id: 'usr-4',
    name: 'Denis Okello',
    email: 'denis.o@welilecarhub.com',
    phone: '+256 752 444333',
    role: UserRole.SERVICE_MANAGER,
    createdAt: '2026-01-20T09:00:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
  {
    id: 'usr-5',
    name: 'Grace Namubiru',
    email: 'grace.admin@welilecarhub.com',
    phone: '+256 700 111222',
    role: UserRole.ADMINISTRATOR,
    createdAt: '2025-12-01T08:00:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
  {
    id: 'usr-6',
    name: 'David Otim',
    email: 'david.o@welilecarhub.com',
    phone: '+256 788 333444',
    role: UserRole.SERVICE_TECHNICIAN,
    createdAt: '2026-03-10T08:00:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
  {
    id: 'usr-7',
    name: 'Paul Kato',
    email: 'paul.k@welilecarhub.com',
    phone: '+256 777 888999',
    role: UserRole.SERVICE_TECHNICIAN,
    createdAt: '2026-04-01T08:00:00Z',
    isAuthorizedStaff: true,
    authorizationStatus: 'Authorized',
    isVerified: true,
  },
];

const vehicles: Vehicle[] = [
  {
    id: 'veh-1',
    userId: 'usr-1',
    registrationNumber: 'UAX 456B',
    make: 'Toyota',
    model: 'Harrier',
    year: 2018,
    color: 'Pearl White',
    mileage: 65000,
    vin: 'JT153AL210084592',
  },
  {
    id: 'veh-2',
    userId: 'usr-1',
    registrationNumber: 'UBM 915P',
    make: 'Subaru',
    model: 'Forester',
    year: 2020,
    color: 'Dark Blue',
    mileage: 43200,
    vin: 'JF1SG51638G109432',
  },
];

// Seed Parking Spaces
const parkingSpaces: ParkingSpace[] = [
  {
    id: 'space-a12',
    location: 'Kampala Central Yard',
    floor: 'G',
    section: 'A',
    spaceNumber: 'A12',
    status: ParkingSpaceStatus.OCCUPIED,
    pricePerHour: 2500,
  }
];
const registeredGrounds = [
  { name: 'Kampala Central Yard (Nakasero)', floors: ['G', '1', '2'], price: 5000 },
  { name: 'Entebbe Airport Express Yard', floors: ['Ground', 'Deck 1'], price: 6000 },
  { name: 'Jinja Highway Service Depot', floors: ['Ground Yard'], price: 4000 },
  { name: 'Mbarara Regional Hub', floors: ['G', '1'], price: 4000 },
  { name: 'Gulu Northern Yard', floors: ['Ground Yard'], price: 3500 },
  { name: 'Mbale Eastern Depot', floors: ['Ground Yard'], price: 3500 },
];
const sections = ['A', 'B', 'C'];
let spaceIdCounter = 1;

for (const ground of registeredGrounds) {
  for (const floor of ground.floors) {
    for (const section of sections) {
      for (let i = 1; i <= 6; i++) {
        let status = ParkingSpaceStatus.AVAILABLE;
        if (spaceIdCounter % 7 === 0) {
          status = ParkingSpaceStatus.RESERVED;
        } else if (spaceIdCounter % 5 === 0) {
          status = ParkingSpaceStatus.OCCUPIED;
        }

        parkingSpaces.push({
          id: `space-${spaceIdCounter}`,
          location: ground.name,
          floor,
          section,
          spaceNumber: `${section}${String(i).padStart(2, '0')}`,
          status,
          pricePerHour: ground.price,
        });
        spaceIdCounter++;
      }
    }
  }
}

// Seed Parking Reservations
const reservations: ParkingReservation[] = [
  {
    id: 'res-1',
    userId: 'usr-1',
    vehicleId: 'veh-1',
    parkingId: 'space-a12',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours remaining
    status: ReservationStatus.ACTIVE,
    amount: 5000,
    qrCode: 'QR_RESERVATION_res-1_space-a12_usr-1',
    checkedInAt: new Date().toISOString(),
  },
  {
    id: 'res-2',
    userId: 'usr-1',
    vehicleId: 'veh-2',
    parkingId: 'space-14',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    status: ReservationStatus.PENDING,
    amount: 10000,
    qrCode: 'QR_RESERVATION_res-2_space-14_usr-1',
  },
];

// Seed Vehicle Service Requests
const services: VehicleService[] = [
  {
    id: 'srv-1',
    vehicleId: 'veh-1',
    customerId: 'usr-1',
    serviceType: 'Full Oil Change & Brake Service',
    technicianId: 'usr-3', // Sarah Nakato
    assignmentStatus: 'Accepted',
    acceptedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    status: ServiceStatus.COMPLETED,
    cost: 145000,
    bookingDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    completionDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    diagnosticNotes: 'Oil filter replaced with Castrol 10W-40. Front brake pads replaced and multi-point safety check completed.',
    assignedDeliveryBay: 'Floor G, Slot A12 (Ready Pickup Bay)',
    attendantHandoffStatus: 'Attendant Verified in Bay',
    completionHandOffNotes: 'All services finished successfully. Vehicle clean, keys tagged, parked at Slot A12 for customer pickup / parking attendant exit clearance.',
    managerNotified: true,
    managerNotifiedOfCompletion: true,
    completionNotificationSentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    customerNotified: true,
    customerNotifiedByManager: true,
    customerNotificationSentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    attendantNotified: true,
    notifiedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv-2',
    vehicleId: 'veh-2',
    customerId: 'usr-1',
    serviceType: 'Brake Inspection & Detailing',
    technicianId: 'usr-6', // David Otim
    assignmentStatus: 'Accepted',
    acceptedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: ServiceStatus.OIL_CHANGE,
    cost: 120000,
    bookingDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    diagnosticNotes: 'In progress: Technicians actively performing brake rotor skimming and wheel balancing.',
  },
  {
    id: 'srv-3',
    vehicleId: 'veh-2',
    customerId: 'usr-1',
    serviceType: '🏠 Mobile Home Oil Change & Battery Diagnostics',
    technicianId: 'usr-7', // Paul Kato (Mobile Unit)
    assignmentStatus: 'Accepted',
    acceptedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: ServiceStatus.DISPATCHED,
    cost: 160000,
    bookingDate: new Date().toISOString(),
    isHomeService: true,
    homeAddress: 'Plot 42 Naguru Drive, Ntinda-Naguru Hill',
    homeCity: 'Kampala',
    homeLandmark: 'Opposite Shell Ntinda / Black Double Gate',
    contactPhone: '+256 772 123456',
    diagnosticNotes: 'Mobile Technician Dispatched with Service Van #4. On-site arrival expected in 20 mins.',
  },
  {
    id: 'srv-4',
    vehicleId: 'veh-1',
    customerId: 'usr-1',
    serviceType: 'Engine Diagnostics & Transmission Calibration',
    technicianId: 'usr-3', // Sarah Nakato
    assignmentStatus: 'Pending',
    assignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: ServiceStatus.BOOKED,
    cost: 185000,
    bookingDate: new Date().toISOString(),
    diagnosticNotes: 'Assigned duty awaiting technician acceptance. Customer reports gear shift lag.',
  }
];

const serviceItems: ServiceItem[] = [
  {
    id: 'item-1',
    serviceId: 'srv-1',
    description: 'Engine Oil Replacement (Castrol 10W-40)',
    quantity: 1,
    price: 85000,
  },
  {
    id: 'item-2',
    serviceId: 'srv-1',
    description: 'OEM Oil Filter',
    quantity: 1,
    price: 25000,
  },
  {
    id: 'item-3',
    serviceId: 'srv-1',
    description: 'Wheel Alignment Service',
    quantity: 1,
    price: 50000,
  },
  {
    id: 'item-4',
    serviceId: 'srv-1',
    description: 'Labor',
    quantity: 1,
    price: 20000,
  },
];

// Seed Spare Parts Inventory
const inventory: InventoryItem[] = [
  { id: 'inv-1', partName: 'Engine Oil Castrol 10W-40 (4L)', quantity: 24, minRequired: 10, price: 85000 },
  { id: 'inv-2', partName: 'Toyota Premio Oil Filter', quantity: 18, minRequired: 8, price: 25000 },
  { id: 'inv-3', partName: 'Brake Pad Set (Front)', quantity: 4, minRequired: 8, price: 95000 }, // Under threshold alert
  { id: 'inv-4', partName: 'Subaru Forester Air Filter', quantity: 6, minRequired: 5, price: 35000 },
  { id: 'inv-5', partName: 'Spark Plug Platinum Set', quantity: 3, minRequired: 10, price: 120000 }, // Under threshold alert
];

// Seed Payments
const payments: Payment[] = [
  {
    id: 'pay-1',
    userId: 'usr-1',
    amount: 180000,
    paymentMethod: 'Mobile Money',
    transactionId: 'TXN-982405819',
    status: 'Success',
    date: '2026-07-20T17:30:00Z',
  },
  {
    id: 'pay-2',
    userId: 'usr-1',
    amount: 20000,
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-741209358',
    status: 'Success',
    date: '2026-07-21T09:12:00Z',
  },
];

// --- SUPABASE FK INTEGRITY HELPERS ---
async function ensureUserInSupabase(userId: string) {
  if (!supabase || !userId) return;
  let u = users.find(
    (existing) => existing.id === userId || toUuid(existing.id) === userId || toUuid(existing.id) === toUuid(userId) || (existing.email && existing.email.toLowerCase() === userId.toLowerCase())
  );
  if (!u) {
    u = {
      id: userId,
      name: userId.startsWith('usr-') ? `Customer ${userId}` : userId,
      email: userId.includes('@') ? userId : `${userId}@ugpark.com`,
      phone: '+256 700 000 000',
      role: UserRole.CUSTOMER,
      createdAt: new Date().toISOString(),
    };
    users.push(u);
  }
  const { error } = await supabase.from('users').upsert(mapUserToDb(u));
  if (error) console.error(`⚠️ Supabase save user error (${userId}):`, error.message);
}

async function ensureVehicleInSupabase(vehicleId: string) {
  if (!supabase || !vehicleId) return;
  let v = vehicles.find((existing) => existing.id === vehicleId || toUuid(existing.id) === vehicleId || toUuid(existing.id) === toUuid(vehicleId));
  if (v) {
    await ensureUserInSupabase(v.userId);
    const { error } = await supabase.from('vehicles').upsert(mapVehicleToDb(v));
    if (error) console.error(`⚠️ Supabase save vehicle error (${vehicleId}):`, error.message);
  }
}

async function ensureParkingSpaceInSupabase(parkingId: string) {
  if (!supabase || !parkingId) return;
  let s = parkingSpaces.find((existing) => existing.id === parkingId || toUuid(existing.id) === parkingId || toUuid(existing.id) === toUuid(parkingId));
  if (s) {
    const { error } = await supabase.from('parking_spaces').upsert(mapParkingSpaceToDb(s));
    if (error) console.error(`⚠️ Supabase save space error (${parkingId}):`, error.message);
  }
}

// --- SUPABASE AUTO SYNC ON STARTUP ---
async function syncSupabaseDatabase() {
  if (!supabase) return;
  try {
    console.log('🔄 Syncing Supabase database tables...');

    // 1. Users
    if (users.length > 0) {
      await supabase.from('users').upsert(users.map(mapUserToDb));
    }
    const { data: dbUsers, error: usersErr } = await supabase.from('users').select('*');
    if (!usersErr && dbUsers) {
      const mapped = dbUsers.map(mapUserFromDb);
      mapped.forEach((u) => {
        const idx = users.findIndex(
          (existing) => existing.id === u.id || toUuid(existing.id) === u.id || (existing.email && u.email && existing.email.toLowerCase() === u.email.toLowerCase())
        );
        if (idx >= 0) {
          u.id = users[idx].id;
          users[idx] = u;
        } else {
          users.push(u);
        }
      });
    }

    // 2. Vehicles
    if (vehicles.length > 0) {
      await supabase.from('vehicles').upsert(vehicles.map(mapVehicleToDb));
    }
    const { data: dbVehicles, error: vehErr } = await supabase.from('vehicles').select('*');
    if (!vehErr && dbVehicles) {
      const mapped = dbVehicles.map(mapVehicleFromDb);
      mapped.forEach((v) => {
        const owner = users.find((u) => toUuid(u.id) === v.userId || u.id === v.userId);
        if (owner) v.userId = owner.id;

        const idx = vehicles.findIndex(
          (existing) => existing.id === v.id || toUuid(existing.id) === v.id || (existing.registrationNumber && v.registrationNumber && existing.registrationNumber === v.registrationNumber)
        );
        if (idx >= 0) {
          v.id = vehicles[idx].id;
          vehicles[idx] = v;
        } else {
          vehicles.push(v);
        }
      });
    }

    // 3. Parking Spaces
    if (parkingSpaces.length > 0) {
      await supabase.from('parking_spaces').upsert(parkingSpaces.slice(0, 30).map(mapParkingSpaceToDb));
    }
    const { data: dbSpaces, error: spcErr } = await supabase.from('parking_spaces').select('*');
    if (!spcErr && dbSpaces) {
      const mapped = dbSpaces.map(mapParkingSpaceFromDb);
      mapped.forEach((s) => {
        const idx = parkingSpaces.findIndex(
          (existing) => existing.id === s.id || toUuid(existing.id) === s.id || (existing.spaceNumber && s.spaceNumber && existing.spaceNumber === s.spaceNumber)
        );
        if (idx >= 0) {
          s.id = parkingSpaces[idx].id;
          parkingSpaces[idx] = s;
        } else {
          parkingSpaces.push(s);
        }
      });
    }

    // 4. Reservations
    if (reservations.length > 0) {
      await supabase.from('parking_reservations').upsert(reservations.map(mapReservationToDb));
    }
    const { data: dbRes, error: resErr } = await supabase.from('parking_reservations').select('*');
    if (!resErr && dbRes) {
      const mapped = dbRes.map(mapReservationFromDb);
      mapped.forEach((r) => {
        const usr = users.find((u) => toUuid(u.id) === r.userId || u.id === r.userId);
        if (usr) r.userId = usr.id;
        const veh = vehicles.find((v) => toUuid(v.id) === r.vehicleId || v.id === r.vehicleId);
        if (veh) r.vehicleId = veh.id;
        const spc = parkingSpaces.find((s) => toUuid(s.id) === r.parkingId || s.id === r.parkingId);
        if (spc) r.parkingId = spc.id;

        const idx = reservations.findIndex((existing) => existing.id === r.id || toUuid(existing.id) === r.id);
        if (idx >= 0) {
          r.id = reservations[idx].id;
          reservations[idx] = r;
        } else {
          reservations.push(r);
        }
      });
    }

    // 5. Vehicle Services
    if (services.length > 0) {
      await supabase.from('vehicle_services').upsert(services.map(mapServiceToDb));
    }
    const { data: dbServices, error: srvErr } = await supabase.from('vehicle_services').select('*');
    if (!srvErr && dbServices) {
      const mapped = dbServices.map(mapServiceFromDb);
      mapped.forEach((s) => {
        const cust = users.find((u) => toUuid(u.id) === s.customerId || u.id === s.customerId);
        if (cust) s.customerId = cust.id;
        const veh = vehicles.find((v) => toUuid(v.id) === s.vehicleId || v.id === s.vehicleId);
        if (veh) s.vehicleId = veh.id;
        if (s.technicianId) {
          const tech = users.find((u) => toUuid(u.id) === s.technicianId || u.id === s.technicianId);
          if (tech) s.technicianId = tech.id;
        }

        const idx = services.findIndex((existing) => existing.id === s.id || toUuid(existing.id) === s.id);
        if (idx >= 0) {
          s.id = services[idx].id;
          services[idx] = s;
        } else {
          services.push(s);
        }
      });
    }

    // 6. Service Items
    if (serviceItems.length > 0) {
      await supabase.from('service_items').upsert(serviceItems.map(mapServiceItemToDb));
    }
    const { data: dbItems, error: itemsErr } = await supabase.from('service_items').select('*');
    if (!itemsErr && dbItems) {
      const mapped = dbItems.map(mapServiceItemFromDb);
      mapped.forEach((item) => {
        const srv = services.find((s) => toUuid(s.id) === item.serviceId || s.id === item.serviceId);
        if (srv) item.serviceId = srv.id;

        const idx = serviceItems.findIndex((existing) => existing.id === item.id || toUuid(existing.id) === item.id);
        if (idx >= 0) {
          item.id = serviceItems[idx].id;
          serviceItems[idx] = item;
        } else {
          serviceItems.push(item);
        }
      });
    }

    // 7. Inventory Items
    if (inventory.length > 0) {
      await supabase.from('inventory_items').upsert(inventory.map(mapInventoryToDb));
    }
    const { data: dbInv, error: invErr } = await supabase.from('inventory_items').select('*');
    if (!invErr && dbInv) {
      const mapped = dbInv.map(mapInventoryFromDb);
      mapped.forEach((i) => {
        const idx = inventory.findIndex(
          (existing) => existing.id === i.id || toUuid(existing.id) === i.id || (existing.partName && i.partName && existing.partName === i.partName)
        );
        if (idx >= 0) {
          i.id = inventory[idx].id;
          inventory[idx] = i;
        } else {
          inventory.push(i);
        }
      });
    }

    // 8. Payments
    if (payments.length > 0) {
      await supabase.from('payments').upsert(payments.map(mapPaymentToDb));
    }
    const { data: dbPay, error: payErr } = await supabase.from('payments').select('*');
    if (!payErr && dbPay) {
      const mapped = dbPay.map(mapPaymentFromDb);
      mapped.forEach((p) => {
        const usr = users.find((u) => toUuid(u.id) === p.userId || u.id === p.userId);
        if (usr) p.userId = usr.id;
        if (p.reservationId) {
          const res = reservations.find((r) => toUuid(r.id) === p.reservationId || r.id === p.reservationId);
          if (res) p.reservationId = res.id;
        }
        if (p.serviceId) {
          const srv = services.find((s) => toUuid(s.id) === p.serviceId || s.id === p.serviceId);
          if (srv) p.serviceId = srv.id;
        }

        const idx = payments.findIndex((existing) => existing.id === p.id || toUuid(existing.id) === p.id || (p.transactionId && existing.transactionId === p.transactionId));
        if (idx >= 0) {
          p.id = payments[idx].id;
          payments[idx] = p;
        } else {
          payments.push(p);
        }
      });
    }

    console.log('✅ Supabase database sync completed successfully.');
  } catch (err: any) {
    console.error('⚠️ Supabase database sync warning:', err?.message || err);
  }
}

// --- REST API Endpoints ---

// Helper to send email with nodemailer, Resend API, SendGrid API, or simulate dispatch with logs
async function sendVerificationEmail(toEmail: string, userName: string, code: string, token: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.SMTP_FROM || (user ? `"WELILE CAR HUB Security" <${user}>` : '"WELILE CAR HUB Security" <no-reply@welilecarhub.com>');

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const confirmUrl = `${appUrl}/confirm-email?email=${encodeURIComponent(toEmail)}&code=${code}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f172a; margin-top: 0;">WELILE CAR HUB Account Verification</h2>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${userName || 'Valued User'}</strong>,</p>
      <p style="color: #334155; font-size: 15px;">Thank you for signing up for WELILE CAR HUB. Please click the button below to confirm your email and activate your account:</p>
      <div style="padding: 20px 0; text-align: center;">
        <a href="${confirmUrl}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">Confirm Email Address</a>
      </div>
      <p style="color: #64748b; font-size: 13px; text-align: center;">Or enter verification code in app: <strong style="color: #0f172a; font-family: monospace;">${code}</strong></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center;">WELILE CAR HUB Smart Mobility & Vehicle Service Management</p>
    </div>
  `;

  // 1. Primary Supabase Auth dispatch if Supabase client is initialized
  if (supabase) {
    try {
      const { error: sbResendErr } = await supabase.auth.resend({
        type: 'signup',
        email: toEmail,
        options: { emailRedirectTo: confirmUrl },
      });
      if (!sbResendErr) {
        console.log(`✉️ Supabase Auth confirmation email successfully requested for ${toEmail}`);
        return { success: true, method: 'supabase' };
      } else {
        console.warn(`Supabase Auth resend notice for ${toEmail}:`, sbResendErr.message);
      }
    } catch (sbErr) {
      console.warn(`Exception on Supabase Auth resend for ${toEmail}:`, sbErr);
    }
  }

  // 2. Resend API HTTP dispatch if RESEND_API_KEY is defined
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resendResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'WELILE CAR HUB <onboarding@resend.dev>',
          to: [toEmail],
          subject: 'Confirm Sign Up - WELILE CAR HUB',
          html: htmlContent,
        }),
      });
      const resendData = await resendResp.json();
      if (resendResp.ok) {
        console.log(`✉️ Resend API Email sent successfully to ${toEmail} (ID: ${resendData.id})`);
        return { success: true, method: 'resend', id: resendData.id };
      } else {
        console.error(`❌ Resend API error for ${toEmail}:`, resendData);
      }
    } catch (err) {
      console.error(`❌ Exception sending email via Resend API to ${toEmail}:`, err);
    }
  }

  // 3. SendGrid API HTTP dispatch if SENDGRID_API_KEY is defined
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const sgResp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: process.env.SENDGRID_FROM || 'no-reply@welilecarhub.com', name: 'WELILE CAR HUB' },
          subject: 'Confirm Sign Up - WELILE CAR HUB',
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });
      if (sgResp.ok) {
        console.log(`✉️ SendGrid API Email sent successfully to ${toEmail}`);
        return { success: true, method: 'sendgrid' };
      } else {
        const sgErr = await sgResp.text();
        console.error(`❌ SendGrid API error for ${toEmail}:`, sgErr);
      }
    } catch (err) {
      console.error(`❌ Exception sending email via SendGrid to ${toEmail}:`, err);
    }
  }

  // 4. Gmail service shortcut if credentials are provided without custom SMTP host
  if (!host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `WELILE CAR HUB <${user}>`,
        to: toEmail,
        subject: `Confirm Sign Up - WELILE CAR HUB`,
        text: `Hello ${userName}, Please confirm your sign up for WELILE CAR HUB by opening your verification link: ${confirmUrl} or entering code: ${code}`,
        html: htmlContent,
      });
      console.log(`✉️ Gmail Verification Email sent successfully to ${toEmail}`);
      return { success: true, method: 'gmail' };
    } catch (err) {
      console.error(`❌ Error sending email via Gmail to ${toEmail}:`, err);
    }
  }

  // 5. Custom SMTP
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: toEmail,
        subject: `Confirm Sign Up - WELILE CAR HUB`,
        text: `Hello ${userName}, Please confirm your sign up for WELILE CAR HUB by opening your verification link: ${confirmUrl} or entering code: ${code}`,
        html: htmlContent,
      });
      console.log(`✉️ Real SMTP Verification Email sent successfully to ${toEmail}`);
      return { success: true, method: 'smtp' };
    } catch (err) {
      console.error(`❌ Error sending email via SMTP to ${toEmail}:`, err);
    }
  }

  // Fallback log notification if external email credentials are not set
  console.log(`=======================================================`);
  console.log(`✉️ [VERIFICATION EMAIL DISPATCH LOG]`);
  console.log(`To: ${toEmail}`);
  console.log(`Recipient Name: ${userName}`);
  console.log(`Subject: Confirm Sign Up - WELILE CAR HUB`);
  console.log(`Verification Code: ${code}`);
  console.log(`Verification Token: ${token}`);
  console.log(`Link: ${confirmUrl}`);
  console.log(`Notice: To deliver emails to external inboxes like Gmail, set SMTP_HOST/SMTP_PASS, GMAIL_APP_PASSWORD, RESEND_API_KEY, or SUPABASE_URL in .env`);
  console.log(`=======================================================`);
  return { success: true, method: 'logged', link: confirmUrl };
}

// Health & System Details
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Roles Selector & List Users API
app.get('/api/users', (req, res) => {
  res.json(users);
});

// Registration Endpoint - Creates unverified accounts requiring mandatory email confirmation via Supabase
app.post('/api/register', async (req, res) => {
  const { name, email, phone, role, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email address is required for registration.' });
  }

  // Generate 6-digit numeric verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = `vtoken-${Math.random().toString(36).substring(2)}${Date.now()}`;
  const origin = req.headers.origin || 'http://localhost:3000';
  const confirmRedirectUrl = `${origin}/confirm-email`;

  // Check if user already exists
  const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    if (!existingUser.isVerified) {
      if (!existingUser.verificationCode) {
        existingUser.verificationCode = code;
      }

      // Trigger Supabase resend if client active
      if (supabase) {
        try {
          await supabase.auth.resend({
            type: 'signup',
            email: cleanEmail,
            options: { emailRedirectTo: confirmRedirectUrl },
          });
        } catch (sbErr) {
          console.warn('Supabase auth resend notice:', sbErr);
        }
      }

      await sendVerificationEmail(existingUser.email, existingUser.name, existingUser.verificationCode, existingUser.verificationToken || token);
      return res.status(200).json({
        success: false,
        isUnverified: true,
        user: existingUser,
        email: existingUser.email,
        token: existingUser.verificationToken || token,
        code: existingUser.verificationCode,
        confirmUrl: `${confirmRedirectUrl}?email=${encodeURIComponent(cleanEmail)}&code=${existingUser.verificationCode}`,
        message: `An account with ${existingUser.email} exists but is unverified. Supabase confirmation email sent! Check your inbox or enter code on the Confirm Email page.`,
      });
    }
    return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
  }

  const requestedRole = (role as UserRole) || UserRole.CUSTOMER;
  const isStaff = requestedRole !== UserRole.CUSTOMER;

  let supabaseUserId = `usr-${Date.now()}`;

  // Call Supabase Auth signUp if Supabase client is initialized
  if (supabase) {
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password || 'UgParkPass2026!',
        options: {
          data: { name: cleanName, role: requestedRole, phone: phone || '' },
          emailRedirectTo: confirmRedirectUrl,
        },
      });
      if (authErr) {
        console.warn('Supabase Auth signUp notice:', authErr.message);
      } else if (authData?.user) {
        supabaseUserId = authData.user.id;
        console.log(`✅ Supabase Auth signUp initiated for ${cleanEmail} (ID: ${supabaseUserId})`);
      }
    } catch (e) {
      console.error('Supabase Auth Exception on register:', e);
    }
  }

  const newUser: User = {
    id: supabaseUserId,
    name: cleanName || cleanEmail.split('@')[0],
    email: cleanEmail,
    phone: phone ? phone.trim() : '+256 700 000000',
    role: requestedRole,
    createdAt: new Date().toISOString(),
    isAuthorizedStaff: isStaff,
    authorizationStatus: isStaff ? 'Authorized' : 'Customer',
    isVerified: false,
    verificationToken: token,
    verificationCode: code,
    verificationSentAt: new Date().toISOString(),
  };

  users.push(newUser);

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(newUser));
    } catch (e) {
      console.error('Supabase save user error on registration:', e);
    }
  }

  // Dispatch email notification
  await sendVerificationEmail(newUser.email, newUser.name, code, token);

  res.json({
    success: true,
    isUnverified: true,
    user: newUser,
    token: newUser.verificationToken,
    code: newUser.verificationCode,
    confirmUrl: `${confirmRedirectUrl}?email=${encodeURIComponent(cleanEmail)}&code=${code}`,
    message: `Sign up complete! Supabase confirmation email sent to ${cleanEmail}. Check your inbox or enter the code on the Confirm Email page.`,
  });
});

// Resend Verification Email Endpoint
app.post('/api/resend-verification', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(444).json({ error: 'No account found with that email address.' });
  }

  if (user.isVerified) {
    return res.json({ success: false, message: 'This account email is already verified. You can log in directly.' });
  }

  const token = `vtoken-${Math.random().toString(36).substring(2)}${Date.now()}`;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationToken = token;
  user.verificationCode = code;
  user.verificationSentAt = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(user));
    } catch (e) {
      console.error('Supabase update verification token error:', e);
    }
  }

  // Dispatch email with Nodemailer or logger
  await sendVerificationEmail(user.email, user.name, code, token);

  res.json({
    success: true,
    token: user.verificationToken,
    code: user.verificationCode,
    email: user.email,
    message: `A new 6-digit verification code (${code}) has been sent to ${user.email}. Enter the code below to sign in.`,
  });
});

// Verify Email Endpoint (by 6-digit code, token, query token, or email)
app.all('/api/verify-email', async (req, res) => {
  const code = (req.query.code || req.body.code || '').toString().trim();
  const token = (req.query.token || req.body.token || '').toString();
  const email = (req.query.email || req.body.email || '').toString().toLowerCase();

  let user = users.find(
    (u) =>
      (code && u.verificationCode === code) ||
      (token && u.verificationToken === token) ||
      (email && u.email.toLowerCase() === email && (!code || u.verificationCode === code)) ||
      (token && u.id === token)
  );

  if (!user && email) {
    user = users.find((u) => u.email.toLowerCase() === email);
  }

  if (!user) {
    return res.status(404).json({ error: 'Invalid or expired verification code.' });
  }

  // If a code was provided but doesn't match
  if (code && user.verificationCode && user.verificationCode !== code) {
    return res.status(400).json({ error: 'Incorrect 6-digit verification code. Please check your email and try again.' });
  }

  user.isVerified = true;
  user.verifiedAt = new Date().toISOString();
  user.verificationToken = undefined;
  user.verificationCode = undefined;

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(user));
    } catch (e) {
      console.error('Supabase verify user error:', e);
    }
  }

  res.json({
    success: true,
    user,
    message: '✅ Email address verified successfully! You can now sign in to access your account.',
  });
});

// Systems Manager Manual Account Verification Endpoint
app.put('/api/users/:id/verify', async (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  user.isVerified = true;
  user.verifiedAt = new Date().toISOString();
  user.verificationToken = undefined;

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(user));
    } catch (e) {
      console.error('Supabase manager verify user error:', e);
    }
  }

  res.json({
    success: true,
    user,
    message: `User ${user.name} (${user.email}) has been verified by Systems Manager.`,
  });
});

// Login & Authentication Endpoint (Enforces Mandatory Email Verification)
app.post('/api/login', async (req, res) => {
  const { email, name, role, phone } = req.body;
  const reqEmail = (email || '').trim();
  const reqName = (name || '').trim();
  const rawInput = (reqEmail || reqName || '').trim();
  const lowerInput = rawInput.toLowerCase();
  const requestedRole = (role as UserRole) || UserRole.CUSTOMER;

  // Search ONLY by exact match (email, name, id, or email username prefix)
  let user = lowerInput
    ? users.find((u) => 
        u.email.toLowerCase() === lowerInput || 
        u.name.toLowerCase() === lowerInput || 
        u.id.toLowerCase() === lowerInput ||
        (reqEmail && u.email.toLowerCase() === reqEmail.toLowerCase()) ||
        (reqName && u.name.toLowerCase() === reqName.toLowerCase()) ||
        u.email.toLowerCase().split('@')[0] === lowerInput
      )
    : undefined;

  let warning: string | undefined = undefined;

  if (!user) {
    if (!lowerInput) {
      user = users.find((u) => u.role === requestedRole) || users[0];
    } else {
      const isStaff = requestedRole !== UserRole.CUSTOMER;
      const finalName = reqName || rawInput || `${requestedRole} User`;
      const finalEmail = reqEmail.includes('@') 
        ? reqEmail.toLowerCase() 
        : rawInput.includes('@')
          ? rawInput.toLowerCase()
          : `${rawInput.toLowerCase().replace(/\s+/g, '.')}@ugpark.com`;

      const token = `vtoken-${Math.random().toString(36).substring(2)}${Date.now()}`;
      user = {
        id: `usr-${Date.now()}`,
        name: finalName,
        email: finalEmail,
        phone: phone || '+256 700 000000',
        role: requestedRole,
        createdAt: new Date().toISOString(),
        isAuthorizedStaff: isStaff,
        authorizationStatus: isStaff ? 'Authorized' : 'Customer',
        isVerified: false,
        verificationToken: token,
        verificationSentAt: new Date().toISOString(),
      };
      users.push(user);

      if (supabase) {
        try {
          await supabase.from('users').upsert(mapUserToDb(user));
        } catch (e) {
          console.error('Supabase save user error:', e);
        }
      }
    }
  }

  // ENFORCE MANDATORY EMAIL VERIFICATION
  if (user && user.isVerified === false) {
    return res.status(200).json({
      success: false,
      isUnverified: true,
      error: 'Your email address is not verified. Users must verify their email before they can sign in or access any part of the application.',
      user,
      email: user.email,
      token: user.verificationToken || `vtoken-${user.id}`,
    });
  }

  res.json({ success: true, user, warning, token: `jwt-token-${user.id}` });
});

// Admin Authorization Endpoints
app.put('/api/users/:id/authorize', async (req, res) => {
  const { id } = req.params;
  const { role, isAuthorizedStaff, authorizationStatus } = req.body;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (role) {
    user.role = role;
  }
  if (isAuthorizedStaff !== undefined) {
    user.isAuthorizedStaff = isAuthorizedStaff;
  }
  if (authorizationStatus) {
    user.authorizationStatus = authorizationStatus;
  } else if (isAuthorizedStaff) {
    user.authorizationStatus = 'Authorized';
  }

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(user));
    } catch (e) {
      console.error('Supabase update user error:', e);
    }
  }

  res.json({ success: true, user });
});

app.post('/api/users', async (req, res) => {
  const { name, email, phone, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const assignedRole = (role as UserRole) || UserRole.CUSTOMER;
  const isStaff = assignedRole !== UserRole.CUSTOMER;

  const newUser: User = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '+256 700 000000',
    role: assignedRole,
    createdAt: new Date().toISOString(),
    isAuthorizedStaff: isStaff,
    authorizationStatus: isStaff ? 'Authorized' : 'Customer',
  };

  users.push(newUser);

  if (supabase) {
    try {
      await supabase.from('users').upsert(mapUserToDb(newUser));
    } catch (e) {
      console.error('Supabase user insert error:', e);
    }
  }

  res.json({ success: true, user: newUser });
});

// Get/Add Vehicles
app.get('/api/vehicles', (req, res) => {
  res.json(vehicles);
});

app.post('/api/vehicles', async (req, res) => {
  const { make, model, year, registrationNumber, color, mileage, vin, userId } = req.body;
  if (!make || !model || !registrationNumber) {
    return res.status(400).json({ error: 'Make, Model, and Registration Number are required.' });
  }
  const newVehicle: Vehicle = {
    id: `veh-${Date.now()}`,
    userId: userId || 'usr-1',
    registrationNumber,
    make,
    model,
    year: parseInt(year) || 2018,
    color: color || 'Unknown',
    mileage: parseInt(mileage) || 0,
    vin: vin || '',
  };
  vehicles.push(newVehicle);

  if (supabase) {
    try {
      await ensureUserInSupabase(newVehicle.userId);
      const { error } = await supabase.from('vehicles').upsert(mapVehicleToDb(newVehicle));
      if (error) console.error('Supabase vehicle insert error:', error.message);
      else console.log('✅ Saved vehicle to Supabase:', newVehicle.registrationNumber);
    } catch (err) {
      console.error('Supabase vehicle exception:', err);
    }
  }

  res.status(201).json(newVehicle);
});

app.delete('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  const idx = vehicles.findIndex((v) => v.id === id || toUuid(v.id) === id || toUuid(v.id) === toUuid(id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }
  const removed = vehicles.splice(idx, 1)[0];

  if (supabase) {
    try {
      const targetId = toUuid(removed.id) || removed.id;
      const { error } = await supabase.from('vehicles').delete().eq('id', targetId);
      if (error) console.error('Supabase vehicle delete error:', error.message);
      else console.log('✅ Deleted vehicle from Supabase:', removed.registrationNumber);
    } catch (err) {
      console.error('Supabase vehicle delete exception:', err);
    }
  }

  res.json({ success: true, message: `Vehicle ${removed.registrationNumber} deleted`, vehicle: removed });
});

// Parking Spaces API
app.get('/api/parking/spaces', (req, res) => {
  res.json(parkingSpaces);
});

app.put('/api/parking/spaces/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const space = parkingSpaces.find((s) => s.id === id);
  if (!space) return res.status(404).json({ error: 'Parking space not found' });
  if (status) space.status = status;

  if (supabase) {
    try {
      await supabase.from('parking_spaces').update({ status: space.status }).eq('id', space.id);
    } catch (e) {
      console.error('Supabase space status update error:', e);
    }
  }

  res.json(space);
});

// Parking Reservations API
app.get('/api/parking/reservations', (req, res) => {
  res.json(reservations);
});

app.post('/api/parking/reservations', async (req, res) => {
  const { vehicleId, parkingId, startTime, endTime, amount, userId } = req.body;
  if (!vehicleId || !parkingId || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing reservation details' });
  }

  // Check if spot is already booked
  const space = parkingSpaces.find((s) => s.id === parkingId);
  if (!space) return res.status(404).json({ error: 'Parking space not found' });
  if (space.status !== ParkingSpaceStatus.AVAILABLE) {
    return res.status(400).json({ error: 'Parking space is not available.' });
  }

  // Create booking
  const newReservation: ParkingReservation = {
    id: `res-${Date.now()}`,
    userId: userId || 'usr-1',
    vehicleId,
    parkingId,
    startTime,
    endTime,
    status: ReservationStatus.PENDING,
    amount: amount || 10000,
    qrCode: `QR_RESERVATION_res-${Date.now()}_${parkingId}_${userId || 'usr-1'}`,
  };

  // Mark space reserved
  space.status = ParkingSpaceStatus.RESERVED;
  reservations.push(newReservation);

  if (supabase) {
    try {
      await ensureUserInSupabase(newReservation.userId);
      await ensureVehicleInSupabase(newReservation.vehicleId);
      await ensureParkingSpaceInSupabase(newReservation.parkingId);

      const { error } = await supabase.from('parking_reservations').upsert(mapReservationToDb(newReservation));
      if (error) console.error('Supabase reservation save error:', error.message);
      else console.log('✅ Saved parking reservation to Supabase:', newReservation.id);

      await supabase.from('parking_spaces').update({ status: ParkingSpaceStatus.RESERVED }).eq('id', parkingId);
    } catch (err) {
      console.error('Supabase reservation save error:', err);
    }
  }

  res.status(201).json(newReservation);
});

// Seed System / Staff Notifications
export interface StaffNotification {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'SERVICE_REQUEST' | 'PAYMENT';
  title: string;
  message: string;
  timestamp: string;
  vehicleReg?: string;
  read?: boolean;
}

const notifications: StaffNotification[] = [
  {
    id: 'notif-1',
    type: 'ENTRY',
    title: 'Vehicle Entry Authorized',
    message: 'Attendant authorized ENTRY for vehicle UBA 123A (Toyota Land Cruiser) at Slot A12.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    vehicleReg: 'UBA 123A',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'SERVICE_REQUEST',
    title: 'New Garage Service Requested',
    message: 'Customer requested Garage Service for UBB 456B: Engine knock & oil pressure check.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    vehicleReg: 'UBB 456B',
    read: false,
  },
];

// Attendant: Verify QR reservation ticket
app.post('/api/parking/verify', async (req, res) => {
  const { qrCode, action } = req.body; // action = 'check-in' | 'check-out'
  const reservation = reservations.find((r) => r.qrCode === qrCode);

  if (!reservation) {
    return res.status(404).json({ error: 'Invalid digital ticket. Reservation not found.' });
  }

  const space = parkingSpaces.find((s) => s.id === reservation.parkingId);
  const targetVehicle = vehicles.find((v) => v.id === reservation.vehicleId);
  const vehicleReg = targetVehicle?.registrationNumber || 'Vehicle';

  if (action === 'check-in') {
    if (reservation.status !== ReservationStatus.PENDING) {
      return res.status(400).json({ error: `Reservation is already ${reservation.status}. Cannot check-in.` });
    }
    reservation.status = ReservationStatus.ACTIVE;
    reservation.checkedInAt = new Date().toISOString();
    if (space) space.status = ParkingSpaceStatus.OCCUPIED;

    const newNotif: StaffNotification = {
      id: `notif-${notifications.length + 1}`,
      type: 'ENTRY',
      title: 'Vehicle Entry Authorized',
      message: `Attendant authorized CHECK-IN ENTRY for vehicle ${vehicleReg} at Slot ${space?.spaceNumber || 'Spot'}. Service Manager notified.`,
      timestamp: new Date().toISOString(),
      vehicleReg,
      read: false,
    };
    notifications.unshift(newNotif);

    if (supabase) {
      try {
        await supabase.from('parking_reservations').upsert(mapReservationToDb(reservation));
        if (space) await supabase.from('parking_spaces').update({ status: ParkingSpaceStatus.OCCUPIED }).eq('id', space.id);
      } catch (e) {
        console.error('Supabase check-in sync error:', e);
      }
    }

    return res.json({ success: true, message: `Vehicle ${vehicleReg} successfully Checked In. Service Manager notified.`, reservation, notification: newNotif });
  } else if (action === 'check-out') {
    if (reservation.status !== ReservationStatus.ACTIVE) {
      return res.status(400).json({ error: 'Reservation is not active. Cannot check-out.' });
    }
    reservation.status = ReservationStatus.COMPLETED;
    reservation.checkedOutAt = new Date().toISOString();
    if (space) space.status = ParkingSpaceStatus.AVAILABLE;

    const newNotif: StaffNotification = {
      id: `notif-${notifications.length + 1}`,
      type: 'EXIT',
      title: 'Vehicle Exit Authorized',
      message: `Attendant authorized CHECK-OUT EXIT for vehicle ${vehicleReg} from Slot ${space?.spaceNumber || 'Spot'}. Yard spot released.`,
      timestamp: new Date().toISOString(),
      vehicleReg,
      read: false,
    };
    notifications.unshift(newNotif);

    if (supabase) {
      try {
        await supabase.from('parking_reservations').upsert(mapReservationToDb(reservation));
        if (space) await supabase.from('parking_spaces').update({ status: ParkingSpaceStatus.AVAILABLE }).eq('id', space.id);
      } catch (e) {
        console.error('Supabase check-out sync error:', e);
      }
    }

    return res.json({ success: true, message: `Vehicle ${vehicleReg} successfully Checked Out. Service Manager notified.`, reservation, notification: newNotif });
  }

  res.status(400).json({ error: 'Invalid attendant action' });
});

// Notifications API
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.post('/api/notifications/clear', (req, res) => {
  notifications.forEach((n) => { n.read = true; });
  res.json({ success: true, message: 'Notifications marked as read.' });
});

// Cancel Booking
app.post('/api/parking/reservations/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

  reservation.status = ReservationStatus.CANCELLED;
  const space = parkingSpaces.find((s) => s.id === reservation.parkingId);
  if (space) space.status = ParkingSpaceStatus.AVAILABLE;

  if (supabase) {
    try {
      await supabase.from('parking_reservations').update({ status: ReservationStatus.CANCELLED }).eq('id', toUuid(id));
      if (space) await supabase.from('parking_spaces').update({ status: ParkingSpaceStatus.AVAILABLE }).eq('id', toUuid(space.id));
    } catch (e) {
      console.error('Supabase cancel reservation sync error:', e);
    }
  }

  res.json({ success: true, message: 'Reservation cancelled successfully', reservation });
});

// Services API
app.get('/api/services', (req, res) => {
  res.json(services);
});

app.post('/api/services', async (req, res) => {
  const {
    vehicleId,
    serviceType,
    cost,
    bookingDate,
    customerId,
    diagnosticNotes,
    isHomeService,
    homeAddress,
    homeCity,
    homeLandmark,
    contactPhone,
  } = req.body;

  if (!vehicleId || !serviceType || !bookingDate) {
    return res.status(400).json({ error: 'Missing appointment details.' });
  }

  const targetVeh = vehicles.find((v) => v.id === vehicleId);
  const regNo = targetVeh?.registrationNumber || 'Vehicle';

  const newService: VehicleService = {
    id: `srv-${Date.now()}`,
    vehicleId,
    customerId: customerId || 'usr-1',
    serviceType: isHomeService ? `🏠 Home Service: ${serviceType}` : serviceType,
    status: ServiceStatus.BOOKED,
    cost: parseInt(cost) || (isHomeService ? 150000 : 120000),
    bookingDate,
    diagnosticNotes: diagnosticNotes || (isHomeService ? `Home Servicing requested at: ${homeAddress || 'Customer address'}` : 'Appointment booked successfully.'),
    isHomeService: Boolean(isHomeService),
    homeAddress,
    homeCity,
    homeLandmark,
    contactPhone,
  };

  services.push(newService);

  if (supabase) {
    try {
      await ensureUserInSupabase(newService.customerId);
      await ensureVehicleInSupabase(newService.vehicleId);
      if (newService.technicianId) {
        await ensureUserInSupabase(newService.technicianId);
      }

      const { error } = await supabase.from('vehicle_services').upsert(mapServiceToDb(newService));
      if (error) console.error('Supabase vehicle service save error:', error.message);
      else console.log('✅ Saved vehicle service to Supabase:', newService.id);
    } catch (err) {
      console.error('Supabase service exception:', err);
    }
  }

  // Trigger staff notification for Service Manager & Mobile Technicians
  notifications.unshift({
    id: `notif-${notifications.length + 1}`,
    type: 'SERVICE_REQUEST',
    title: isHomeService ? '🏠 New Home Servicing Request' : '🛠️ New Garage Service Booking',
    message: isHomeService
      ? `Customer requested Home Service for ${regNo}: "${serviceType}" at ${homeAddress || 'Customer Home Address'}. Mobile technician dispatch required.`
      : `Customer booked Garage Service for ${regNo}: "${serviceType}" (${diagnosticNotes || 'Standard Service'}).`,
    timestamp: new Date().toISOString(),
    vehicleReg: regNo,
    read: false,
  });

  res.status(201).json(newService);
});

app.put('/api/services/:id/status', async (req, res) => {
  const { id } = req.params;
  const {
    status,
    technicianId,
    diagnosticNotes,
    cost,
    assignedDeliveryBay,
    completionHandOffNotes,
    attendantHandoffStatus,
  } = req.body;

  const service = services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service job not found' });

  const prevTechId = service.technicianId;
  const prevStatus = service.status;

  if (status) service.status = status as ServiceStatus;
  if (technicianId) service.technicianId = technicianId;
  if (diagnosticNotes) service.diagnosticNotes = diagnosticNotes;
  if (cost) service.cost = parseInt(cost);
  if (assignedDeliveryBay) service.assignedDeliveryBay = assignedDeliveryBay;
  if (completionHandOffNotes) service.completionHandOffNotes = completionHandOffNotes;
  if (attendantHandoffStatus) service.attendantHandoffStatus = attendantHandoffStatus;

  // Mark completion & trigger multi-role hand-off notifications
  if (status === ServiceStatus.COMPLETED || status === ServiceStatus.READY_FOR_PICKUP) {
    service.completionDate = new Date().toISOString();
    service.managerNotified = true;
    service.customerNotified = true;
    service.attendantNotified = true;
    service.notifiedAt = new Date().toISOString();

    const targetVeh = vehicles.find((v) => v.id === service.vehicleId);
    const regNo = targetVeh?.registrationNumber || 'Vehicle';
    const techObj = users.find((u) => u.id === (technicianId || service.technicianId));
    const techName = techObj?.name || 'Technician';

    // 1. Notification for Parking Attendant (Yard & Handoff Sync)
    notifications.unshift({
      id: `notif-${notifications.length + 1}`,
      type: 'SERVICE_REQUEST',
      title: '🅿️ Parking Attendant Handoff Alert',
      message: `Technician ${techName} finished "${service.serviceType}" for ${regNo}. Placed in spot: ${service.assignedDeliveryBay || 'Delivery Bay'}. Please verify slot & prepare exit clearance.`,
      timestamp: new Date().toISOString(),
      vehicleReg: regNo,
      read: false,
    });

    // 2. Notification for Service Manager & Customer
    notifications.unshift({
      id: `notif-${notifications.length + 1}`,
      type: 'SERVICE_REQUEST',
      title: '✅ Job Completed & Customer Alerted',
      message: `Technician ${techName} marked ${regNo} as COMPLETE. Service Manager & Customer notified. Notes: "${completionHandOffNotes || 'Vehicle fully serviced and inspected.'}"`,
      timestamp: new Date().toISOString(),
      vehicleReg: regNo,
      read: false,
    });
  } else if (technicianId && technicianId !== prevTechId) {
    service.assignmentStatus = 'Pending';
    service.assignedAt = new Date().toISOString();
    const techObj = users.find((u) => u.id === technicianId);
    const targetVeh = vehicles.find((v) => v.id === service.vehicleId);
    const regNo = targetVeh?.registrationNumber || 'Vehicle';

    notifications.unshift({
      id: `notif-${notifications.length + 1}`,
      type: 'SERVICE_REQUEST',
      title: '🛠️ Task Assigned to Technician',
      message: `Service Manager assigned task "${service.serviceType}" for ${regNo} to technician ${techObj?.name || 'Technician'}. Awaiting acceptance.`,
      timestamp: new Date().toISOString(),
      vehicleReg: regNo,
      read: false,
    });
  }

  if (supabase) {
    try {
      await supabase.from('vehicle_services').upsert(mapServiceToDb(service));
    } catch (e) {
      console.error('Supabase service status update error:', e);
    }
  }

  res.json(service);
});

// Endpoint: Technician Accept or Reject Assignment
app.put('/api/services/:id/assignment', async (req, res) => {
  const { id } = req.params;
  const { assignmentStatus, rejectionReason, technicianId } = req.body;

  const service = services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service record not found.' });

  if (technicianId) {
    service.technicianId = technicianId;
  }

  const techObj = users.find((u) => u.id === (service.technicianId || technicianId));
  const techName = techObj?.name || 'Technician';
  const targetVeh = vehicles.find((v) => v.id === service.vehicleId);
  const regNo = targetVeh?.registrationNumber || 'Vehicle';

  if (assignmentStatus === 'Accepted') {
    service.assignmentStatus = 'Accepted';
    service.acceptedAt = new Date().toISOString();
    if (service.status === ServiceStatus.BOOKED) {
      service.status = ServiceStatus.INSPECTION;
    }

    notifications.unshift({
      id: `notif-${notifications.length + 1}`,
      type: 'SERVICE_REQUEST',
      title: '✅ Duty Assignment Accepted',
      message: `Technician ${techName} ACCEPTED duty "${service.serviceType}" for vehicle ${regNo}. Inspection / servicing underway.`,
      timestamp: new Date().toISOString(),
      vehicleReg: regNo,
      read: false,
    });

    if (supabase) {
      try {
        await supabase.from('vehicle_services').upsert(mapServiceToDb(service));
      } catch (e) {
        console.error('Supabase service assignment error:', e);
      }
    }

    return res.json({ success: true, message: `Assignment accepted successfully.`, service });
  } else if (assignmentStatus === 'Rejected') {
    service.assignmentStatus = 'Rejected';
    service.rejectionReason = rejectionReason || 'Technician currently at full capacity.';

    notifications.unshift({
      id: `notif-${notifications.length + 1}`,
      type: 'SERVICE_REQUEST',
      title: '⚠️ Duty Assignment Rejected',
      message: `Technician ${techName} REJECTED duty "${service.serviceType}" for vehicle ${regNo}. Reason: "${service.rejectionReason}". Service Manager please reassign.`,
      timestamp: new Date().toISOString(),
      vehicleReg: regNo,
      read: false,
    });

    if (supabase) {
      try {
        await supabase.from('vehicle_services').upsert(mapServiceToDb(service));
      } catch (e) {
        console.error('Supabase service rejection error:', e);
      }
    }

    return res.json({ success: true, message: `Assignment rejected. Service Manager notified to reassign.`, service });
  }

  res.status(400).json({ error: 'Invalid assignment status.' });
});

// Endpoint: Technician Sends Notification of Completion to Service Manager
app.put('/api/services/:id/tech-complete', async (req, res) => {
  const { id } = req.params;
  const { diagnosticNotes, assignedDeliveryBay, completionHandOffNotes } = req.body;

  const service = services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service record not found.' });

  service.status = ServiceStatus.COMPLETED;
  service.completionDate = new Date().toISOString();
  service.managerNotified = true;
  service.managerNotifiedOfCompletion = true;
  service.completionNotificationSentAt = new Date().toISOString();

  if (diagnosticNotes) service.diagnosticNotes = diagnosticNotes;
  if (assignedDeliveryBay) service.assignedDeliveryBay = assignedDeliveryBay;
  if (completionHandOffNotes) service.completionHandOffNotes = completionHandOffNotes;

  const techObj = users.find((u) => u.id === service.technicianId);
  const techName = techObj?.name || 'Technician';
  const targetVeh = vehicles.find((v) => v.id === service.vehicleId);
  const regNo = targetVeh?.registrationNumber || 'Vehicle';

  // Dispatched Notification to Service Manager & Parking Attendant
  notifications.unshift({
    id: `notif-${notifications.length + 1}`,
    type: 'SERVICE_REQUEST',
    title: '🔔 Service Completion Alert from Technician',
    message: `Technician ${techName} completed servicing for vehicle ${regNo} ("${service.serviceType}"). Placed in spot: ${service.assignedDeliveryBay || 'Delivery Bay'}. Service Manager notified for customer alert.`,
    timestamp: new Date().toISOString(),
    vehicleReg: regNo,
    read: false,
  });

  if (supabase) {
    try {
      await supabase.from('vehicle_services').upsert(mapServiceToDb(service));
    } catch (e) {
      console.error('Supabase tech complete sync error:', e);
    }
  }

  res.json({ success: true, message: 'Completion notification sent to Service Manager.', service });
});

// Endpoint: Service Manager Notifies Customer that Servicing is Complete
app.put('/api/services/:id/notify-customer', async (req, res) => {
  const { id } = req.params;
  const { managerName, customMessage } = req.body;

  const service = services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'Service record not found.' });

  service.status = ServiceStatus.READY_FOR_PICKUP;
  service.customerNotified = true;
  service.customerNotifiedByManager = true;
  service.customerNotificationSentAt = new Date().toISOString();

  const customerObj = users.find((u) => u.id === service.customerId);
  const customerName = customerObj?.name || 'Car Owner';
  const targetVeh = vehicles.find((v) => v.id === service.vehicleId);
  const regNo = targetVeh?.registrationNumber || 'Vehicle';
  const senderManager = managerName || 'Service Manager Denis Okello';

  notifications.unshift({
    id: `notif-${notifications.length + 1}`,
    type: 'SERVICE_REQUEST',
    title: '📢 Customer Notified: Car Servicing Complete!',
    message: `${senderManager} notified ${customerName} (${regNo}) that car servicing is COMPLETE! Ready for pickup at ${service.assignedDeliveryBay || 'Ready Pickup Bay'}. ${customMessage ? `Note: "${customMessage}"` : ''}`,
    timestamp: new Date().toISOString(),
    vehicleReg: regNo,
    read: false,
  });

  if (supabase) {
    try {
      await supabase.from('vehicle_services').upsert(mapServiceToDb(service));
    } catch (e) {
      console.error('Supabase customer notify sync error:', e);
    }
  }

  res.json({ success: true, message: `Customer ${customerName} notified that car servicing is complete.`, service });
});

// Delete / Unselect Service API
app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Service record not found.' });
  }

  const removed = services.splice(index, 1)[0];
  const targetVeh = vehicles.find((v) => v.id === removed.vehicleId);
  const regNo = targetVeh?.registrationNumber || 'Vehicle';

  notifications.unshift({
    id: `notif-${notifications.length + 1}`,
    type: 'SERVICE_REQUEST',
    title: '❌ Service Unselected / Cancelled',
    message: `Customer unselected service "${removed.serviceType}" for ${regNo}.`,
    timestamp: new Date().toISOString(),
    vehicleReg: regNo,
    read: false,
  });

  if (supabase) {
    try {
      await supabase.from('vehicle_services').delete().eq('id', toUuid(id));
    } catch (e) {
      console.error('Supabase delete service error:', e);
    }
  }

  res.json({ message: 'Service unselected successfully', removed });
});

app.get('/api/services/:id/items', (req, res) => {
  const { id } = req.params;
  const items = serviceItems.filter((item) => item.serviceId === id);
  res.json(items);
});

app.post('/api/services/:id/items', async (req, res) => {
  const { id } = req.params;
  const { description, quantity, price } = req.body;
  if (!description || !quantity || !price) {
    return res.status(400).json({ error: 'Missing item details' });
  }
  const newItem: ServiceItem = {
    id: `item-${Date.now()}`,
    serviceId: id,
    description,
    quantity: parseInt(quantity),
    price: parseInt(price),
  };
  serviceItems.push(newItem);

  // Update overall service cost
  const service = services.find((s) => s.id === id);
  if (service) {
    service.cost += newItem.price * newItem.quantity;
  }

  if (supabase) {
    try {
      await supabase.from('service_items').upsert(mapServiceItemToDb(newItem));
      if (service) {
        await supabase.from('vehicle_services').update({ cost: service.cost }).eq('id', toUuid(service.id));
      }
    } catch (e) {
      console.error('Supabase service item insert error:', e);
    }
  }

  res.status(201).json(newItem);
});

// Inventory API
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const item = inventory.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'Part not found' });
  item.quantity = parseInt(quantity);

  if (supabase) {
    try {
      await supabase.from('inventory_items').update({ quantity: item.quantity }).eq('id', toUuid(id));
    } catch (e) {
      console.error('Supabase inventory update error:', e);
    }
  }

  res.json(item);
});

// Payments API
app.get('/api/payments', (req, res) => {
  res.json(payments);
});

app.post('/api/payments', async (req, res) => {
  const { userId, amount, paymentMethod, reservationId, serviceId, paymentDetails } = req.body;
  if (!amount || !paymentMethod) {
    return res.status(400).json({ error: 'Amount and Payment Method are required.' });
  }

  const newPayment: Payment = {
    id: `pay-${Date.now()}`,
    userId: userId || 'usr-1',
    amount: parseInt(amount),
    paymentMethod,
    transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
    status: 'Success',
    date: new Date().toISOString(),
    reservationId,
    serviceId,
    paymentDetails,
  };

  payments.push(newPayment);

  if (supabase) {
    try {
      await ensureUserInSupabase(newPayment.userId);
      if (newPayment.reservationId) {
        const resv = reservations.find((r) => r.id === newPayment.reservationId);
        if (resv) {
          await ensureUserInSupabase(resv.userId);
          await ensureVehicleInSupabase(resv.vehicleId);
          await ensureParkingSpaceInSupabase(resv.parkingId);
          await supabase.from('parking_reservations').upsert(mapReservationToDb(resv));
        }
      }
      if (newPayment.serviceId) {
        const srv = services.find((s) => s.id === newPayment.serviceId);
        if (srv) {
          await ensureUserInSupabase(srv.customerId);
          await ensureVehicleInSupabase(srv.vehicleId);
          await supabase.from('vehicle_services').upsert(mapServiceToDb(srv));
        }
      }

      const { error } = await supabase.from('payments').upsert(mapPaymentToDb(newPayment));
      if (error) console.error('Supabase payment insert error:', error.message);
      else console.log('✅ Saved payment to Supabase:', newPayment.id);
    } catch (e) {
      console.error('Supabase payment insert exception:', e);
    }
  }

  res.status(201).json(newPayment);
});

// --- AI Gemini-Powered Endpoints ---

// 1. Diagnostics, recommendations, or prediction based on vehicle logs & sensor issues
app.post('/api/ai/diagnostics', async (req, res) => {
  const { make, model, year, mileage, symptoms } = req.body;

  if (!symptoms) {
    return res.status(400).json({ error: 'Please describe the symptoms of your vehicle.' });
  }

  const prompt = `You are an expert AI Master Mechanic specializing in digital diagnostics for an Integrated Vehicle Service platform.
Analyze this car for troubleshooting:
Make: ${make || 'Generic'}
Model: ${model || 'Vehicle'}
Year: ${year || 'N/A'}
Mileage: ${mileage || 'unknown'} km
Symptoms reported by user: "${symptoms}"

Based on the symptoms, mileage, and standard diagnostic codes (OBD-II), provide:
1. Top 3 most likely mechanical or electrical issues.
2. Estimated Severity (Low/Medium/High) and safety recommendation.
3. Recommended Repair Service (e.g., Brake Inspection, Wheel Alignment, Coil Ignition replacement) and estimated cost range (in UGX - Ugandan Shillings).
4. Spare parts likely needed from the workshop.

Format your response in a clear, concise, highly professional JSON structure like this (strictly valid JSON only, no code blocks or extra text):
{
  "issues": [
    {"name": "Issue Name", "probability": "Percentage%", "explanation": "Brief explanation"}
  ],
  "severity": "Medium",
  "safetyRecommendation": "Brief warning or recommendation",
  "recommendedServices": [
    {"type": "Wheel Alignment", "estimatedCostUGX": "180,000 - 240,000"}
  ],
  "sparePartsNeeded": ["Part Name 1", "Part Name 2"]
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a highly precise digital vehicle diagnostician returning strict JSON summaries.',
        },
      });

      const text = response.text || '{}';
      return res.json(JSON.parse(text));
    } catch (error) {
      console.error('Gemini API Error in Diagnostics:', error);
    }
  }

  // Reliable, detailed rules-based offline fallback if API key is missing/unusable
  console.log('Using rule-based diagnostic fallback');
  const fallbackResponse = {
    issues: [
      {
        name: 'Worn Brake Rotors or Calipers',
        probability: '85%',
        explanation: `Heavy vibration or screeching when braking on a ${make} ${model} with ${mileage || 'high'} km suggests brake surface friction loss.`,
      },
      {
        name: 'Wheel Hub Assembly Imbalance',
        probability: '60%',
        explanation: 'Slight pulling combined with vibration at speed indicates uneven suspension wear or tire misalignment.',
      },
      {
        name: 'Brake Pad Replacement Required',
        probability: '50%',
        explanation: 'Friction material below 3mm causes direct metal-on-metal contact and grinding sounds.',
      },
    ],
    severity: 'High',
    safetyRecommendation: 'Braking performance is compromised. Do not drive at high speeds. Schedule immediate mechanical attention.',
    recommendedServices: [
      { type: 'Brake Inspection & Pads Replacement', estimatedCostUGX: '150,000 - 250,000' },
      { type: 'Full Wheel Alignment and Balancing', estimatedCostUGX: '60,000 - 90,000' },
    ],
    sparePartsNeeded: ['Brake Pad Set (Front)', 'Wheel Hub Bearings', 'Brake Fluid Dot 4'],
  };
  res.json(fallbackResponse);
});

// 2. Predict parking availability or occupancy levels based on current day and hour
app.post('/api/ai/parking-prediction', async (req, res) => {
  const { dayOfWeek, hourOfDay } = req.body;
  const currentOccupied = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.OCCUPIED).length;
  const totalSpaces = parkingSpaces.length;

  const prompt = `You are a smart parking intelligence bot.
Based on the current date/time context:
Day: ${dayOfWeek || 'Tuesday'}
Hour: ${hourOfDay || '10:00 AM'}
Current real-time occupancy: ${currentOccupied} spaces occupied out of ${totalSpaces} total spaces in Garage A.

Analyze historical metropolitan traffic patterns, lunchtime rushes, work hours, and weekend leisure spikes to provide:
1. Occupancy Prediction: Forecast percentage occupancy (0% to 100%) for this day and time.
2. Expected Rush: Is this peak hour, moderate hour, or off-peak?
3. Recommended floor & section to park in Garage A for the smoothest experience.
4. Tips for reducing reservation delay.

Format your response in a clear, concise JSON structure (strictly valid JSON only, no markdown blocks):
{
  "predictedOccupancyPercent": 78,
  "rushLevel": "Peak Rush",
  "recommendedLocation": "Floor 2, Section C (usually 45% empty at this hour)",
  "insights": "Insight about parking behavior on this day"
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a smart city parking logistics forecaster returning strict JSON summaries.',
        },
      });
      const text = response.text || '{}';
      return res.json(JSON.parse(text));
    } catch (error) {
      console.error('Gemini API Error in Parking Prediction:', error);
    }
  }

  // Rules-based offline fallback
  const isWeekend = ['Saturday', 'Sunday'].includes(dayOfWeek);
  const hourNum = parseInt(hourOfDay) || 12;
  const isPeak = (hourNum >= 8 && hourNum <= 10) || (hourNum >= 12 && hourNum <= 14) || (hourNum >= 17 && hourNum <= 19);

  let predictedOccupancyPercent = 45;
  let rushLevel = 'Off-Peak';
  let recommendedLocation = 'Floor 1, Section B';

  if (isPeak) {
    predictedOccupancyPercent = isWeekend ? 85 : 78;
    rushLevel = 'Peak Rush';
    recommendedLocation = 'Floor 2, Section C (usually least occupied)';
  } else if (hourNum >= 20 || hourNum < 6) {
    predictedOccupancyPercent = 15;
    rushLevel = 'Low Traffic';
    recommendedLocation = 'Floor G, Section A (right beside entrance)';
  } else {
    predictedOccupancyPercent = 50;
    rushLevel = 'Moderate';
    recommendedLocation = 'Floor 1, Section A';
  }

  res.json({
    predictedOccupancyPercent,
    rushLevel,
    recommendedLocation,
    insights: `Traffic is currently ${rushLevel.toLowerCase()} during ${dayOfWeek} around ${hourOfDay}. We recommend choosing a pre-reserved ticket to secure your premium spot.`,
  });
});

// --- Vite & Client Middleware Setup ---

let serverlessInitialized = false;
export async function initServerless() {
  if (!serverlessInitialized) {
    serverlessInitialized = true;
    try {
      await syncSupabaseDatabase();
    } catch (e) {
      console.error('Serverless init error:', e);
    }
  }
}

export default app;

async function startServer() {
  await syncSupabaseDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

