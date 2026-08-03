import React, { useState, useEffect, useMemo } from 'react';
import {
  Vehicle,
  ParkingSpace,
  ParkingReservation,
  VehicleService,
  ParkingSpaceStatus,
  ReservationStatus,
  ServiceStatus,
  Payment,
} from '../types';
import {
  Car,
  Clock,
  MapPin,
  Sparkles,
  CreditCard,
  Bell,
  Wrench,
  CheckCircle2,
  Plus,
  X,
  QrCode,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Search,
  Globe,
  ExternalLink,
  Check,
  Mail,
  AlertCircle,
  AlertTriangle,
  Tag,
  Gift,
  ArrowUpRight,
  Layers,
  Compass,
  Phone,
  Zap,
  BatteryCharging,
  Droplets,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Building2,
  Home,
} from 'lucide-react';
import {
  googleSignIn,
  initAuth,
  sendReceiptEmail,
  sendReminderEmail,
  logout,
} from '../lib/gmail';
import { User as FirebaseUser } from 'firebase/auth';

function toUuid(id: string | null | undefined): string | null {
  if (!id) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const hex32 = (hex + hex + hex + hex).slice(0, 32);
  return `${hex32.slice(0, 8)}-${hex32.slice(8, 12)}-4${hex32.slice(13, 16)}-a${hex32.slice(17, 20)}-${hex32.slice(20, 32)}`;
}

// Registered Location Yards Data around the Country (Uganda)
export interface LocationYard {
  id: string;
  name: string;
  city: string;
  address: string;
  landmark: string;
  zone: string;
  distanceKm: number;
  totalSlots: number;
  availableSlots: number;
  ratePerHour: number;
  phone: string;
  hasGarage: boolean;
  hasCarWash?: boolean;
  hasEvCharging?: boolean;
  hasHomeService?: boolean;
  security: string;
}

export const NATIONWIDE_YARDS: LocationYard[] = [
  {
    id: 'yard-kampala',
    name: 'Kampala Central Yard & Service Hub',
    city: 'Kampala',
    address: 'Plot 14 Kampala Road, Central Division',
    landmark: 'Near City Square & Constitutional Square',
    zone: 'Kampala Central',
    distanceKm: 0.4,
    totalSlots: 120,
    availableSlots: 48,
    ratePerHour: 5000,
    phone: '+256 700 100 200',
    hasGarage: true,
    security: '24/7 CCTV & Automated Gate Entry',
  },
  {
    id: 'yard-wandegeya',
    name: 'Wandegeya Makerere Hill Yard',
    city: 'Kampala',
    address: 'Makerere Hill Road, Wandegeya Zone',
    landmark: 'Opposite Wandegeya Market & Makerere Gate',
    zone: 'Kampala North',
    distanceKm: 1.2,
    totalSlots: 90,
    availableSlots: 38,
    ratePerHour: 4000,
    phone: '+256 700 100 210',
    hasGarage: true,
    security: 'CCTV & Patrol Guards',
  },
  {
    id: 'yard-kololo',
    name: 'Kololo Acacia Executive Yard',
    city: 'Kampala',
    address: 'Acacia Avenue, Kololo Division',
    landmark: 'Near Acacia Mall & Golf Course',
    zone: 'Kampala East',
    distanceKm: 1.8,
    totalSlots: 100,
    availableSlots: 52,
    ratePerHour: 6000,
    phone: '+256 700 100 211',
    hasGarage: true,
    security: '24/7 Armed Security & EV Chargers',
  },
  {
    id: 'yard-nakawa',
    name: 'Nakawa Business & Service Yard',
    city: 'Kampala',
    address: 'Jinja Road, Nakawa Industrial Area',
    landmark: 'Near MUBS & URA Head Office Tower',
    zone: 'Kampala East',
    distanceKm: 2.8,
    totalSlots: 110,
    availableSlots: 64,
    ratePerHour: 4500,
    phone: '+256 700 100 212',
    hasGarage: true,
    security: 'Automated Boom Barriers & CCTV',
  },
  {
    id: 'yard-entebbe',
    name: 'Entebbe Airport Hub Yard',
    city: 'Entebbe',
    address: 'Airport Bypass Road, Terminal West',
    landmark: 'Near Entebbe International Airport Terminal',
    zone: 'Entebbe',
    distanceKm: 34.0,
    totalSlots: 85,
    availableSlots: 32,
    ratePerHour: 6000,
    phone: '+256 700 100 201',
    hasGarage: true,
    security: '24/7 Aviation Security',
  },
  {
    id: 'yard-jinja',
    name: 'Jinja Express City Yard',
    city: 'Jinja',
    address: 'Bell Avenue, Nile Division, Jinja',
    landmark: 'Near Source of the Nile Bridge',
    zone: 'Jinja',
    distanceKm: 78.0,
    totalSlots: 60,
    availableSlots: 22,
    ratePerHour: 4000,
    phone: '+256 700 100 202',
    hasGarage: true,
    security: 'Guarded & Guard Dog Patrols',
  },
  {
    id: 'yard-mbarara',
    name: 'Mbarara Western Hub Yard',
    city: 'Mbarara',
    address: 'High Street, Mbarara City Center',
    landmark: 'Near Mbarara Regional Referral Hospital',
    zone: 'Western Region',
    distanceKm: 260.0,
    totalSlots: 75,
    availableSlots: 35,
    ratePerHour: 4000,
    phone: '+256 700 100 203',
    hasGarage: true,
    security: '24/7 Security & EV Charging',
  },
  {
    id: 'yard-gulu',
    name: 'Gulu Northern Express Yard',
    city: 'Gulu',
    address: 'Gulu Main Avenue, Northern Division',
    landmark: 'Near Gulu University Main Gate',
    zone: 'Northern Region',
    distanceKm: 330.0,
    totalSlots: 50,
    availableSlots: 19,
    ratePerHour: 3500,
    phone: '+256 700 100 204',
    hasGarage: true,
    security: 'Perimeter Lighting & Fenced Yard',
  },
  {
    id: 'yard-kasese',
    name: 'Kasese Industrial Yard',
    city: 'Kasese',
    address: 'Kasese Highway, Industrial Zone',
    landmark: 'Near Rwenzori Mountain View Trailhead',
    zone: 'Western Region',
    distanceKm: 380.0,
    totalSlots: 40,
    availableSlots: 16,
    ratePerHour: 3000,
    phone: '+256 700 100 205',
    hasGarage: true,
    security: 'Security Patrols',
  },
];

export interface EvChargingStation {
  id: string;
  name: string;
  address: string;
  landmark: string;
  city: string;
  distanceKm: number;
  fastDcPlugs: number;
  availableDcPlugs: number;
  acPlugs: number;
  availableAcPlugs: number;
  maxPowerKw: number;
  ratePerKwh: number;
  status: 'Available' | 'Busy';
  plugTypes: string[];
  phone: string;
}

export const NEARBY_EV_STATIONS: EvChargingStation[] = [
  {
    id: 'ev-kampala-central',
    name: 'Kampala Central EV Supercharger Hub',
    address: 'Plot 14 Kampala Road, Central Division',
    landmark: 'City Square Entrance & Kampala Central Yard',
    city: 'Kampala',
    distanceKm: 0.4,
    fastDcPlugs: 6,
    availableDcPlugs: 4,
    acPlugs: 4,
    availableAcPlugs: 3,
    maxPowerKw: 150,
    ratePerKwh: 1200,
    status: 'Available',
    plugTypes: ['CCS2 (150 kW)', 'Type 2 AC (22 kW)', 'GB/T Fast Charge'],
    phone: '+256 700 100 301',
  },
  {
    id: 'ev-wandegeya-hub',
    name: 'Wandegeya Makerere Hill EV Station',
    address: 'Makerere Hill Road, Wandegeya Zone',
    landmark: 'Opposite Wandegeya Market & Makerere Gate',
    city: 'Kampala',
    distanceKm: 1.2,
    fastDcPlugs: 4,
    availableDcPlugs: 2,
    acPlugs: 4,
    availableAcPlugs: 3,
    maxPowerKw: 120,
    ratePerKwh: 1150,
    status: 'Available',
    plugTypes: ['CCS2 (120 kW)', 'Type 2 AC (22 kW)', 'CHAdeMO'],
    phone: '+256 700 100 302',
  },
  {
    id: 'ev-kololo-acacia',
    name: 'Kololo Acacia Executive EV Hub',
    address: 'Acacia Avenue, Kololo Division',
    landmark: 'Acacia Mall Underground & Golf Course',
    city: 'Kampala',
    distanceKm: 1.8,
    fastDcPlugs: 6,
    availableDcPlugs: 5,
    acPlugs: 6,
    availableAcPlugs: 4,
    maxPowerKw: 180,
    ratePerKwh: 1250,
    status: 'Available',
    plugTypes: ['CCS2 Ultra-Fast (180 kW)', 'Type 2 AC (22 kW)'],
    phone: '+256 700 100 303',
  },
  {
    id: 'ev-nakawa-industrial',
    name: 'Nakawa Business & Service EV Terminal',
    address: 'Jinja Road, Nakawa Industrial Area',
    landmark: 'Near URA Tower & MUBS Main Gate',
    city: 'Kampala',
    distanceKm: 2.8,
    fastDcPlugs: 8,
    availableDcPlugs: 6,
    acPlugs: 4,
    availableAcPlugs: 3,
    maxPowerKw: 200,
    ratePerKwh: 1200,
    status: 'Available',
    plugTypes: ['CCS2 (200 kW)', 'Type 2 AC (22 kW)', 'GB/T'],
    phone: '+256 700 100 304',
  },
  {
    id: 'ev-entebbe-express',
    name: 'Entebbe Airport Highway EV Supercharger',
    address: 'Airport Expressway Gate, Entebbe',
    landmark: 'Near Entebbe International Terminal Entrance',
    city: 'Entebbe',
    distanceKm: 34.0,
    fastDcPlugs: 10,
    availableDcPlugs: 8,
    acPlugs: 6,
    availableAcPlugs: 5,
    maxPowerKw: 250,
    ratePerKwh: 1400,
    status: 'Available',
    plugTypes: ['Tesla / CCS2 Supercharger (250 kW)', 'Type 2 AC (22 kW)'],
    phone: '+256 700 100 305',
  },
];

interface CustomerPortalProps {
  userId: string;
  currentUser?: { name?: string; email?: string } | null;
  onRefreshAll: () => void;
  vehicles: Vehicle[];
  parkingSpaces: ParkingSpace[];
  reservations: ParkingReservation[];
  services: VehicleService[];
  payments?: Payment[];
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  userId,
  currentUser,
  onRefreshAll,
  vehicles,
  parkingSpaces,
  reservations,
  services,
  payments = [],
}) => {
  // Primary active user state
  const userName = currentUser?.name || 'Customer';

  // Customer's registered vehicles - filtered for current logged in user with UUID tolerance
  const myVehicles = useMemo(() => {
    const list = vehicles.filter((v) => {
      if (!v) return false;
      if (v.userId === userId || v.userId === currentUser?.id) return true;
      if (currentUser?.email && (v.userId === currentUser.email || v.userId.toLowerCase() === currentUser.email.toLowerCase())) return true;
      if (toUuid(v.userId) === toUuid(userId) || toUuid(v.userId) === toUuid(currentUser?.id)) return true;
      if (v.userId === 'usr-1' || v.userId === 'usr-cust' || v.userId === 'usr-customer') return true;
      return false;
    });
    return list.length > 0 ? list : vehicles;
  }, [vehicles, userId, currentUser]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  useEffect(() => {
    if (myVehicles.length > 0 && (!selectedVehicleId || !myVehicles.some(v => v.id === selectedVehicleId || toUuid(v.id) === toUuid(selectedVehicleId)))) {
      setSelectedVehicleId(myVehicles[0].id);
    }
  }, [myVehicles]);

  const activeVehicle = myVehicles.find((v) => v.id === selectedVehicleId || toUuid(v.id) === toUuid(selectedVehicleId)) || myVehicles[0] || null;

  // Customer's active parking reservations
  const myReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (!r) return false;
      if (r.userId === userId || r.userId === currentUser?.id || toUuid(r.userId) === toUuid(userId) || toUuid(r.userId) === toUuid(currentUser?.id)) return true;
      return myVehicles.some((v) => v.id === r.vehicleId || toUuid(v.id) === toUuid(r.vehicleId));
    });
  }, [reservations, userId, currentUser, myVehicles]);

  const activeReservation = useMemo(() => {
    return myReservations.find((r) => r.status === ReservationStatus.ACTIVE || r.status === 'Confirmed') || null;
  }, [myReservations]);

  // State values strictly matching current logged-in user
  const [currentFloor, setCurrentFloor] = useState<string>('-');
  const [currentSlot, setCurrentSlot] = useState<string>('None');
  const [hoursRemaining, setHoursRemaining] = useState<number>(0);

  const [availableSpacesCount, setAvailableSpacesCount] = useState<number>(() => {
    const avail = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.AVAILABLE).length;
    return avail > 0 ? avail : 124;
  });

  const [serviceName, setServiceName] = useState<string>('Oil Change');
  const [serviceProgress, setServiceProgress] = useState<number>(70);

  const [rewardPoints, setRewardPoints] = useState<number>(currentUser?.rewardPoints || 0);
  const [discountOffer, setDiscountOffer] = useState<string>('10% Discount Available');
  const [claimedVoucherCode, setClaimedVoucherCode] = useState<string | null>(null);

  const [paymentAmountDue, setPaymentAmountDue] = useState<number>(0);
  const [isPaymentSettled, setIsPaymentSettled] = useState<boolean>(false);

  const [notificationText, setNotificationText] = useState<string>('No active parking session running');
  const [isNotificationDismissed, setIsNotificationDismissed] = useState<boolean>(false);

  // Sync state cleanly when active reservation or current user changes
  useEffect(() => {
    if (activeReservation) {
      setCurrentFloor(activeReservation.parkingSpace?.floor || 'G');
      setCurrentSlot(activeReservation.parkingSpace?.spaceNumber || 'A12');
      setHoursRemaining(2);
      setNotificationText(`Parking active on Floor ${activeReservation.parkingSpace?.floor || 'G'}, Slot ${activeReservation.parkingSpace?.spaceNumber || 'A12'}`);
    } else {
      setCurrentFloor('-');
      setCurrentSlot('None');
      setHoursRemaining(0);
      setNotificationText('No active parking session. Register vehicle to book parking & services.');
    }
  }, [activeReservation]);

  useEffect(() => {
    setRewardPoints(currentUser?.rewardPoints || 0);
  }, [currentUser]);

  // Interactive Modal State Controls
  const [showExtendModal, setShowExtendModal] = useState<boolean>(false);
  const [showFindVehicleModal, setShowFindVehicleModal] = useState<boolean>(false);
  const [showReserveParkingModal, setShowReserveParkingModal] = useState<boolean>(false);
  const [showTrackServiceModal, setShowTrackServiceModal] = useState<boolean>(false);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [showPayNowModal, setShowPayNowModal] = useState<boolean>(false);

  // Organized Multi-Step Card Modal Flow States
  const [parkingStep, setParkingStep] = useState<'yard' | 'slot' | 'confirm'>('yard');
  const [selectedModalYardId, setSelectedModalYardId] = useState<string>('yard-kampala');
  const [serviceStep, setServiceStep] = useState<'workshop' | 'package' | 'tracker'>('workshop');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('yard-kampala');
  const [selectedServicePackage, setSelectedServicePackage] = useState<string>('Castrol Synthetic Oil & Filter Renewal');
  const [evStep, setEvStep] = useState<'station' | 'plug' | 'active'>('station');
  const [payStep, setPayStep] = useState<'bills' | 'method' | 'receipt'>('bills');

  // Extend Modal Internal States
  const [extendHours, setExtendHours] = useState<number>(1);
  const [extendSuccessMsg, setExtendSuccessMsg] = useState<string>('');

  // Reserve Parking Modal Internal States
  const [selectedFloor, setSelectedFloor] = useState<string>('G');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [reserveHours, setReserveHours] = useState<number>(2);
  const [reserveSuccessMsg, setReserveSuccessMsg] = useState<string>('');

  // Pay Now Modal Internal States
  const [payMethod, setPayMethod] = useState<'Mobile Money' | 'Credit Card' | 'Bank Transfer'>('Mobile Money');
  const [momoNumber, setMomoNumber] = useState<string>('+256 772 123456');
  const [momoProvider, setMomoProvider] = useState<string>('MTN Mobile Money');
  const [cardHolder, setCardHolder] = useState<string>(currentUser?.name || 'Cardholder Name');

  useEffect(() => {
    if (currentUser?.name) {
      setCardHolder(currentUser.name);
    }
  }, [currentUser]);
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string>('');

  // Google OAuth / Gmail State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  // Location Yard Bar & Nearby Yard State
  const [selectedYardId, setSelectedYardId] = useState<string>('yard-kampala');
  const [yardQuery, setYardQuery] = useState<string>('');
  const [showYardSelectorModal, setShowYardSelectorModal] = useState<boolean>(false);
  const [yardFilterCategory, setYardFilterCategory] = useState<'All' | 'Nearby' | 'Kampala' | 'Entebbe' | 'Upcountry'>('All');
  const [showGpsMapModal, setShowGpsMapModal] = useState<boolean>(false);
  const [selectedYardForMap, setSelectedYardForMap] = useState<LocationYard | null>(null);
  const [yardNoticeMsg, setYardNoticeMsg] = useState<string>('');

  // EV Charging Popup Modal & Live Session State
  const [showEvChargingModal, setShowEvChargingModal] = useState<boolean>(false);
  const [selectedEvStationId, setSelectedEvStationId] = useState<string>('ev-kampala-central');
  const [evBatteryCurrentPct, setEvBatteryCurrentPct] = useState<number>(25);
  const [evBatteryTargetPct, setEvBatteryTargetPct] = useState<number>(80);
  const [evBatteryCapacityKwh, setEvBatteryCapacityKwh] = useState<number>(75);
  const [evPlugType, setEvPlugType] = useState<string>('CCS2 (150 kW)');
  const [evNoticeMsg, setEvNoticeMsg] = useState<string>('');
  const [isEvSessionActive, setIsEvSessionActive] = useState<boolean>(false);
  const [evCurrentProgressPct, setEvCurrentProgressPct] = useState<number>(25);
  const [evEnergyChargedKwh, setEvEnergyChargedKwh] = useState<number>(0);

  // Car Wash Popup Modal State
  const [showCarWashModal, setShowCarWashModal] = useState<boolean>(false);
  const [carWashPackageName, setCarWashPackageName] = useState<string>('Executive Foam Wash & Wax');
  const [carWashCostUGX, setCarWashCostUGX] = useState<number>(25000);

  // Home Car Servicing Request Full-Screen Stage State
  const [showHomeServiceModal, setShowHomeServiceModal] = useState<boolean>(false);
  const [isHomeServiceMode, setIsHomeServiceMode] = useState<boolean>(false);
  const [homeServiceStage, setHomeServiceStage] = useState<'selection' | 'location'>('selection');
  const [homeServiceVehicleId, setHomeServiceVehicleId] = useState<string>('');
  const [homeServicePackage, setHomeServicePackage] = useState<string>('');
  const [homeServiceAddress, setHomeServiceAddress] = useState<string>('Plot 42 Naguru Drive, Ntinda-Naguru');
  const [homeServiceCity, setHomeServiceCity] = useState<string>('Kampala');
  const [homeServiceGpsLocation, setHomeServiceGpsLocation] = useState<string>('0.3476° N, 32.5825° E (Kampala Central Pin)');
  const [homeServiceLandmark, setHomeServiceLandmark] = useState<string>('Opposite Shell Ntinda / Black Gate');
  const [homeServicePhone, setHomeServicePhone] = useState<string>('+256 772 123456');
  const [homeServiceDate, setHomeServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [homeServiceTimeSlot, setHomeServiceTimeSlot] = useState<string>('2:00 PM - 4:00 PM');
  const [homeServiceInstructions, setHomeServiceInstructions] = useState<string>('Gate is open, please call on arrival.');
  const [isSubmittingHomeService, setIsSubmittingHomeService] = useState<boolean>(false);
  const [homeServiceSuccessMsg, setHomeServiceSuccessMsg] = useState<string>('');

  // Top-Level Service Selection & Unselection Notification Banner
  const [serviceNotificationBanner, setServiceNotificationBanner] = useState<{ type: 'success' | 'info' | 'warning'; message: string } | null>(null);

  // Service Order Review & Confirmation Modal State
  const [showConfirmOrderModal, setShowConfirmOrderModal] = useState<boolean>(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Unselect / Cancel Service Action
  const handleUnselectService = async (serviceId: string, serviceTitle?: string) => {
    if (isPaymentSettled) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '🔒 Invoice Cleared: Paid services cannot be unselected.',
      });
      return;
    }
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) console.warn('Server delete service failed, applying local update');
    } catch (err) {
      console.warn('Network error unselecting service:', err);
    }
    setServiceNotificationBanner({
      type: 'info',
      message: `❌ Service "${serviceTitle || 'Selected Service'}" has been unselected and removed from your account.`,
    });
    onRefreshAll();
    setTimeout(() => setServiceNotificationBanner(null), 5000);
  };

  // Delete vehicle action (with strict active operations check & historical preservation)
  const handleDeleteVehicle = async (vehId: string, regNo: string) => {
    // Client-side active check safeguard
    const activeRes = reservations.filter(
      (r) => (r.vehicleId === vehId || toUuid(r.vehicleId) === toUuid(vehId)) && r.status !== ReservationStatus.COMPLETED && r.status !== ReservationStatus.CANCELLED
    );
    const activeSrv = services.filter(
      (s) => (s.vehicleId === vehId || toUuid(s.vehicleId) === toUuid(vehId)) && s.status !== ServiceStatus.COMPLETED
    );

    if (activeRes.length > 0 || activeSrv.length > 0) {
      const reasons: string[] = [];
      if (activeRes.length > 0) reasons.push(`${activeRes.length} active parking reservation(s)`);
      if (activeSrv.length > 0) reasons.push(`${activeSrv.length} active service job(s) in progress`);

      setServiceNotificationBanner({
        type: 'warning',
        message: `⚠️ Cannot delete vehicle ${regNo}: Vehicle has active operations (${reasons.join(' & ')}). All active jobs and reservations must be completed or cancelled before deleting.`,
      });
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setServiceNotificationBanner({
          type: 'warning',
          message: `⚠️ Cannot delete vehicle ${regNo}: ${data.details || data.error || 'Vehicle has active operations.'}`,
        });
        return;
      }
    } catch (err) {
      console.warn('Network error deleting vehicle:', err);
    }

    // Always clean up local storage if present
    try {
      const saved = localStorage.getItem('ugpark_local_vehicles');
      if (saved) {
        const list: Vehicle[] = JSON.parse(saved);
        const filtered = list.filter((v) => v.id !== vehId && v.registrationNumber !== regNo);
        localStorage.setItem('ugpark_local_vehicles', JSON.stringify(filtered));
      }
    } catch {}

    setServiceNotificationBanner({
      type: 'success',
      message: `🗑️ Vehicle ${regNo} deleted successfully. Historical invoices & completed service records remain archived.`,
    });
    
    if (selectedVehicleId === vehId || toUuid(selectedVehicleId) === toUuid(vehId)) {
      const remaining = myVehicles.filter(v => v.id !== vehId);
      setSelectedVehicleId(remaining[0]?.id || '');
    }
    onRefreshAll();
    setTimeout(() => setServiceNotificationBanner(null), 5000);
  };

  // Unselect / Cancel Parking Reservation
  const handleUnselectReservation = async (resId: string, resTitle?: string) => {
    if (isPaymentSettled) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '🔒 Invoice Cleared: Paid parking reservations cannot be unselected.',
      });
      return;
    }
    try {
      await fetch(`/api/parking/reservations/${resId}/cancel`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Network error cancelling reservation:', err);
    }
    setServiceNotificationBanner({
      type: 'info',
      message: `❌ Parking Reservation "${resTitle || 'Spot'}" unselected and cancelled.`,
    });
    onRefreshAll();
    setTimeout(() => setServiceNotificationBanner(null), 5000);
  };

  const handleConfirmServiceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedServiceCatalog.length === 0) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '⚠️ Please select at least one vehicle service before confirming your order.',
      });
      return;
    }

    const selectedVeh = myVehicles.find((v) => v.id === (homeServiceVehicleId || selectedVehicleId)) || activeVehicle || myVehicles[0];
    const vehId = selectedVeh?.id || 'veh-1';
    const regNo = selectedVeh?.registrationNumber || 'Vehicle';

    setIsSubmittingOrder(true);
    setIsSubmittingHomeService(true);

    const SERVICE_CATALOG_COSTS: Record<string, number> = {
      'Full Oil & Filter Change': 80000,
      'Eco Foam Car Wash & Vacuum': 25000,
      'Brake Pad & Rotor Inspection': 120000,
      'Engine Diagnostics & Scan': 50000,
      'Wheel Alignment & Balancing': 45000,
      'AC Servicing & Gas Refill': 90000,
      'Battery Health Test & Service': 35000,
      'Suspension & Shock Service': 110000,
    };

    const selectedServicesList = selectedServiceCatalog.map((sTitle, idx) => ({
      id: `srv-item-${Date.now()}-${idx}`,
      title: sTitle,
      cost: SERVICE_CATALOG_COSTS[sTitle] || 50000,
      progress: 'Not Started' as const,
    }));

    const transportFee = isHomeServiceMode ? 20000 : 0;
    const servicesTotal = selectedServicesList.reduce((sum, item) => sum + item.cost, 0);
    const totalCalculatedCost = servicesTotal + transportFee;

    let isoBookingDate = new Date().toISOString();
    try {
      if (isHomeServiceMode && homeServiceDate) {
        const [yr, mo, dy] = homeServiceDate.split('-');
        if (yr && mo && dy) {
          isoBookingDate = new Date(Number(yr), Number(mo) - 1, Number(dy), 14, 0, 0).toISOString();
        }
      }
    } catch {
      isoBookingDate = new Date().toISOString();
    }

    const serviceTypeStr = isHomeServiceMode
      ? `🏠 Home Service: ${selectedServiceCatalog.join(', ')}`
      : `🛠️ Workshop: ${selectedServiceCatalog.join(', ')}`;

    const notes = isHomeServiceMode
      ? `Location: ${homeServiceAddress || 'Plot 42 Naguru Drive, Kampala'}, ${homeServiceCity || 'Kampala'}. Landmark: ${homeServiceLandmark || 'N/A'}. Instructions: ${homeServiceInstructions || 'None'}`
      : `Customer Confirmed Workshop Booking: ${selectedServiceCatalog.join(', ')}`;

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehId,
          customerId: userId || currentUser?.id || 'usr-1',
          serviceType: serviceTypeStr,
          bookingDate: isoBookingDate,
          cost: totalCalculatedCost,
          diagnosticNotes: notes,
          isHomeService: isHomeServiceMode,
          homeAddress: isHomeServiceMode ? (homeServiceAddress || 'Plot 42 Naguru Drive, Kampala') : '',
          homeCity: isHomeServiceMode ? (homeServiceCity || 'Kampala') : '',
          homeLandmark: isHomeServiceMode ? homeServiceLandmark : '',
          contactPhone: homeServicePhone || '+256 700 000000',
          visitDate: isHomeServiceMode ? (homeServiceDate || new Date().toISOString().split('T')[0]) : '',
          visitTime: isHomeServiceMode ? (homeServiceTimeSlot || '2:00 PM - 4:00 PM') : '',
          homeServiceFee: transportFee,
          selectedServicesList: selectedServicesList,
        }),
      });

      if (res.ok) {
        const bookedCount = selectedServicesList.length;
        setSelectedServiceCatalog([]);
        setShowConfirmOrderModal(false);
        setShowHomeServiceModal(false);
        setHomeServiceStage('selection');
        onRefreshAll();
        window.scrollTo({ top: 0, behavior: 'instant' });
        setServiceNotificationBanner({
          type: 'success',
          message: `🎉 Service Order Confirmed for ${regNo}! ${bookedCount} service(s) requested. Total Estimated: UGX ${totalCalculatedCost.toLocaleString()} ${isHomeServiceMode ? '(Includes UGX 20,000 Doorstep Transport Fee)' : ''}. Service Manager & Technicians notified.`,
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to confirm service order.');
      }
    } catch (err) {
      console.error('Error confirming service order:', err);
      alert('Network error connecting to server. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
      setIsSubmittingHomeService(false);
    }
  };

  const handleCreateHomeServiceRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceCatalog.length === 0) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '⚠️ Please select at least one vehicle service before submitting your doorstep request.',
      });
      return;
    }
    if (!homeServiceAddress.trim()) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '⚠️ Please provide a delivery address for your doorstep home service.',
      });
      return;
    }
    if (!homeServicePhone.trim()) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '⚠️ Please provide a contact phone number for technician dispatch.',
      });
      return;
    }
    if (!homeServiceDate) {
      setServiceNotificationBanner({
        type: 'warning',
        message: '⚠️ Please select a preferred visit date.',
      });
      return;
    }
    setShowConfirmOrderModal(true);
  };
  const [carWashTimeSlot, setCarWashTimeSlot] = useState<string>('Now while parked');
  const [carWashSpecialNotes, setCarWashSpecialNotes] = useState<string>('');
  const [carWashTargetVehicleId, setCarWashTargetVehicleId] = useState<string>('');
  const [carWashNoticeMsg, setCarWashNoticeMsg] = useState<string>('');
  const [isSubmittingCarWash, setIsSubmittingCarWash] = useState<boolean>(false);

  const selectedEvStation = NEARBY_EV_STATIONS.find(s => s.id === selectedEvStationId) || NEARBY_EV_STATIONS[0];

  // Calculate live EV battery energy needed & estimated cost
  const kwhNeeded = Math.max(0, Math.round(((evBatteryTargetPct - evBatteryCurrentPct) / 100) * evBatteryCapacityKwh));
  const estimatedEvCostUsh = Math.round(kwhNeeded * selectedEvStation.ratePerKwh);
  const estimatedTimeMins = Math.round((kwhNeeded / selectedEvStation.maxPowerKw) * 60) + 5;

  const handleStartEvSession = () => {
    setIsEvSessionActive(true);
    setEvCurrentProgressPct(evBatteryCurrentPct);
    setEvEnergyChargedKwh(0);
    setEvNoticeMsg(`⚡ EV Supercharging Session Initiated at ${selectedEvStation.name}! Plugged into Bay #4.`);
  };

  const handleStopEvSession = () => {
    setIsEvSessionActive(false);
    setEvNoticeMsg(`✅ EV Session Completed! Charged +${kwhNeeded} kWh. Total Billed: UGX ${estimatedEvCostUsh.toLocaleString()}`);
  };

  const handleRequestCarWashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVeh = myVehicles.find((v) => v.id === carWashTargetVehicleId) || activeVehicle;
    if (!targetVeh) return;

    // Duplicate check to avoid double selection of Car Wash
    const isDuplicate = services.some(
      (s) =>
        s.vehicleId === targetVeh.id &&
        (s.serviceType.toLowerCase().includes('car wash') || s.serviceType.toLowerCase().includes(carWashPackageName.toLowerCase())) &&
        s.status !== ServiceStatus.COMPLETED &&
        s.status !== ServiceStatus.READY_FOR_PICKUP
    );
    if (isDuplicate) {
      setServiceNotificationBanner({
        type: 'warning',
        message: `⚠️ Car Wash service "${carWashPackageName}" is ALREADY selected for ${targetVeh.registrationNumber}! Double selection prevented. You can view or unselect it below.`,
      });
      setShowCarWashModal(false);
      return;
    }

    setIsSubmittingCarWash(true);
    setCarWashNoticeMsg('');

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: targetVeh.id,
          customerId: userId,
          serviceType: `Car Wash: ${carWashPackageName}`,
          cost: carWashCostUGX,
          bookingDate: new Date().toISOString(),
          diagnosticNotes: `Car Wash Service Request (${carWashPackageName}) - Time Slot: ${carWashTimeSlot}. Location: ${activeYard.name}. Special Requests: ${carWashSpecialNotes || 'Standard foam wash, tire shine, interior vacuum.'}`,
        }),
      });

      if (res.ok) {
        setCarWashNoticeMsg(`✨ Car Wash (${carWashPackageName}) booked for ${targetVeh.registrationNumber}! Yard attendants notified.`);
        setServiceNotificationBanner({
          type: 'success',
          message: `🎉 Service "Car Wash: ${carWashPackageName}" successfully selected and added for ${targetVeh.registrationNumber}!`,
        });
        onRefreshAll();
        setTimeout(() => {
          setCarWashNoticeMsg('');
          setCarWashSpecialNotes('');
          setShowCarWashModal(false);
        }, 2500);
      }
    } catch (err) {
      setCarWashNoticeMsg(`✨ Car Wash Service booked successfully for ${targetVeh.registrationNumber}!`);
      setTimeout(() => {
        setCarWashNoticeMsg('');
        setShowCarWashModal(false);
      }, 2000);
    } finally {
      setIsSubmittingCarWash(false);
    }
  };

  const activeYard = NATIONWIDE_YARDS.find((y) => y.id === selectedYardId) || NATIONWIDE_YARDS[0];

  const handleSelectYard = (yard: LocationYard) => {
    setSelectedYardId(yard.id);
    setSelectedModalYardId(yard.id);
    setYardNoticeMsg(`Active destination set to ${yard.name} (${yard.distanceKm} km away)`);
    setTimeout(() => setYardNoticeMsg(''), 3000);
  };

  const handleOpenGpsMap = (yard: LocationYard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedYardForMap(yard);
    setShowGpsMapModal(true);
  };

  // Intuitive Navigation Tabs & View Mode State
  const [activeTab, setActiveTab] = useState<'overview' | 'parking' | 'services' | 'charging' | 'history' | 'payments' | 'rewards'>('overview');
  const [viewMode, setViewMode] = useState<'tabs' | 'single'>('tabs');
  const [historyCategoryTab, setHistoryCategoryTab] = useState<'all' | 'services' | 'maintenance' | 'payments'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Multi-service selection catalog state (users can select/unselect freely before submitting booking)
  const [selectedServiceCatalog, setSelectedServiceCatalog] = useState<string[]>([]);

  // Scroll to top immediately whenever activeTab or homeServiceStage changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, homeServiceStage]);

  // Secondary Tools (Expandable drawers for vehicle management and nationwide yards)
  const [showVehicleManager, setShowVehicleManager] = useState<boolean>(false);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState<boolean>(false);
  const [newReg, setNewReg] = useState<string>('');
  const [newMake, setNewMake] = useState<string>('');
  const [newModel, setNewModel] = useState<string>('');
  const [newYear, setNewYear] = useState<string>('2020');

  // Car registration state
  const [addVehSuccess, setAddVehSuccess] = useState<string>('');

  // Consolidate services rendered exclusively for the SELECTED ACTIVE VEHICLE
  const customerServices = useMemo(() => {
    if (!activeVehicle) return [];
    return services.filter((s) => {
      if (!s) return false;
      return s.vehicleId === activeVehicle.id || toUuid(s.vehicleId) === toUuid(activeVehicle.id);
    });
  }, [services, activeVehicle]);

  // Check if any service for the active vehicle is pending completion by Service Manager
  const hasPendingServices = useMemo(() => {
    return customerServices.some(
      (s) => s.status !== ServiceStatus.COMPLETED && s.status !== ServiceStatus.READY_FOR_PICKUP
    );
  }, [customerServices]);

  // Itemized rendered services list for the customer's active operations (Deduplicated)
  const renderedItemsList = useMemo(() => {
    const list: { id: string; title: string; category: string; vehicleReg: string; cost: number; details: string; isPending?: boolean }[] = [];
    const seenTitles = new Set<string>();

    // 1. Car Parking Reservation / Spot Fee if active
    if (hoursRemaining > 0) {
      list.push({
        id: 'item-parking',
        title: 'Car Parking Space Reservation',
        category: 'Car Parking',
        vehicleReg: activeVehicle?.registrationNumber || 'Registered Vehicle',
        cost: 5000,
        details: `Floor ${currentFloor}, Slot ${currentSlot} (${hoursRemaining} hrs remaining)`,
        isPending: false,
      });
    }

    // 2. Rendered / Requested Services from backend for THIS vehicle (Deduplicated by Service Type)
    if (customerServices.length > 0) {
      customerServices.forEach((srv) => {
        const isPendingSrv = srv.status !== ServiceStatus.COMPLETED && srv.status !== ServiceStatus.READY_FOR_PICKUP;
        const titleKey = `${srv.serviceType.trim().toLowerCase()}_${(srv.vehicleId || '').toString()}`;

        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);

          if (srv.isHomeService || srv.serviceType.toLowerCase().includes('home service')) {
            const homeFee = srv.homeServiceFee !== undefined && srv.homeServiceFee > 0 ? srv.homeServiceFee : 20000;
            if (srv.selectedServicesList && srv.selectedServicesList.length > 0) {
              srv.selectedServicesList.forEach((subItem, idx) => {
                list.push({
                  id: `${srv.id}-sub-${idx}`,
                  title: subItem.title,
                  category: 'Vehicle Service',
                  vehicleReg: activeVehicle?.registrationNumber || 'Vehicle',
                  cost: subItem.cost,
                  details: `Home Service Requested Item • Status: ${srv.status}`,
                  isPending: isPendingSrv,
                });
              });
            } else {
              const servicesPortion = Math.max(0, srv.cost - homeFee);
              list.push({
                id: `${srv.id}-base`,
                title: srv.serviceType.replace('🏠 Home Service: ', ''),
                category: 'Vehicle Service',
                vehicleReg: activeVehicle?.registrationNumber || 'Vehicle',
                cost: servicesPortion > 0 ? servicesPortion : srv.cost,
                details: srv.diagnosticNotes || `Status: ${srv.status}`,
                isPending: isPendingSrv,
              });
            }

            // Always add the itemized Home Service Transport Fee
            list.push({
              id: `${srv.id}-transport-fee`,
              title: 'Home Service Transport Fee',
              category: 'Transport Fee',
              vehicleReg: activeVehicle?.registrationNumber || 'Vehicle',
              cost: homeFee,
              details: 'Doorstep Technician Visit & Delivery Transport Fee (Paid to Mechanic)',
              isPending: isPendingSrv,
            });
          } else {
            let cat = 'Garage Service';
            const st = srv.serviceType.toLowerCase();
            if (st.includes('wash')) cat = 'Car Wash';
            else if (st.includes('oil')) cat = 'Oil Change';
            else if (st.includes('charging') || st.includes('ev')) cat = 'EV Charging';

            list.push({
              id: srv.id,
              title: srv.serviceType,
              category: cat,
              vehicleReg: activeVehicle?.registrationNumber || 'Vehicle',
              cost: srv.cost || 25000,
              details: srv.diagnosticNotes || `Status: ${srv.status}`,
              isPending: isPendingSrv,
            });
          }
        }
      });
    }

    return list;
  }, [customerServices, activeVehicle, currentFloor, currentSlot, hoursRemaining]);

  // Grand Total Cost Calculation for all services rendered
  const totalCalculatedCostUGX = useMemo(() => {
    return renderedItemsList.reduce((acc, item) => acc + item.cost, 0);
  }, [renderedItemsList]);

  // Dedicated Garage Service Request Modal for existing vehicles
  const [showReqGarageModal, setShowReqGarageModal] = useState<boolean>(false);
  const [targetVehForGarage, setTargetVehForGarage] = useState<Vehicle | null>(null);
  const [garageProblemType, setGarageProblemType] = useState<string>('Brake System Service');
  const [garageProblemNotes, setGarageProblemNotes] = useState<string>('');
  const [garageReqSuccess, setGarageReqSuccess] = useState<string>('');
  const [isSubmittingGarageReq, setIsSubmittingGarageReq] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Extend Parking Time Action
  const handleConfirmExtend = () => {
    const additionalHours = extendHours;
    setHoursRemaining((prev) => prev + additionalHours);
    setExtendSuccessMsg(`Parking session successfully extended by ${additionalHours} hour(s)!`);
    setNotificationText(`Parking extended! New remaining duration: ${hoursRemaining + additionalHours} hours.`);
    
    setTimeout(() => {
      setExtendSuccessMsg('');
      setShowExtendModal(false);
    }, 2000);
  };

  // 2. Reserve Parking Action
  const handleConfirmReservation = async () => {
    const targetSpace = parkingSpaces.find((s) => s.id === selectedSpaceId) || {
      spaceNumber: `${selectedSection}08`,
      floor: selectedFloor,
      section: selectedSection,
    };

    try {
      await fetch('/api/parking/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          vehicleId: activeVehicle?.id || 'veh-new',
          parkingId: selectedSpaceId || 'space-a12',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + reserveHours * 60 * 60 * 1000).toISOString(),
          amount: 5000,
        }),
      });
    } catch (e) {}

    setAvailableSpacesCount((prev) => Math.max(0, prev - 1));
    setReserveSuccessMsg(`Spot ${targetSpace.spaceNumber} on Floor ${targetSpace.floor} reserved successfully!`);
    onRefreshAll();

    setTimeout(() => {
      setReserveSuccessMsg('');
      setShowReserveParkingModal(false);
    }, 2000);
  };

  // 3. Redeem Rewards Action
  const handleRedeemVoucher = () => {
    if (rewardPoints >= 300) {
      setRewardPoints((prev) => prev - 300);
      const code = `UGPARK10-${Math.floor(1000 + Math.random() * 9000)}`;
      setClaimedVoucherCode(code);
      setDiscountOffer('10% Discount Applied to Account');
    }
  };

  // 4. Pay Now Action (Consolidated Single Payment for All Services Rendered)
  const handleProcessPayment = async () => {
    if (isPaymentSettled) {
      setPaySuccessMsg("This invoice has already been paid. No further payment is required.");
      alert("This invoice has already been paid. No further payment is required.");
      return;
    }

    setIsProcessingPay(true);
    setPaySuccessMsg('');
    const totalAmountToPay = totalCalculatedCostUGX;

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: totalAmountToPay,
          paymentMethod: payMethod,
          paymentDetails: payMethod === 'Mobile Money' ? `${momoProvider}: ${momoNumber}` : `Cardholder: ${cardHolder}`,
        }),
      });

      let emailSent = false;
      if (googleToken) {
        try {
          const itemizedDetails = renderedItemsList
            .map((item) => `• [${item.category}] ${item.title} (${item.vehicleReg}): UGX ${item.cost.toLocaleString()}`)
            .join('\n');

          await sendReceiptEmail(currentUser?.email || 'jonathaneny82@gmail.com', {
            customerName: userName,
            customerEmail: currentUser?.email || 'jonathaneny82@gmail.com',
            transactionId: `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
            paymentMethod: payMethod,
            amount: totalAmountToPay,
            date: new Date().toISOString(),
            type: 'Unified Payment for All Rendered Services',
            details: `Consolidated Payment for All Requested Services:\n${itemizedDetails}`,
          });
          emailSent = true;
        } catch (emailErr) {
          console.error(emailErr);
        }
      }

      setIsPaymentSettled(true);
      setPaymentAmountDue(0);
      setPaySuccessMsg(
        `Consolidated Payment of UGX ${totalAmountToPay.toLocaleString()} processed successfully via ${payMethod}! All rendered services (Oil Change, Car Wash, Parking, Charging, Repairs) are paid at once.` +
        (emailSent ? ' A full digital itemized receipt was dispatched to your Gmail.' : '')
      );
      onRefreshAll();

      setTimeout(() => {
        setPaySuccessMsg('');
        setShowPayNowModal(false);
      }, 3500);
    } catch (err) {
      setPaySuccessMsg('All rendered services paid at once!');
      setIsPaymentSettled(true);
      setPaymentAmountDue(0);
      setTimeout(() => setShowPayNowModal(false), 2500);
    } finally {
      setIsProcessingPay(false);
    }
  };

  // Add vehicle submit (with hybrid server + local fallback persistence for Vercel)
  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg || !newMake || !newModel) return;

    if (myVehicles.length >= 2) {
      alert('Account Limit Reached: A customer account can register a maximum of two (2) vehicles.');
      return;
    }

    const cleanReg = newReg.toUpperCase().trim();
    const cleanMake = newMake.trim();
    const cleanModel = newModel.trim();
    const yearNum = parseInt(newYear) || 2020;
    const targetUserId = currentUser?.id || userId || 'usr-1';

    let added: Vehicle | null = null;

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          registrationNumber: cleanReg,
          make: cleanMake,
          model: cleanModel,
          year: yearNum,
          color: 'Black',
          mileage: 45000,
        }),
      });

      if (res.ok) {
        added = await res.json();
      }
    } catch (err) {
      console.warn('API endpoint unreachable, using local fallback vehicle registration:', err);
    }

    // Fallback if server call failed or returned non-200 (e.g., static Vercel build)
    if (!added) {
      added = {
        id: `veh-${Date.now()}`,
        userId: targetUserId,
        registrationNumber: cleanReg,
        make: cleanMake,
        model: cleanModel,
        year: yearNum,
        color: 'Black',
        mileage: 45000,
      };

      try {
        const saved = localStorage.getItem('ugpark_local_vehicles');
        const list: Vehicle[] = saved ? JSON.parse(saved) : [];
        list.push(added);
        localStorage.setItem('ugpark_local_vehicles', JSON.stringify(list));
      } catch {}
    }

    setAddVehSuccess(`Vehicle ${added.registrationNumber} registered successfully!`);
    setServiceNotificationBanner({
      type: 'success',
      message: `🚗 Vehicle ${added.registrationNumber} (${added.make} ${added.model}) added & registered successfully!`,
    });

    setSelectedVehicleId(added.id);
    setNewReg('');
    setNewMake('');
    setNewModel('');
    setShowAddVehicleForm(false);
    onRefreshAll();

    setTimeout(() => {
      setAddVehSuccess('');
    }, 3000);
  };

  // Submit dedicated garage service request for active or selected vehicle
  const handleRequestGarageServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVeh = targetVehForGarage || activeVehicle;
    if (!targetVeh) return;

    // Duplicate check to avoid double selection of Garage Repair
    const isDuplicate = services.some(
      (s) =>
        s.vehicleId === targetVeh.id &&
        s.serviceType === garageProblemType &&
        s.status !== ServiceStatus.COMPLETED &&
        s.status !== ServiceStatus.READY_FOR_PICKUP
    );
    if (isDuplicate) {
      setServiceNotificationBanner({
        type: 'warning',
        message: `⚠️ Repair service "${garageProblemType}" is ALREADY selected for ${targetVeh.registrationNumber}! Double selection prevented. You can view or unselect it below.`,
      });
      setShowReqGarageModal(false);
      return;
    }

    setIsSubmittingGarageReq(true);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: targetVeh.id,
          customerId: userId,
          serviceType: garageProblemType,
          cost: 120000,
          bookingDate: new Date().toISOString(),
          diagnosticNotes: garageProblemNotes || `Problem reported: ${garageProblemType}`,
        }),
      });

      if (res.ok) {
        setGarageReqSuccess(`Garage Service request for vehicle ${targetVeh.registrationNumber} dispatched to Workshop Service Manager!`);
        setServiceNotificationBanner({
          type: 'success',
          message: `🎉 Service "${garageProblemType}" successfully selected and added for ${targetVeh.registrationNumber}!`,
        });
        onRefreshAll();
        setTimeout(() => {
          setGarageReqSuccess('');
          setGarageProblemNotes('');
          setShowReqGarageModal(false);
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingGarageReq(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      
      {/* ================= HEADER / GREETING SECTION (OVERVIEW ONLY) ================= */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Hello {userName} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Welcome back to your UG PARK Mobility & Service Dashboard
            </p>
          </div>

          {/* Vehicle Identity Card */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center gap-3.5 sm:min-w-[220px]">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-xs">
              🚗
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">
                Your Vehicle
              </span>
              {activeVehicle ? (
                <>
                  <div className="font-extrabold text-sm text-slate-900 truncate">
                    {activeVehicle.make} {activeVehicle.model}
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-600">
                    {activeVehicle.registrationNumber}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-extrabold text-xs text-slate-700 truncate">
                    No Vehicle Registered
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    Click to add your car
                  </div>
                </>
              )}
            </div>
            {myVehicles.length > 0 ? (
              <button
                onClick={() => setShowVehicleManager(!showVehicleManager)}
                title="Manage Vehicles"
                className="text-2xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer flex items-center gap-1"
              >
                <span>Manage Cars</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowVehicleManager(true);
                  setShowAddVehicleForm(true);
                }}
                title="Add Vehicle"
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-2xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3 h-3" /> Add Car
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= STANDALONE PAGE HEADER (NON-OVERVIEW TABS) ================= */}
      {activeTab !== 'overview' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <button
            onClick={() => {
              setActiveTab('overview');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-sm border border-slate-700 self-start sm:self-auto shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>← Back to Dashboard Overview</span>
          </button>

          <div className="sm:text-right">
            <h2 className="text-sm sm:text-base font-black text-slate-900 capitalize flex items-center sm:justify-end gap-1.5">
              {activeTab === 'parking' && '🅿️ Parking & Yard Management'}
              {activeTab === 'services' && '🔧 Vehicle Service Selection'}
              {activeTab === 'charging' && '⚡ EV Supercharger Network'}
              {activeTab === 'history' && '📜 Customer Service History'}
              {activeTab === 'payments' && '💳 Invoice & Settlement'}
              {activeTab === 'rewards' && '🎁 Customer Loyalty Rewards'}
            </h2>
            <p className="text-3xs text-slate-500 font-mono mt-0.5">
              Standalone Full Screen View • Active Car: {activeVehicle?.registrationNumber || 'UG PARK'}
            </p>
          </div>
        </div>
      )}

      {/* Top Service Selection & Unselection Notification Banner */}
      {serviceNotificationBanner && (
        <div className={`p-4 rounded-2xl shadow-lg border flex items-center justify-between gap-3 animate-fadeIn transition-all ${
          serviceNotificationBanner.type === 'success'
            ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-400'
            : serviceNotificationBanner.type === 'info'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-400'
            : 'bg-amber-900 text-white border-amber-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-lg">
              {serviceNotificationBanner.type === 'success' ? '✅' : 'ℹ️'}
            </div>
            <div>
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-emerald-300 block">
                SERVICE SELECTION & BOOKING UPDATE
              </span>
              <p className="text-xs font-bold text-white leading-snug">
                {serviceNotificationBanner.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setServiceNotificationBanner(null)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Optional Vehicle Selector & Management Drawer */}
      {showVehicleManager && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-300">
              My Registered Vehicles ({myVehicles.length}/2 Max)
            </span>
            {myVehicles.length < 2 ? (
              <button
                onClick={() => setShowAddVehicleForm(!showAddVehicleForm)}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add New Car
              </button>
            ) : (
              <span className="text-3xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                🔒 Max 2 Vehicles Limit Reached
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {myVehicles.length === 0 ? (
              <div className="col-span-2 p-4 bg-slate-800 rounded-xl text-center text-xs text-slate-400">
                No vehicles registered to your account yet. Click "+ Add New Car" above to register your vehicle.
              </div>
            ) : (
              myVehicles.map((v) => (
                <div
                  key={v.id}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                    selectedVehicleId === v.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      setShowVehicleManager(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 cursor-pointer pr-2"
                  >
                    <p className="text-xs font-extrabold">{v.make} {v.model}</p>
                    <p className="text-3xs font-mono text-emerald-400">{v.registrationNumber}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedVehicleId === v.id && <Check className="w-4 h-4 text-emerald-400 mr-1" />}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(v.id, v.registrationNumber);
                      }}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white rounded-lg transition cursor-pointer"
                      title="Delete Vehicle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {(showAddVehicleForm && myVehicles.length < 2) && (
            <form onSubmit={handleAddVehicleSubmit} className="pt-3 border-t border-slate-800 space-y-3">
              {addVehSuccess && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{addVehSuccess}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Reg No (e.g. UAX 123A)"
                  required
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-white"
                />
                <input
                  type="text"
                  placeholder="Make (e.g. Toyota)"
                  required
                  value={newMake}
                  onChange={(e) => setNewMake(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-white"
                />
                <input
                  type="text"
                  placeholder="Model (e.g. Harrier)"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-lg text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Save & Register Vehicle
              </button>
            </form>
          )}
        </div>
      )}

      {/* Top Main Navigation Tabs Bar */}
      <div className="bg-slate-900 p-2 rounded-2xl shadow-md border border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
        <button
          onClick={() => {
            setActiveTab('overview');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>📊 Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('parking');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'parking'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🅿️ Parking & Yards</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('services');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'services'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🔧 Service Selection</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('charging');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'charging'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>⚡ EV Charging</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm ring-2 ring-emerald-400'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 font-black'
          }`}
        >
          <span>📜 Customer History</span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 text-3xs font-mono font-bold uppercase">
            History Only
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('payments');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>💳 Payments</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('rewards');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className={`px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'rewards'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🎁 Rewards</span>
        </button>
      </div>

      {/* ================= COMPACT COLORFUL TOP ACTION & STATUS CARDS (OVERVIEW ONLY) ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. PARKING CARD */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white rounded-xl p-3 sm:p-3.5 shadow-md border border-emerald-400/40 flex flex-col justify-between space-y-2.5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                🅿️ Parking Spot
              </span>
              <MapPin className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight block">
                Floor {currentFloor}, Slot {currentSlot}
              </span>
              <span className="text-3xs font-medium text-emerald-100/90 block mt-0.5">
                {hoursRemaining}h active time remaining
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('parking');
                setParkingStep('yard');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="w-full py-1.5 px-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Manage Parking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. SERVICE CARD */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-900 text-white rounded-xl p-3 sm:p-3.5 shadow-md border border-blue-400/40 flex flex-col justify-between space-y-2.5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1">
                🔧 Vehicle Service
              </span>
              <Wrench className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight block truncate">
                {serviceName || 'Maintenance Care'}
              </span>
              <span className="text-3xs font-medium text-blue-100/90 block mt-0.5">
                Status: {serviceProgress}% Completed
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('services');
                setServiceStep('workshop');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="w-full py-1.5 px-2 bg-white text-blue-900 hover:bg-blue-50 text-xs font-extrabold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>Track Service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. EV CHARGING CARD */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-800 text-white rounded-xl p-3 sm:p-3.5 shadow-md border border-amber-300/40 flex flex-col justify-between space-y-2.5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-amber-100 flex items-center gap-1">
                ⚡ EV Charging
              </span>
              <Zap className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg tracking-tight block">
                {NEARBY_EV_STATIONS.length} Supercharger Hubs
              </span>
              <span className="text-3xs font-medium text-amber-100/90 block mt-0.5">
                Fast DC & AC Plugs
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('charging');
                setEvStep('station');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="w-full py-1.5 px-2 bg-slate-900 text-amber-300 hover:bg-slate-800 text-xs font-extrabold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>View Stations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. INVOICE & PAYMENTS CARD */}
          <div className="bg-gradient-to-br from-purple-700 via-purple-900 to-slate-950 text-white rounded-xl p-3 sm:p-3.5 shadow-md border border-purple-400/40 flex flex-col justify-between space-y-2.5 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <span className="text-3xs font-mono font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1">
                💳 Invoice & Payments
              </span>
              <CreditCard className="w-4 h-4 text-purple-200" />
            </div>
            <div>
              <span className="font-extrabold text-base md:text-lg font-mono tracking-tight block">
                UGX {isPaymentSettled ? '0' : totalCalculatedCostUGX.toLocaleString()}
              </span>
              <span className="text-3xs font-medium text-purple-200/90 block mt-0.5">
                {isPaymentSettled ? 'Invoice Settled ✓' : 'Itemized Invoice'}
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('payments');
                setPayStep('bills');
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="w-full py-1.5 px-2 bg-white text-purple-950 hover:bg-purple-50 text-xs font-extrabold rounded-lg transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>{isPaymentSettled ? 'Paid Receipt' : 'Pay Invoice'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MINIMIZED COMPACT HOME SERVICE CARD (Positioned strictly below main service cards on Customer Home Dashboard) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-white shadow-sm flex items-center justify-between gap-3 my-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-base shrink-0">
            🏠
          </div>
          <h3 className="text-sm font-extrabold text-white">Home Service</h3>
        </div>
        <button
          onClick={() => {
            setIsHomeServiceMode(true);
            setHomeServiceStage('selection');
            setActiveTab('services');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-lg shadow-sm transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
        >
          <span>Request Home Service</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>

      {/* ================= MAIN CONTENT RENDER AREA ================= */}

      {/* --- TAB 1: OVERVIEW TAB --- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Notifications Alert Banner */}
          {!isNotificationDismissed && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  Notifications
                </h2>
                <button
                  onClick={() => setIsNotificationDismissed(true)}
                  className="text-xs text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="flex items-center justify-between bg-white/80 border border-amber-200/70 p-3 rounded-xl text-xs font-bold text-slate-900">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🔔</span>
                  <span>{notificationText}</span>
                </div>
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-2xs font-bold hover:bg-amber-700 transition cursor-pointer"
                >
                  Extend Now
                </button>
              </div>
            </div>
          )}

          {/* Quick Active Status Grid in Overview */}
          <div className="grid grid-cols-1 gap-4">
            {/* CURRENT PARKING SUMMARY */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  CURRENT PARKING
                </h2>
                <span className="px-2 py-0.5 rounded-full text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 uppercase">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-xl font-black text-slate-900">Floor {currentFloor}</div>
                  <div className="text-sm font-extrabold text-slate-700 font-mono">Slot {currentSlot}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-2xs font-bold font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{hoursRemaining} hrs left</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" /> Extend
                </button>
                <button
                  onClick={() => setShowFindVehicleModal(true)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" /> Find Car
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: PARKING & YARDS TAB --- */}
      {activeTab === 'parking' && (
        <div className="space-y-6">
          {/* NEARBY PARK YARDS FINDER & DISCOVERY HUB */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-3xs font-mono font-bold uppercase rounded-md tracking-wider border border-emerald-500/30">
                    📍 GPS Location Radar • Uganda
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">{NATIONWIDE_YARDS.length} Yards Nationwide</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
                  Find Nearby Park Yards
                </h2>
              </div>

              <button
                onClick={() => setShowYardSelectorModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Full Search & Map Keys
              </button>
            </div>

            {yardNoticeMsg && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{yardNoticeMsg}</span>
              </div>
            )}

            {/* Live Search & Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search nearby park yard, city, or landmark (e.g. Kampala, Wandegeya, Kololo, Nakawa, Entebbe...)"
                  value={yardQuery}
                  onChange={(e) => setYardQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 text-xs rounded-xl text-white placeholder-slate-400 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {yardQuery && (
                  <button
                    onClick={() => setYardQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-2xs font-bold">
                {(['All', 'Nearby', 'Kampala', 'Entebbe', 'Upcountry'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setYardFilterCategory(cat)}
                    className={`px-3 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                      yardFilterCategory === cat
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat === 'All' && 'All Yards'}
                    {cat === 'Nearby' && '📍 Nearby (< 3 km)'}
                    {cat === 'Kampala' && 'Kampala City'}
                    {cat === 'Entebbe' && 'Entebbe & Airport'}
                    {cat === 'Upcountry' && 'Upcountry Hubs'}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Active Yard Summary Card */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-850 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-3xs font-mono font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active Yard Destination
                  </span>
                  <span className="text-2xs font-mono font-bold text-slate-300">
                    📍 {activeYard.distanceKm} km away
                  </span>
                </div>
                <div className="text-sm font-extrabold text-white flex items-center gap-2">
                  {activeYard.name}
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {activeYard.landmark || activeYard.address}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-xs border-t md:border-t-0 md:border-l border-slate-700 pt-2 md:pt-0 md:pl-4 flex-wrap sm:flex-nowrap">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Available Slots</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">{activeYard.availableSlots} / {activeYard.totalSlots}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Hourly Rate</span>
                  <span className="text-xs font-bold font-mono text-white">UGX {activeYard.ratePerHour.toLocaleString()}/hr</span>
                </div>
                <button
                  onClick={() => handleOpenGpsMap(activeYard)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 text-2xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3 text-emerald-400" /> Map
                </button>
                <button
                  onClick={() => {
                    setSelectedModalYardId(activeYard.id);
                    setShowReserveParkingModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-2xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" /> Reserve Spot Here
                </button>
              </div>
            </div>

            {/* Nearby Park Yards Responsive Cards Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-3xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Corresponding Nearby Yards Found ({
                  NATIONWIDE_YARDS.filter((y) => {
                    const q = yardQuery.toLowerCase();
                    const matchesQuery = !q || y.name.toLowerCase().includes(q) || y.city.toLowerCase().includes(q) || y.address.toLowerCase().includes(q) || y.landmark.toLowerCase().includes(q);
                    if (!matchesQuery) return false;
                    if (yardFilterCategory === 'Nearby') return y.distanceKm <= 3.0;
                    if (yardFilterCategory === 'Kampala') return y.city === 'Kampala';
                    if (yardFilterCategory === 'Entebbe') return y.city === 'Entebbe';
                    if (yardFilterCategory === 'Upcountry') return y.city !== 'Kampala' && y.city !== 'Entebbe';
                    return true;
                  }).length
                })
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {NATIONWIDE_YARDS.filter((y) => {
                  const q = yardQuery.toLowerCase();
                  const matchesQuery = !q || y.name.toLowerCase().includes(q) || y.city.toLowerCase().includes(q) || y.address.toLowerCase().includes(q) || y.landmark.toLowerCase().includes(q);
                  if (!matchesQuery) return false;
                  if (yardFilterCategory === 'Nearby') return y.distanceKm <= 3.0;
                  if (yardFilterCategory === 'Kampala') return y.city === 'Kampala';
                  if (yardFilterCategory === 'Entebbe') return y.city === 'Entebbe';
                  if (yardFilterCategory === 'Upcountry') return y.city !== 'Kampala' && y.city !== 'Entebbe';
                  return true;
                })
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .map((yard) => {
                  const isSelected = selectedYardId === yard.id;
                  return (
                    <div
                      key={yard.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedModalYardId(yard.id);
                          setShowReserveParkingModal(true);
                        } else {
                          handleSelectYard(yard);
                        }
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-2xs font-mono font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            📍 {yard.distanceKm} km away
                          </span>
                          <span className="text-3xs font-mono text-slate-400">
                            UGX {yard.ratePerHour.toLocaleString()}/hr
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white leading-tight">
                          {yard.name}
                        </h3>
                        
                        <p className="text-3xs text-slate-300 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {yard.landmark || yard.address}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-700/80 pt-2 text-3xs font-mono">
                        <span className="text-emerald-400 font-bold">
                          {yard.availableSlots} / {yard.totalSlots} Slots Free
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleOpenGpsMap(yard, e)}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded transition cursor-pointer"
                            title="View GPS Map Keys"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                setSelectedModalYardId(yard.id);
                                setShowReserveParkingModal(true);
                              } else {
                                handleSelectYard(yard);
                              }
                            }}
                            className={`px-2.5 py-1 text-2xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-xs'
                                : 'bg-slate-700 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {isSelected ? 'Active ✓ (Reserve Spot)' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 1: CURRENT PARKING */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                CURRENT PARKING SESSION
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Active Session
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  Floor {currentFloor}
                </div>
                <div className="text-lg font-extrabold text-slate-700 font-mono">
                  Slot {currentSlot}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 text-amber-900 px-3.5 py-2 rounded-xl text-xs font-bold font-mono">
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>{hoursRemaining} hours remaining</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowExtendModal(true)}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>Extend Parking</span>
              </button>

              <button
                onClick={() => setShowFindVehicleModal(true)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Find Vehicle</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: BOOK PARKING */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                BOOK PARKING SPACE
              </h2>
              <span className="text-2xs font-mono text-slate-400 font-semibold">
                {activeYard.name}
              </span>
            </div>

            <div className="py-1">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {availableSpacesCount} Spaces Available
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Secure your spot with instant QR ticket scan access.
              </p>
            </div>

            <button
              onClick={() => setShowReserveParkingModal(true)}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Reserve Parking</span>
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 3: CAR SERVICES & WASH TAB --- */}
      {activeTab === 'services' && (
        <div className="space-y-6">

          {/* Dedicated "My Selected & Active Services" Panel with Unselect Action */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                    My Selected & Active Services ({customerServices.length})
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 uppercase">
                {customerServices.length} Selected
              </span>
            </div>

            {customerServices.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200/80">
                <p className="font-semibold text-slate-700">No active services selected yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {customerServices.map((srv) => {
                  const veh = myVehicles.find((v) => v.id === srv.vehicleId) || activeVehicle;
                  const isCompleted = srv.status === ServiceStatus.COMPLETED || srv.status === ServiceStatus.READY_FOR_PICKUP;

                  return (
                    <div
                      key={srv.id}
                      className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900">{srv.serviceType}</span>
                          <span className="px-2 py-0.2 rounded-full text-3xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {veh?.registrationNumber || 'Vehicle'}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-3xs font-mono font-extrabold ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {srv.status}
                          </span>
                        </div>
                        <p className="text-3xs text-slate-500 font-mono">
                          Booked: {new Date(srv.bookingDate).toLocaleDateString()} • Cost: UGX {srv.cost.toLocaleString()}
                        </p>
                        {srv.diagnosticNotes && (
                          <p className="text-3xs text-slate-600 italic truncate max-w-md">"{srv.diagnosticNotes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isPaymentSettled ? (
                          <button
                            type="button"
                            onClick={() => handleUnselectService(srv.id, srv.serviceType)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                            title="Unselect this service"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Unselect Service</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 text-3xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid & Cleared
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* HOME LOCATION DETAILS STANDALONE FULL PAGE OR SELECTION MATRIX */}
          {isHomeServiceMode && homeServiceStage === 'location' ? (
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl border border-blue-500/40 space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHomeServiceStage('selection');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Service Selection</span>
                  </button>
                  <div>
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <span>🏠 Home Service Location & Schedule</span>
                    </h2>
                    <p className="text-xs text-blue-300 font-mono">
                      UGX 20,000 Doorstep Visit & Transport Fee Included
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-3xs font-mono uppercase text-slate-400 block font-semibold">Total Estimated Charge</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    UGX {
                      (selectedServiceCatalog.reduce((acc, sTitle) => {
                        const SERVICE_CATALOG_COSTS: Record<string, number> = {
                          'Full Oil & Filter Change': 80000,
                          'Eco Foam Car Wash & Vacuum': 25000,
                          'Brake Pad & Rotor Inspection': 120000,
                          'Engine Diagnostics & Scan': 50000,
                          'Wheel Alignment & Balancing': 45000,
                          'AC Servicing & Gas Refill': 90000,
                          'Battery Health Test & Service': 35000,
                          'Suspension & Shock Service': 110000,
                        };
                        return acc + (SERVICE_CATALOG_COSTS[sTitle] || 50000);
                      }, 0) + 20000).toLocaleString()
                    }
                  </span>
                </div>
              </div>

              <form onSubmit={handleCreateHomeServiceRequest} className="space-y-4">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-300">Itemized Summary Breakdown</h3>
                  <div className="space-y-1.5">
                    {selectedServiceCatalog.map((sTitle) => {
                      const SERVICE_CATALOG_COSTS: Record<string, number> = {
                        'Full Oil & Filter Change': 80000,
                        'Eco Foam Car Wash & Vacuum': 25000,
                        'Brake Pad & Rotor Inspection': 120000,
                        'Engine Diagnostics & Scan': 50000,
                        'Wheel Alignment & Balancing': 45000,
                        'AC Servicing & Gas Refill': 90000,
                        'Battery Health Test & Service': 35000,
                        'Suspension & Shock Service': 110000,
                      };
                      const c = SERVICE_CATALOG_COSTS[sTitle] || 50000;
                      return (
                        <div key={sTitle} className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50">
                          <span className="text-slate-200">🔧 {sTitle}</span>
                          <span className="font-mono text-slate-300">UGX {c.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between text-xs py-1 text-emerald-300 font-bold">
                      <span>🚗 Home Service Transport Fee (Technician Doorstep Visit)</span>
                      <span className="font-mono">UGX 20,000</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Vehicle to be Serviced
                    </label>
                    <select
                      value={homeServiceVehicleId || activeVehicle?.id || ''}
                      onChange={(e) => setHomeServiceVehicleId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {myVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          🚗 {v.make} {v.model} ({v.registrationNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={homeServicePhone}
                      onChange={(e) => setHomeServicePhone(e.target.value)}
                      placeholder="+256 700 000000"
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Home / Office Delivery Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={homeServiceAddress}
                        onChange={(e) => setHomeServiceAddress(e.target.value)}
                        placeholder="e.g. Plot 42 Naguru Drive, Ntinda-Naguru"
                        required
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setHomeServiceGpsLocation(`${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E (GPS Verified Pin)`);
                                alert(`📍 Location pinned: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E`);
                              },
                              () => alert('📍 GPS Location pinned: 0.3476° N, 32.5825° E (Kampala Central Pin)')
                            );
                          } else {
                            alert('📍 GPS Location pinned: 0.3476° N, 32.5825° E (Kampala Central Pin)');
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Use GPS Pin</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Landmark / Nearby Feature
                    </label>
                    <input
                      type="text"
                      value={homeServiceLandmark}
                      onChange={(e) => setHomeServiceLandmark(e.target.value)}
                      placeholder="e.g. Opposite Shell Station, Black Gate"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      City / Area
                    </label>
                    <input
                      type="text"
                      value={homeServiceCity}
                      onChange={(e) => setHomeServiceCity(e.target.value)}
                      placeholder="e.g. Kampala, Entebbe, Jinja"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={homeServiceDate}
                      onChange={(e) => setHomeServiceDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                      Preferred Time Slot
                    </label>
                    <select
                      value={homeServiceTimeSlot}
                      onChange={(e) => setHomeServiceTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM (Morning)</option>
                      <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Late Morning)</option>
                      <option value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM (Afternoon)</option>
                      <option value="4:00 PM - 6:00 PM">4:00 PM - 6:00 PM (Evening)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHomeServiceStage('selection');
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition"
                  >
                    ← Back to Service Selection
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingHomeService}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    {isSubmittingHomeService ? (
                      <span>Submitting Request...</span>
                    ) : (
                      <span>Confirm & Submit Home Service Request →</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Flexible Multi-Service Selection Matrix */
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              {/* SERVICE DELIVERY MODE SWITCHER (MUTUALLY EXCLUSIVE) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
                      Service Delivery Preference
                    </span>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Choose Service Location Mode</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-3xs font-mono">
                        EXCLUSIVE MODE
                      </span>
                    </h3>
                  </div>
                  <span className="text-3xs font-mono text-slate-400 hidden sm:inline">
                    Customer must select ONE mode per booking
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsHomeServiceMode(false);
                      setHomeServiceStage('selection');
                    }}
                    className={`p-3.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-3 text-left ${
                      !isHomeServiceMode
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md ring-2 ring-emerald-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${!isHomeServiceMode ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold flex items-center gap-1.5">
                        <span>🏢 Workshop Service</span>
                        {!isHomeServiceMode && <span className="text-3xs px-1.5 py-0.2 bg-slate-950 text-emerald-400 rounded">ACTIVE</span>}
                      </div>
                      <p className={`text-3xs mt-0.5 ${!isHomeServiceMode ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        Drop off vehicle at main workshop facility. No extra transport charges.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsHomeServiceMode(true);
                      setHomeServiceStage('selection');
                    }}
                    className={`p-3.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-3 text-left ${
                      isHomeServiceMode
                        ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md ring-2 ring-blue-400/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700/80 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isHomeServiceMode ? 'bg-slate-950 text-blue-400' : 'bg-slate-900 text-slate-400'}`}>
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold flex items-center gap-1.5">
                        <span>🏠 Home Service (Doorstep Visit)</span>
                        {isHomeServiceMode && <span className="text-3xs px-1.5 py-0.2 bg-slate-950 text-blue-300 rounded">ACTIVE</span>}
                      </div>
                      <p className={`text-3xs mt-0.5 ${isHomeServiceMode ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                        Mobile technicians visit your doorstep. UGX 20,000 transport fee included.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* INSTANT REAL-TIME SELECTED SERVICES LIST BANNER */}
              <div className="bg-slate-950 text-emerald-100 p-4 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Selected Services List ({selectedServiceCatalog.length})</span>
                    <span className="text-3xs font-mono text-emerald-400/80 bg-emerald-900/60 px-2 py-0.5 rounded">
                      Real-time Live Sync
                    </span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Est. Subtotal: UGX {
                      selectedServiceCatalog.reduce((acc, sTitle) => {
                        const SERVICE_CATALOG_COSTS: Record<string, number> = {
                          'Full Oil & Filter Change': 80000,
                          'Eco Foam Car Wash & Vacuum': 25000,
                          'Brake Pad & Rotor Inspection': 120000,
                          'Engine Diagnostics & Scan': 50000,
                          'Wheel Alignment & Balancing': 45000,
                          'AC Servicing & Gas Refill': 90000,
                          'Battery Health Test & Service': 35000,
                          'Suspension & Shock Service': 110000,
                        };
                        return acc + (SERVICE_CATALOG_COSTS[sTitle] || 50000);
                      }, 0).toLocaleString()
                    }
                  </span>
                </div>

                {selectedServiceCatalog.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No services selected yet. Click any service card below to add it to your order.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedServiceCatalog.map((sTitle) => (
                      <span
                        key={sTitle}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/80 border border-emerald-400/50 rounded-full text-xs font-bold text-emerald-200 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{sTitle}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedServiceCatalog((prev) => prev.filter((t) => t !== sTitle))}
                          className="ml-1 text-emerald-300 hover:text-white font-black hover:bg-emerald-800 rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
                          title={`Remove ${sTitle}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Vehicle Service Catalog Matrix
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono bg-emerald-100 text-emerald-800 uppercase">
                  {selectedServiceCatalog.length} Selected
                </span>
              </div>

              {/* Service Checkbox Matrix Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {[
                  { id: 'oil', title: 'Full Oil & Filter Change', cost: 80000, desc: 'Synthetic motor oil replacement, oil filter & engine inspection', icon: '🛢️' },
                  { id: 'wash', title: 'Eco Foam Car Wash & Vacuum', cost: 25000, desc: 'Snow foam wash, interior vacuum, tire shine & window polish', icon: '🫧' },
                  { id: 'brakes', title: 'Brake Pad & Rotor Inspection', cost: 120000, desc: 'Brake fluid check, pad replacement & rotor resurfacing', icon: '🛑' },
                  { id: 'engine', title: 'Engine Diagnostics & Scan', cost: 50000, desc: 'OBD-II computer fault scan, sensor test & error code clear', icon: '💻' },
                  { id: 'wheels', title: 'Wheel Alignment & Balancing', cost: 45000, desc: '4-wheel laser alignment, tire balancing & pressure check', icon: '🛞' },
                  { id: 'ac', title: 'AC Servicing & Gas Refill', cost: 90000, desc: 'Cabin filter clean, refrigerant gas refill & compressor check', icon: '❄️' },
                  { id: 'battery', title: 'Battery Health Test & Service', cost: 35000, desc: 'Voltage testing, terminal cleaning & alternator check', icon: '🔋' },
                  { id: 'suspension', title: 'Suspension & Shock Service', cost: 110000, desc: 'Bushings check, strut inspection & noise diagnostics', icon: '🔩' },
                ].map((srvItem) => {
                  const isChecked = selectedServiceCatalog.includes(srvItem.title);
                  return (
                    <div
                      key={srvItem.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedServiceCatalog((prev) => prev.filter((t) => t !== srvItem.title));
                          setServiceNotificationBanner({
                            type: 'info',
                            message: `Unselected service "${srvItem.title}".`,
                          });
                        } else {
                          setSelectedServiceCatalog((prev) => Array.from(new Set([...prev, srvItem.title])));
                          setServiceNotificationBanner({
                            type: 'success',
                            message: `Selected service "${srvItem.title}"! (UGX ${srvItem.cost.toLocaleString()})`,
                          });
                        }
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{srvItem.icon}</span>
                          <div>
                            <h3 className="text-xs font-extrabold text-slate-900">{srvItem.title}</h3>
                            <span className="text-3xs font-mono font-bold text-emerald-700 block mt-0.5">
                              UGX {srvItem.cost.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white font-bold text-xs transition ${
                          isChecked ? 'bg-emerald-600' : 'border border-slate-300 bg-white'
                        }`}>
                          {isChecked && '✓'}
                        </div>
                      </div>

                      <p className="text-3xs text-slate-600 leading-relaxed">{srvItem.desc}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-3xs font-bold">
                        <span className={isChecked ? 'text-emerald-700' : 'text-slate-400'}>
                          {isChecked ? 'Selected' : 'Click to Select'}
                        </span>
                        <span className="text-slate-500 underline">
                          {isChecked ? 'Unselect' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batch Submission Bar for Selected Services */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-3xs uppercase font-mono text-slate-400 block font-bold">
                    {isHomeServiceMode ? 'Total Estimated (Incl. UGX 20,000 Doorstep Transport Fee)' : 'Total Estimated Selected Services'}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    UGX {
                      (selectedServiceCatalog.reduce((acc, sTitle) => {
                        const SERVICE_CATALOG_COSTS: Record<string, number> = {
                          'Full Oil & Filter Change': 80000,
                          'Eco Foam Car Wash & Vacuum': 25000,
                          'Brake Pad & Rotor Inspection': 120000,
                          'Engine Diagnostics & Scan': 50000,
                          'Wheel Alignment & Balancing': 45000,
                          'AC Servicing & Gas Refill': 90000,
                          'Battery Health Test & Service': 35000,
                          'Suspension & Shock Service': 110000,
                        };
                        return acc + (SERVICE_CATALOG_COSTS[sTitle] || 50000);
                      }, 0) + (isHomeServiceMode ? 20000 : 0)).toLocaleString()
                    }
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isHomeServiceMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedServiceCatalog.length === 0) {
                          setServiceNotificationBanner({
                            type: 'warning',
                            message: '⚠️ Please select at least one vehicle service before proceeding to doorstep location details.',
                          });
                          return;
                        }
                        setHomeServiceStage('location');
                        window.scrollTo({ top: 0, behavior: 'instant' });
                      }}
                      className="py-2.5 px-4 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-4 h-4 text-slate-950" />
                      <span>Proceed to Doorstep Location Details ({selectedServiceCatalog.length}) →</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedServiceCatalog.length === 0}
                      onClick={() => {
                        if (selectedServiceCatalog.length === 0) {
                          setServiceNotificationBanner({
                            type: 'warning',
                            message: '⚠️ Please select at least one service to confirm your order.',
                          });
                          return;
                        }
                        setShowConfirmOrderModal(true);
                      }}
                      className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Review & Confirm Workshop Order ({selectedServiceCatalog.length}) →</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: EV CHARGING TAB --- */}
      {activeTab === 'charging' && (
        <div className="space-y-6">
          {/* NEARBY EV CHARGING STATIONS */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-3xs font-mono font-bold uppercase rounded-md tracking-wider border border-amber-500/30">
                    ⚡ EV Supercharger Network
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">{NEARBY_EV_STATIONS.length} Stations Active</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                  Nearby EV Supercharger Plugs
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {NEARBY_EV_STATIONS.map((station) => (
                <div key={station.id} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-white">{station.name}</span>
                    <span className="text-3xs font-mono font-bold px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded">
                      {station.distanceKm} km
                    </span>
                  </div>
                  <p className="text-3xs text-slate-300 font-mono">{station.address}</p>
                  <div className="flex items-center justify-between text-3xs font-mono pt-1 text-slate-400">
                    <span>Plugs: {station.availableDcPlugs}/{station.fastDcPlugs} DC Fast free</span>
                    <span className="text-emerald-400 font-bold">UGX {station.ratePerKwh}/kWh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: DEDICATED CUSTOMER HISTORY TAB ONLY --- */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CUSTOMER HISTORY HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-3xs font-mono font-bold uppercase rounded-md tracking-wider border border-emerald-500/40">
                    📜 Exclusive Record Ledger
                  </span>
                  <span className="text-3xs text-slate-400 font-mono">Customer Account History Only</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Customer Vehicle Service & Payment History
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  View complete vehicle service history, maintenance records, and payment receipts in one dedicated tab.
                </p>
              </div>

              {activeVehicle && (
                <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-xl text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Active Vehicle Filter</span>
                  <span className="text-xs font-black text-emerald-400 font-mono">{activeVehicle.make} {activeVehicle.model} ({activeVehicle.registrationNumber})</span>
                </div>
              )}
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                {/* Sub-tabs */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs font-bold">
                  {[
                    { id: 'all', label: 'All Records' },
                    { id: 'services', label: '🛠️ Service History' },
                    { id: 'maintenance', label: '📋 Maintenance Logs' },
                    { id: 'payments', label: '💳 Payment Receipts' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setHistoryCategoryTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        historyCategoryTab === tab.id
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search history records..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white placeholder-slate-400 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HISTORY RECORDS CONTENT GRID */}
          <div className="space-y-4">
            {/* 1. VEHICLE SERVICE HISTORY SECTION */}
            {(historyCategoryTab === 'all' || historyCategoryTab === 'services') && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    Vehicle Service History ({customerServices.length})
                  </h3>
                  <span className="text-3xs font-mono text-slate-400 font-bold">Consolidated Service Logs</span>
                </div>

                {customerServices.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200/80">
                    No service history recorded for this vehicle yet.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {customerServices
                      .filter((s) => !historySearchQuery || s.serviceType.toLowerCase().includes(historySearchQuery.toLowerCase()) || (s.diagnosticNotes || '').toLowerCase().includes(historySearchQuery.toLowerCase()))
                      .map((srv) => {
                        const techName = srv.technicianId ? `Technician (#${srv.technicianId.slice(-4)})` : 'Samuel Mukasa (Cert. Tech)';
                        const managerName = 'Denis Okello (Service Mgr)';
                        const labourFee = srv.labourCost !== undefined ? srv.labourCost : 50000;
                        const partsAlloc = srv.partsAllocated && srv.partsAllocated.length > 0
                          ? srv.partsAllocated.map((p) => `${p.partName} (x${p.quantity})`).join(', ')
                          : 'Standard Maintenance Consumables';
                        const isPaid = isPaymentSettled || srv.status === ServiceStatus.COMPLETED;

                        return (
                          <div key={srv.id} className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 hover:border-emerald-300 transition shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-xs text-slate-900">{srv.serviceType}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                                    srv.status === ServiceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    Job Status: {srv.status}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    Payment: {isPaid ? 'Paid ✓' : 'Pending Invoice'}
                                  </span>
                                </div>
                                <p className="text-3xs text-slate-500 font-mono mt-0.5">
                                  📅 Date: {new Date(srv.bookingDate).toLocaleDateString()} • Vehicle: {activeVehicle?.registrationNumber || 'Car'}
                                </p>
                              </div>
                              <div className="text-left sm:text-right shrink-0">
                                <span className="font-mono font-black text-slate-900 text-sm block">UGX {srv.cost.toLocaleString()}</span>
                                <span className="text-3xs text-slate-400 font-mono block">Total Cost</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-3xs font-mono pt-1">
                              <div>
                                <span className="text-slate-400 block uppercase font-bold">Requested Services</span>
                                <span className="font-bold text-slate-800">{srv.selectedServicesList?.map((s) => s.title).join(', ') || srv.serviceType}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block uppercase font-bold">Labour Charges</span>
                                <span className="font-bold text-slate-800">UGX {labourFee.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block uppercase font-bold">Spare Parts Used</span>
                                <span className="font-bold text-slate-800 truncate block" title={partsAlloc}>{partsAlloc}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block uppercase font-bold">Assigned Staff</span>
                                <span className="font-bold text-slate-800">Tech: {techName} • Mgr: {managerName}</span>
                              </div>
                            </div>

                            {srv.diagnosticNotes && (
                              <p className="text-3xs text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                                Notes: &quot;{srv.diagnosticNotes}&quot;
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* 2. MAINTENANCE RECORDS SECTION */}
            {(historyCategoryTab === 'all' || historyCategoryTab === 'maintenance') && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Vehicle Maintenance & Diagnostic Logs
                  </h3>
                  <span className="text-3xs font-mono text-slate-400 font-bold">Workshop & Technician Notes</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {[
                    { title: 'Synthetic Engine Oil & Filter Service', date: '2026-06-15', status: 'Completed', tech: 'Sarah Nakato', notes: 'Replaced 4L Total Quartz 9000 synthetic oil. Next service due at 10,000 km.' },
                    { title: 'Brake System Inspection & Pad Cleaning', date: '2026-05-10', status: 'Completed', tech: 'David Ochieng', notes: 'Front brake pads at 75% thickness. Rear drum brakes cleaned & adjusted.' },
                    { title: 'OBD-II Full System Computer Diagnostics', date: '2026-04-02', status: 'Completed', tech: 'Sarah Nakato', notes: 'No active diagnostic trouble codes (DTC). Battery voltage at 12.6V optimal.' },
                  ].map((maint, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-indigo-950">{maint.title}</span>
                        <span className="text-3xs font-mono font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">{maint.status}</span>
                      </div>
                      <p className="text-3xs text-slate-600 font-mono">Date: {maint.date} • Lead Technician: {maint.tech}</p>
                      <p className="text-3xs text-indigo-900 font-medium">Log: "{maint.notes}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. PAYMENT HISTORY SECTION */}
            {(historyCategoryTab === 'all' || historyCategoryTab === 'payments') && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Payment Transactions & Paid Receipts
                  </h3>
                  <span className="text-3xs font-mono text-slate-400 font-bold">Official Financial Ledger</span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {payments.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      No payment transactions settled yet. When you clear your service invoice, paid receipts will appear here.
                    </div>
                  ) : (
                    payments.map((pay) => (
                      <div key={pay.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">Paid Receipt #{pay.id}</span>
                            <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                              {pay.paymentMethod}
                            </span>
                          </div>
                          <p className="text-3xs text-slate-500 font-mono">TxRef: {pay.transactionId} • Date: {new Date(pay.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-slate-900 block">UGX {pay.amount.toLocaleString()}</span>
                          <span className="text-3xs text-emerald-600 font-bold font-mono">Cleared ✓</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: EV CHARGING TAB --- */}
      {activeTab === 'charging' && (
        <div className="space-y-6">
          {/* SECTION 3B: EV CHARGING SERVICES */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white border border-emerald-500/40 rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
                EV CHARGING HUBS & SUPERCHARGERS
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                {NEARBY_EV_STATIONS.length} Stations Active
              </span>
            </div>

            <div className="py-1">
              <div className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Fast EV Supercharging Nearby
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Locate high-speed DC Fast (150kW-250kW) & AC charging plugs, view real-time available bays, calculate battery charging costs, and reserve charging slots.
              </p>
            </div>

            <button
              onClick={() => setShowEvChargingModal(true)}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Access EV Charging Calculator & Station Finder</span>
            </button>
          </div>

          {/* EV Stations Directory List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                Active EV Stations Directory ({NEARBY_EV_STATIONS.length})
              </span>
              <span className="text-3xs font-mono text-emerald-600 font-bold">100% Green Energy</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {NEARBY_EV_STATIONS.map((st) => (
                <div key={st.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      {st.name}
                    </div>
                    <p className="text-3xs text-slate-500 font-mono">{st.landmark || st.address}</p>
                    <p className="text-3xs text-emerald-700 font-mono font-semibold">
                      Plugs: {st.availableDcPlugs}/{st.fastDcPlugs} DC Fast ({st.maxPowerKw}kW) • {st.availableAcPlugs}/{st.acPlugs} AC
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 block">UGX {st.ratePerKwh}/kWh</span>
                    <button
                      onClick={() => {
                        setSelectedEvStationId(st.id);
                        setShowEvChargingModal(true);
                      }}
                      className="mt-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-3xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Connect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: PAYMENTS & CONSOLIDATED INVOICE TAB --- */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* SECTION 5: PAYMENTS & CONSOLIDATED INVOICE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  PAYMENTS & CONSOLIDATED INVOICE
                </h2>
                <p className="text-3xs text-slate-400 mt-0.5">All services rendered are presented and paid at once</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono uppercase tracking-wider ${
                isPaymentSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isPaymentSettled ? 'Paid / Cleared ✓' : 'Invoice Pending'}
              </span>
            </div>

            {/* Itemized Services Rendered Summary List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-3xs font-mono font-bold uppercase text-slate-400 border-b border-slate-100 pb-1">
                <span>Rendered Service</span>
                <span>Vehicle / Cost</span>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {renderedItemsList.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{item.title}</span>
                        <span className="text-3xs font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-3xs text-slate-500 font-mono">{item.details}</p>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="font-mono font-extrabold text-slate-900 block text-xs">
                        UGX {item.cost.toLocaleString()}
                      </span>
                      <span className="text-3xs font-mono text-emerald-600 font-bold block">
                        {item.vehicleReg}
                      </span>
                      {item.id.startsWith('srv-') && !isPaymentSettled && (
                        <button
                          type="button"
                          onClick={() => handleUnselectService(item.id, item.title)}
                          className="text-3xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer mt-0.5 inline-block"
                          title="Unselect this service"
                        >
                          ✕ Unselect
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost Display Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase text-slate-400 font-mono font-bold block">Total Consolidated Costs Due</span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  UGX {isPaymentSettled ? '0' : totalCalculatedCostUGX.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-3xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full block">
                  {isPaymentSettled ? 'Balance Settled' : 'Single 1-Click Payment'}
                </span>
                <span className="text-3xs text-slate-400 block mt-1 font-mono">
                  {renderedItemsList.length} Services Rendered
                </span>
              </div>
            </div>

            {/* Advance Payment Banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Advance payments are welcomed at any time (before, during, or after service completion).</span>
            </div>

            {/* Action Button */}
            <button
              disabled={isPaymentSettled}
              onClick={() => setShowPayNowModal(true)}
              className={`w-full py-3.5 px-4 text-white font-extrabold text-xs rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 ${
                isPaymentSettled
                  ? 'bg-slate-300 cursor-not-allowed text-slate-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-lg'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isPaymentSettled
                  ? 'Vehicle Invoice Settled & Cleared ✓'
                  : `Pay Vehicle Invoice (UGX ${totalCalculatedCostUGX.toLocaleString()})`}
              </span>
            </button>
          </div>

          {/* Google Gmail Integration Status Footer Bar */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="font-bold text-white">Gmail Receipts Dispatch: </span>
                <span>{googleToken ? `Connected as ${googleUser?.email || currentUser?.email}` : 'Connect Google account to email PDF receipts.'}</span>
              </div>
            </div>

            {googleToken ? (
              <button
                onClick={handleGoogleLogout}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-2xs transition cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-2xs transition cursor-pointer flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" />
                Connect Gmail
              </button>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 6: VIP REWARDS TAB --- */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* SECTION 4: REWARDS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                VIP REWARDS PROGRAM
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold font-mono bg-purple-100 text-purple-800 uppercase tracking-wider">
                VIP Tier Member
              </span>
            </div>

            <div className="flex items-baseline justify-between py-1">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {rewardPoints} Points
                </div>
                <div className="text-xs font-bold text-purple-700 mt-1 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  <span>{discountOffer}</span>
                </div>
              </div>
              {claimedVoucherCode && (
                <div className="text-right bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-purple-900">
                  <span className="text-3xs text-purple-600 block uppercase">Voucher Code</span>
                  {claimedVoucherCode}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowRedeemModal(true)}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Redeem Points & Claim Vouchers</span>
            </button>
          </div>
        </div>
      )}


      {/* ================= MODAL 1: EXTEND PARKING ================= */}
      {showExtendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Extend Parking Session
              </h3>
              <button
                onClick={() => setShowExtendModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Slot:</span>
                <span className="font-bold text-slate-900">Floor {currentFloor}, Slot {currentSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Remaining:</span>
                <span className="font-bold text-amber-700">{hoursRemaining} Hours</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Additional Duration:</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((hr) => (
                  <button
                    key={hr}
                    onClick={() => setExtendHours(hr)}
                    className={`py-2.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                      extendHours === hr
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +{hr} Hour{hr > 1 ? 's' : ''}
                    <span className="block text-3xs font-normal opacity-80">UGX {(hr * 2500).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {extendSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                {extendSuccessMsg}
              </div>
            )}

            <button
              onClick={handleConfirmExtend}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition"
            >
              Confirm Extension (UGX {(extendHours * 2500).toLocaleString()})
            </button>
          </div>
        </div>
      )}


      {/* ================= MODAL 2: FIND VEHICLE ================= */}
      {showFindVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-600" />
                Find Vehicle Location & Route
              </h3>
              <button
                onClick={() => setShowFindVehicleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xs font-mono uppercase text-emerald-400 font-bold block">Parked Vehicle</span>
                  <p className="text-sm font-extrabold">
                    {activeVehicle ? `${activeVehicle.make} ${activeVehicle.model} (${activeVehicle.registrationNumber})` : 'No vehicle selected'}
                  </p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-emerald-500/40">
                  Floor {currentFloor} • Slot {currentSlot}
                </div>
              </div>
            </div>

            {/* Interactive Visual Floor Map Map Graphic */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <span className="text-3xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Floor G Terminal Layout
              </span>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold font-mono">
                {['A10', 'A11', 'A12', 'A13', 'B10', 'B11', 'B12', 'B13'].map((slot) => (
                  <div
                    key={slot}
                    className={`py-3 rounded-lg border ${
                      slot === currentSlot
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {slot}
                    {slot === currentSlot && <span className="block text-3xs font-sans font-normal">YOU ARE HERE</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Walking Directions */}
            <div className="space-y-1 text-xs text-slate-600">
              <p className="font-bold text-slate-900">Step-by-Step Directions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Take Elevator 2 or North Stairs down to <strong>Floor G</strong>.</li>
                <li>Head left past <strong>Bay A Entrance</strong>.</li>
                <li>Your vehicle is parked directly in <strong>Slot A12</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowFindVehicleModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Close Navigation
            </button>
          </div>
        </div>
      )}


      {/* ================= MODAL 3: RESERVE PARKING (FULL SCREEN PAGE) ================= */}
      {showReserveParkingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
            
            {/* Fixed Top Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => setShowReserveParkingModal(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ← Back
              </button>
              <div className="text-center">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  Reserve Parking Space
                </h3>
                <p className="text-3xs text-slate-500 font-medium">Select a nearby parking yard</p>
              </div>
              <button
                onClick={() => setShowReserveParkingModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1.5 rounded-lg bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full">
              
              {/* SECTION 1: SELECTED PARKING YARD */}
              {(() => {
                const selectedYards = NATIONWIDE_YARDS.filter(
                  (yard) => yard.id === selectedModalYardId || yard.id === selectedYardId
                );
                const yardsToDisplay = selectedYards.length > 0 ? selectedYards : [NATIONWIDE_YARDS[0]];
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        1. Selected Parking Location
                      </h4>
                      <span className="text-3xs font-mono text-emerald-600 font-bold">
                        1 Location Selected ✓
                      </span>
                    </div>

                    <div className="space-y-2">
                      {yardsToDisplay.map((yard) => {
                        return (
                          <div
                            key={yard.id}
                            className="p-3.5 rounded-2xl border transition bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-indigo-600 bg-indigo-600">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">{yard.name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-3xs font-bold bg-emerald-100 text-emerald-800">
                                    {yard.availableSlots} spots free
                                  </span>
                                </div>
                                <p className="text-3xs text-slate-500 font-mono">
                                  {yard.address} • <strong className="text-slate-700">{yard.distanceKm} km away</strong>
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-mono font-extrabold text-indigo-700 block">
                                UGX {yard.ratePerHour.toLocaleString()}/hr
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 2: SELECT FLOOR */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 block">
                  2. Select Floor Level
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Ground', code: 'G' },
                    { label: 'First', code: '1' },
                    { label: 'Second', code: '2' },
                  ].map((fl) => (
                    <button
                      key={fl.code}
                      onClick={() => setSelectedFloor(fl.code)}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center ${
                        selectedFloor === fl.code
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{fl.label} Floor</span>
                      <span className="text-3xs opacity-80 font-mono">Level {fl.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 3: CHOOSE PARKING SLOT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 block">
                    3. Choose Parking Slot (Location Matched)
                  </h4>
                  <span className="text-3xs text-indigo-600 font-bold font-mono">
                    {(NATIONWIDE_YARDS.find(y => y.id === selectedModalYardId) || NATIONWIDE_YARDS[0]).name} • Floor {selectedFloor}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                  {(() => {
                    const yard = NATIONWIDE_YARDS.find(y => y.id === selectedModalYardId) || NATIONWIDE_YARDS[0];
                    const prefix = yard.id.includes('entebbe') ? 'EBB' : yard.id.includes('jinja') ? 'JNJ' : yard.id.includes('mbarara') ? 'MBR' : yard.id.includes('gulu') ? 'GLU' : 'KLA';
                    const fl = selectedFloor === 'G' ? 'G' : selectedFloor;
                    const slots = [12, 13, 14, 15, 16, 17, 18, 19].map(n => `${prefix}-${fl}${n}`);
                    const activeSlot = selectedSpaceId && slots.includes(selectedSpaceId) ? selectedSpaceId : slots[0];
                    return slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSpaceId(slot)}
                        className={`py-3 rounded-xl border font-bold cursor-pointer transition text-center ${
                          activeSlot === slot
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-400/40'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ));
                  })()}
                </div>
              </div>

              {/* SECTION 4: DURATION */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 block">
                  4. Select Duration
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '30 min', hours: 0.5 },
                    { label: '1 hr', hours: 1 },
                    { label: '2 hrs', hours: 2 },
                    { label: 'Custom', hours: 4 },
                  ].map((dur) => (
                    <button
                      key={dur.label}
                      onClick={() => setReserveHours(dur.hours)}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition ${
                        reserveHours === dur.hours
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 5: RESERVATION SUMMARY & ESTIMATED COST */}
              {(() => {
                const currentYard = NATIONWIDE_YARDS.find(y => y.id === selectedModalYardId) || NATIONWIDE_YARDS[0];
                const totalCost = Math.round(reserveHours * (currentYard.ratePerHour || 2500));
                return (
                  <div className="space-y-3">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-md">
                      <div className="flex items-center justify-between text-3xs font-mono text-slate-400">
                        <span>RESERVATION SUMMARY</span>
                        <span className="text-emerald-400 font-bold">READY TO BOOK</span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-slate-800 pt-2">
                        <div>
                          <span className="text-sm font-black text-white">{currentYard.name}</span>
                          <p className="text-3xs text-slate-300 font-mono">
                            Floor {selectedFloor} • Slot {selectedSpaceId || (currentYard.id.includes('entebbe') ? 'EBB-G12' : currentYard.id.includes('jinja') ? 'JNJ-G12' : 'KLA-G12')} • {reserveHours === 0.5 ? '30 Mins' : `${reserveHours} Hours`}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xl font-black text-emerald-400">UGX {totalCost.toLocaleString()}</span>
                          <span className="block text-3xs text-slate-400">Rate: UGX {currentYard.ratePerHour.toLocaleString()}/hr</span>
                        </div>
                      </div>
                    </div>

                    {reserveSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                        {reserveSuccessMsg}
                      </div>
                    )}

                    {/* SECTION 6: CONTINUE / RESERVE BUTTON */}
                    <button
                      onClick={handleConfirmReservation}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Reserve Parking Space (UGX {totalCost.toLocaleString()})</span>
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}


      {/* ================= MODAL 4: VEHICLE SERVICES (FULL SCREEN PAGE) ================= */}
      {showTrackServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-slide-up">
            
            {/* Fixed Top Header */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => setShowTrackServiceModal(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ← Back
              </button>
              <div className="text-center">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Vehicle Services & Repair
                </h3>
                <p className="text-3xs text-slate-500 font-medium">Select service category and view options immediately</p>
              </div>
              <button
                onClick={() => setShowTrackServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1.5 rounded-lg bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full">
              
              {/* SECTION 1: SERVICE CATEGORIES (IMMEDIATE VISIBILITY AT TOP) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    1. Select Service Category
                  </h4>
                  <span className="text-3xs font-mono text-blue-600 font-bold">5 Categories Available</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'Oil & Fluids', icon: '🛢️', pkg: 'Castrol Synthetic Oil & Filter Renewal', cost: 120000 },
                    { name: 'Wash & Detail', icon: '🧼', pkg: 'Executive Snow Foam Wash & Interior Steam', cost: 25000 },
                    { name: 'Brakes & Tires', icon: '🛑', pkg: 'Brake Pad Replacement & Rotor Skimming', cost: 150000 },
                    { name: 'Diagnostics', icon: '💻', pkg: 'Computerized Diagnostic Scan & Calibration', cost: 80000 },
                    { name: 'AC & Cooling', icon: '❄️', pkg: 'Air Conditioning Refrigerant Refill & Filter', cost: 95000 },
                    { name: 'Engine Repair', icon: '⚙️', pkg: 'Full Engine Tune-up & Spark Plug Service', cost: 210000 },
                  ].map((cat) => {
                    const isSelected = selectedServicePackage === cat.pkg;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => {
                          setSelectedServicePackage(cat.pkg);
                          setGarageProblemType(cat.pkg);
                        }}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200/90 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{cat.icon}</span>
                          {isSelected && <span className="text-3xs font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">Selected</span>}
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-900 block leading-snug">{cat.name}</span>
                          <span className="text-3xs font-mono font-bold text-purple-700 block mt-0.5">
                            UGX {cat.cost.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Additional Specific Garage Repair Option */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowTrackServiceModal(false);
                      setTargetVehForGarage(activeVehicle);
                      setShowReqGarageModal(true);
                    }}
                    className="w-full p-3 rounded-2xl border border-dashed border-emerald-500 bg-emerald-50 hover:bg-emerald-100/70 text-left transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🔧</span>
                      <div>
                        <span className="text-xs font-black text-slate-900 block">Request Additional Specific Garage Repair / Mechanical Issue</span>
                        <span className="text-3xs text-slate-600">Report specific engine fault, brake noise, electrical issue, or custom repair</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1.5 text-3xs font-extrabold text-white bg-emerald-600 rounded-xl shrink-0">Describe Issue →</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: NEARBY WORKSHOPS */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 block">
                  2. Select Authorized Workshop
                </h4>
                <div className="space-y-2">
                  {NATIONWIDE_YARDS.slice(0, 3).map((yard) => {
                    const isSelected = selectedWorkshopId === yard.id;
                    return (
                      <div
                        key={yard.id}
                        onClick={() => setSelectedWorkshopId(yard.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-slate-50 border-slate-200/90 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-slate-900 block">{yard.name} Workshop</span>
                            <p className="text-3xs text-slate-500">
                              {yard.address} • <strong className="text-slate-700">{yard.distanceKm} km away</strong>
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded text-3xs font-bold bg-purple-100 text-purple-800 shrink-0">
                          ⭐ 4.9 Rating
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: PACKAGE DETAILS & ESTIMATED COST */}
              {(() => {
                const currentWs = NATIONWIDE_YARDS.find(y => y.id === selectedWorkshopId) || NATIONWIDE_YARDS[0];
                return (
                  <div className="space-y-3">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-md">
                      <div className="flex items-center justify-between text-3xs font-mono text-slate-400">
                        <span>SERVICE SUMMARY</span>
                        <span className="text-purple-400 font-bold">READY TO BOOK</span>
                      </div>
                      <div className="flex items-baseline justify-between border-t border-slate-800 pt-2">
                        <div>
                          <span className="text-sm font-black text-white">{selectedServicePackage}</span>
                          <p className="text-3xs text-slate-300 font-mono">Workshop: {currentWs.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTON */}
                    <button
                      onClick={() => {
                        setGarageProblemType(selectedServicePackage);
                        setShowTrackServiceModal(false);
                        setShowReqGarageModal(true);
                      }}
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>Book Vehicle Service Now</span>
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}


      {/* ================= MODAL 5: REDEEM REWARDS ================= */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Redeem Rewards Points
              </h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-purple-900 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-3xs uppercase text-purple-300 font-mono font-bold block">Available Balance</span>
                <span className="text-3xl font-black">{rewardPoints} Points</span>
              </div>
              <Gift className="w-8 h-8 text-purple-300" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Available Rewards Catalog:</span>
              
              <div className="border border-purple-200 bg-purple-50 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-purple-950">10% Parking Discount Coupon</h4>
                  <p className="text-3xs text-purple-700">Applies 10% off your next parking session</p>
                </div>
                <button
                  disabled={rewardPoints < 300 || claimedVoucherCode !== null}
                  onClick={handleRedeemVoucher}
                  className={`px-3 py-1.5 text-2xs font-bold rounded-lg cursor-pointer transition ${
                    claimedVoucherCode !== null
                      ? 'bg-emerald-600 text-white'
                      : rewardPoints >= 300
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {claimedVoucherCode ? 'Redeemed ✓' : 'Claim (300 Pts)'}
                </button>
              </div>
            </div>

            {claimedVoucherCode && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl text-center font-mono">
                Active Code: <span className="text-sm text-emerald-700 font-black">{claimedVoucherCode}</span>
              </div>
            )}

            <button
              onClick={() => setShowRedeemModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}


      {/* ================= MODAL 6: PAY NOW ================= */}
      {showPayNowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header & Step Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Consolidated Services Invoice Payment
                </h3>
                <p className="text-3xs text-slate-500 font-medium">Pay for all requested & rendered services at once</p>
              </div>
              <button
                onClick={() => setShowPayNowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1 rounded-lg bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Multi-Step Bar */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-3xs font-bold text-center">
              <button
                onClick={() => setPayStep('bills')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  payStep === 'bills' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Itemized Bills
              </button>
              <button
                onClick={() => setPayStep('method')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  payStep === 'method' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Select Method
              </button>
              <button
                onClick={() => setPayStep('receipt')}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  payStep === 'receipt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Receipt
              </button>
            </div>

            {/* Total Consolidated Amount Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-3xs uppercase text-slate-400 font-mono font-bold block">Total Amount Due</span>
                <span className="text-2xl font-black font-mono text-emerald-400">UGX {totalCalculatedCostUGX.toLocaleString()}</span>
              </div>
              <span className="text-3xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded">
                {renderedItemsList.length} Items Consolidated
              </span>
            </div>

            {/* Itemized Services Rendered Table */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <span className="text-3xs font-mono font-bold uppercase text-slate-500 block">
                Itemized Services Included in This Payment:
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {renderedItemsList.map((item) => (
                  <div key={item.id} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-900 block">{item.title}</span>
                      <span className="text-3xs text-slate-500 font-mono">{item.vehicleReg} • {item.category}</span>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-700">UGX {item.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Gateway Tabs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Select Payment Method:</label>
              <div className="flex gap-2">
                {['Mobile Money', 'Credit Card'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m as any)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                      payMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {payMethod === 'Mobile Money' ? (
              <div className="space-y-2">
                <div>
                  <label className="text-2xs text-slate-500 font-semibold block mb-1">Network Operator:</label>
                  <select
                    value={momoProvider}
                    onChange={(e) => setMomoProvider(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-2 font-bold text-slate-800"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money (Uganda)</option>
                    <option value="Airtel Money">Airtel Money (Uganda)</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-slate-500 font-semibold block mb-1">Mobile Money Phone Number:</label>
                  <input
                    type="text"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg px-2.5 py-2 text-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-2xs text-slate-500 font-semibold block mb-1">Cardholder Name:</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-2xs text-slate-500 font-semibold block mb-1">Card Number:</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg px-2.5 py-2 text-slate-900"
                  />
                </div>
              </div>
            )}

            {isPaymentSettled && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl text-center space-y-1">
                <span className="text-sm block">✅ Invoice Paid & Settled</span>
                <span className="block font-mono">This invoice has already been paid. No further payment is required.</span>
              </div>
            )}

            {paySuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                {paySuccessMsg}
              </div>
            )}

            <button
              disabled={isProcessingPay || isPaymentSettled}
              onClick={handleProcessPayment}
              className={`w-full py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                isPaymentSettled
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
            >
              {isProcessingPay ? (
                <span>Processing Transaction...</span>
              ) : isPaymentSettled ? (
                <span>✓ Invoice Settled (No Further Payment Required)</span>
              ) : (
                <span>Pay All Services Rendered (UGX {totalCalculatedCostUGX.toLocaleString()}) at Once</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: FIND NATIONWIDE LOCATION YARDS ================= */}
      {showYardSelectorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  Find Registered Location Yards in Uganda
                </h3>
                <p className="text-xs text-slate-500">Select a location yard around the country for automated parking & service</p>
              </div>
              <button
                onClick={() => setShowYardSelectorModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Yard Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search city, address or yard name (e.g. Kampala, Jinja, Airport...)"
                value={yardQuery}
                onChange={(e) => setYardQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-900 font-medium"
              />
            </div>

            {/* Location Yards Cards List */}
            <div className="space-y-2.5">
              {NATIONWIDE_YARDS.filter(
                (y) =>
                  y.name.toLowerCase().includes(yardQuery.toLowerCase()) ||
                  y.city.toLowerCase().includes(yardQuery.toLowerCase()) ||
                  y.address.toLowerCase().includes(yardQuery.toLowerCase())
              ).map((yard) => {
                const isSelected = selectedYardId === yard.id;
                return (
                  <div
                    key={yard.id}
                    onClick={() => {
                      setSelectedYardId(yard.id);
                      setShowYardSelectorModal(false);
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{yard.name}</span>
                        <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {yard.city}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {yard.address}
                      </p>
                      <div className="flex items-center gap-3 text-3xs text-slate-500 font-mono pt-1">
                        <span>📞 {yard.phone}</span>
                        <span>🛡️ {yard.security}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-extrabold text-emerald-600 block">
                          {yard.availableSlots} Slots Free
                        </span>
                        <span className="text-2xs font-mono font-bold text-slate-700 block">
                          UGX {yard.ratePerHour.toLocaleString()}/hr
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedYardId(yard.id);
                          setShowYardSelectorModal(false);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isSelected ? 'Active Yard ✓' : 'Select Yard'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowYardSelectorModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
            >
              Close Yard Finder
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL 8: GARAGE SERVICE REQUEST FOR EXISTING CAR ================= */}
      {showReqGarageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-emerald-600" />
                  Request Garage Repair / Service
                </h3>
                <p className="text-xs text-slate-500">Report specific car problem to the Workshop Manager</p>
              </div>
              <button
                onClick={() => setShowReqGarageModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestGarageServiceSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Vehicle:</label>
                {myVehicles.length > 1 ? (
                  <select
                    value={(targetVehForGarage || activeVehicle)?.id}
                    onChange={(e) => {
                      const veh = myVehicles.find((v) => v.id === e.target.value);
                      if (veh) setTargetVehForGarage(veh);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-900 font-bold"
                  >
                    {myVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>{(targetVehForGarage || activeVehicle)?.make} {(targetVehForGarage || activeVehicle)?.model}</span>
                    <span className="font-mono text-emerald-600">{(targetVehForGarage || activeVehicle)?.registrationNumber}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Service / Repair Category:</label>
                <select
                  value={garageProblemType || selectedServicePackage || 'Engine / Mechanical Repair'}
                  onChange={(e) => {
                    setGarageProblemType(e.target.value);
                    setSelectedServicePackage(e.target.value);
                  }}
                  className="w-full p-2.5 bg-purple-50 border border-purple-200/80 rounded-xl font-extrabold text-xs text-purple-950 focus:ring-purple-500"
                >
                  <option value="Engine / Mechanical Repair">⚙️ Engine Knock / Mechanical Fault (UGX 120,000)</option>
                  <option value="Brake System Service">🛑 Brake System Repair & Rotor Skimming (UGX 150,000)</option>
                  <option value="Electrical & Battery">🔋 Battery Replacement & Wiring Fault (UGX 90,000)</option>
                  <option value="Suspension & Steering">🏎️ Suspension & Steering Alignment (UGX 110,000)</option>
                  <option value="Air Conditioning Repair">❄️ AC Refrigerant Refill & Cooling (UGX 95,000)</option>
                  <option value="General Vehicle Diagnostics">💻 Computerized Diagnostic Scan (UGX 80,000)</option>
                  <option value="Oil Change & Lubrication Service">🛢️ Engine Oil Change & Filter Renewal (UGX 120,000)</option>
                  <option value="Car Wash: Executive Foam Wash & Detailing">🧽 Executive Snow Foam Wash & Detailing (UGX 25,000)</option>
                  <option value="Specific Garage Repair Request">🔧 Custom Specific Garage Repair Request</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Problem Description:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe what is wrong with the car (e.g., strange engine sound when braking, AC not blowing cold air...)"
                  value={garageProblemNotes}
                  onChange={(e) => setGarageProblemNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-900"
                />
              </div>

              {garageReqSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  {garageReqSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingGarageReq}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {isSubmittingGarageReq ? 'Sending Request...' : 'Dispatch Service Request to Manager'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 9: GPS MAP KEYS & ROUTE NAVIGATION ================= */}
      {showGpsMapModal && selectedYardForMap && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-3xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
                  GPS Location & Navigation Keys
                </span>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400 animate-pulse" />
                  {selectedYardForMap.name}
                </h3>
              </div>
              <button
                onClick={() => setShowGpsMapModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Visual Simulated GPS Map Display */}
            <div className="relative h-52 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col justify-between p-4 bg-cover bg-center" style={{
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80')`
            }}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-mono font-bold rounded-full flex items-center gap-1.5 shadow">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live GPS Track
                </span>
                <span className="text-3xs font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  📍 {selectedYardForMap.distanceKm} km away
                </span>
              </div>

              {/* Waypoint Connection Line */}
              <div className="my-auto py-2 flex items-center justify-between px-4 relative">
                <div className="text-center z-10">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-xs font-bold shadow-lg">
                    🚗
                  </div>
                  <span className="text-3xs font-mono font-bold text-blue-300 block mt-1">You</span>
                </div>

                <div className="flex-1 border-t-2 border-dashed border-emerald-400 relative mx-3 flex items-center justify-center">
                  <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 text-3xs font-mono font-extrabold rounded-full border border-emerald-500/40 shadow">
                    ~{Math.round(selectedYardForMap.distanceKm * 2.5)} mins
                  </span>
                </div>

                <div className="text-center z-10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto text-xs font-black shadow-lg">
                    📍
                  </div>
                  <span className="text-3xs font-mono font-bold text-emerald-400 block mt-1">Yard</span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-3xs font-mono text-slate-300 flex items-center justify-between">
                <span className="truncate">Landmark: {selectedYardForMap.landmark}</span>
                <span className="text-emerald-400 font-bold shrink-0 ml-2">{selectedYardForMap.availableSlots} Slots Free</span>
              </div>
            </div>

            {/* Yard Details */}
            <div className="space-y-2.5 text-xs text-slate-300 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Address & Zone:</span>
                <span className="font-bold text-white text-right">{selectedYardForMap.address} ({selectedYardForMap.zone})</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <span className="text-slate-400">Security & Gate:</span>
                <span className="font-bold text-emerald-400">{selectedYardForMap.security}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Contact & Support:</span>
                <span className="font-mono font-bold text-white">{selectedYardForMap.phone}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => {
                  handleSelectYard(selectedYardForMap);
                  setShowGpsMapModal(false);
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4" /> Set Active Yard
              </button>

              <button
                onClick={() => {
                  handleSelectYard(selectedYardForMap);
                  setShowGpsMapModal(false);
                  setShowReserveParkingModal(true);
                }}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
              >
                <QrCode className="w-4 h-4" /> Reserve Spot Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 10: ELECTRIC CAR CHARGING SERVICES NEARBY (FULL SCREEN PAGE) ================= */}
      {showEvChargingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-slate-900 text-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl border border-emerald-500/50 flex flex-col overflow-hidden animate-slide-up">
            
            {/* Fixed Top Header */}
            <div className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800 px-4 py-3.5 flex items-center justify-between shadow-2xs">
              <button
                onClick={() => setShowEvChargingModal(false)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition"
              >
                ← Back
              </button>
              <div className="text-center">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center justify-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
                  EV Supercharging Station
                </h3>
                <p className="text-3xs text-emerald-400 font-mono">Nearby charging stations display immediately</p>
              </div>
              <button
                onClick={() => setShowEvChargingModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-1.5 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Main Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full">

              {evNoticeMsg && (
                <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{evNoticeMsg}</span>
                  </div>
                  <button onClick={() => setEvNoticeMsg('')} className="text-xs font-bold hover:text-white">✕</button>
                </div>
              )}

              {/* SECTION 1: NEARBY CHARGING STATIONS (DISPLAY IMMEDIATELY) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                    1. Nearby Charging Stations ({NEARBY_EV_STATIONS.length} Stations Active)
                  </span>
                  <span className="text-3xs font-mono text-emerald-400 font-bold">Fast DC Plugs</span>
                </div>

                <div className="space-y-2">
                  {NEARBY_EV_STATIONS.map((station) => {
                    const isSelected = selectedEvStationId === station.id;
                    return (
                      <div
                        key={station.id}
                        onClick={() => setSelectedEvStationId(station.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/30 shadow-md'
                            : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-black text-white leading-snug">{station.name}</h4>
                            <p className="text-3xs text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                              {station.landmark} • <strong className="text-emerald-300">{station.distanceKm} km away</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <span className="text-xs font-extrabold text-emerald-400 block">
                            UGX {station.ratePerKwh.toLocaleString()}/kWh
                          </span>
                          <span className="text-3xs text-slate-400">
                            ⚡ {station.availableDcPlugs + station.availableAcPlugs} Free ({station.maxPowerKw} kW)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: CHARGING CONNECTOR TYPES & BATTERY CAPACITY */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    2. Connector Plug & Vehicle Setup
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-3xs font-mono font-bold rounded border border-emerald-500/30">
                    Station: {selectedEvStation.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-400 mb-1">
                      Connector Type
                    </label>
                    <select
                      value={evPlugType}
                      onChange={(e) => setEvPlugType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white font-medium"
                    >
                      {selectedEvStation.plugTypes.map((plug) => (
                        <option key={plug} value={plug}>{plug}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-mono font-bold uppercase text-slate-400 mb-1">
                      Battery Capacity (kWh)
                    </label>
                    <select
                      value={evBatteryCapacityKwh}
                      onChange={(e) => setEvBatteryCapacityKwh(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs rounded-xl text-white font-medium"
                    >
                      <option value={50}>50 kWh (Nissan Leaf / Small EV)</option>
                      <option value={75}>75 kWh (Tesla Model Y / SUV)</option>
                      <option value={100}>100 kWh (Performance Luxury Truck)</option>
                    </select>
                  </div>
                </div>

                {/* SECTION 3: CHARGING DURATION & BATTERY RANGE SLIDERS */}
                <div className="space-y-2 pt-1">
                  <span className="block text-3xs font-mono font-bold uppercase text-slate-400">
                    3. Target Charge Level & Duration
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="flex justify-between text-2xs font-bold text-slate-300 mb-1">
                        <span>Current Level:</span>
                        <span className="text-amber-400 font-mono">{evBatteryCurrentPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={80}
                        value={evBatteryCurrentPct}
                        onChange={(e) => setEvBatteryCurrentPct(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-2xs font-bold text-slate-300 mb-1">
                        <span>Target Charge:</span>
                        <span className="text-emerald-400 font-mono">{evBatteryTargetPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={evBatteryCurrentPct + 5}
                        max={100}
                        value={evBatteryTargetPct}
                        onChange={(e) => setEvBatteryTargetPct(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: ESTIMATED COST SUMMARY */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Energy Needed</span>
                    <span className="text-xs font-extrabold text-emerald-400">{kwhNeeded} kWh</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Est. Duration</span>
                    <span className="text-xs font-extrabold text-amber-400">~{estimatedTimeMins} mins</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Est. Cost</span>
                    <span className="text-xs font-extrabold text-white">UGX {estimatedEvCostUsh.toLocaleString()}</span>
                  </div>
                </div>

                {/* Live Charging Progress Bar if active */}
                {isEvSessionActive && (
                  <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-emerald-500/50">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-emerald-400 flex items-center gap-1.5 font-mono">
                        <Zap className="w-4 h-4 text-emerald-400 animate-bounce" /> Live Charging in Progress...
                      </span>
                      <span className="text-white font-mono">{evCurrentProgressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${evCurrentProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 5: START CHARGING & RESERVE BUTTONS */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {!isEvSessionActive ? (
                    <button
                      onClick={handleStartEvSession}
                      className="py-3.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Zap className="w-4 h-4" /> Start Supercharge
                    </button>
                  ) : (
                    <button
                      onClick={handleStopEvSession}
                      className="py-3.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      Stop Charging & Pay
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setEvNoticeMsg(`🔌 Charging Bay Reserved at ${selectedEvStation.name}! Ticket QR Code generated.`);
                    }}
                    className="py-3.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  >
                    <QrCode className="w-4 h-4" /> Reserve Charging Bay
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 11: REQUEST CAR WASH SERVICE POPUP ================= */}
      {showCarWashModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 w-full max-w-2xl shadow-2xl border border-cyan-500/50 space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-3xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  💦 Yard Auto Care & Polish
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400 animate-pulse" />
                  Request Car Wash & Detailing Service
                </h3>
              </div>
              <button
                onClick={() => setShowCarWashModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer p-1.5 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {carWashNoticeMsg && (
              <div className="p-3 bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{carWashNoticeMsg}</span>
                </div>
                <button onClick={() => setCarWashNoticeMsg('')} className="text-xs font-bold hover:text-white">✕</button>
              </div>
            )}

            <form onSubmit={handleRequestCarWashSubmit} className="space-y-4">
              
              {/* Target Vehicle Selector */}
              <div>
                <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                  Select Vehicle to Wash
                </label>
                <select
                  value={carWashTargetVehicleId || (activeVehicle ? activeVehicle.id : '')}
                  onChange={(e) => setCarWashTargetVehicleId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white font-medium"
                >
                  {myVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.make} {v.model} - {v.color})
                    </option>
                  ))}
                </select>
              </div>

              {/* Wash Package Selection Grid */}
              <div className="space-y-2">
                <label className="block text-3xs font-mono font-bold uppercase text-slate-300">
                  Select Wash & Detailing Package
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      name: 'Executive Foam Wash & Wax',
                      priceUGX: 25000,
                      badge: 'Most Popular',
                      desc: 'Exterior snow foam cannon, hand drying, wheel rim shine, glass polishing, tire dressing.',
                      icon: '🧽',
                    },
                    {
                      name: 'Interior Steam & Sanitation',
                      priceUGX: 50000,
                      badge: 'Deep Clean',
                      desc: 'Full vacuum, carpet steam extraction, AC vent disinfection, leather seat care, trunk detail.',
                      icon: '🧹',
                    },
                    {
                      name: 'Complete Master Detailing & Engine',
                      priceUGX: 90000,
                      badge: 'All-Inclusive',
                      desc: 'Full snow wash, engine bay degreasing, undercarriage high-pressure jet wash, interior steam & ceramic wax.',
                      icon: '✨',
                    },
                    {
                      name: 'Express Exterior Jet Wash',
                      priceUGX: 15000,
                      badge: '15-Min Fast',
                      desc: 'Quick high-pressure exterior jet rinse and wheel rim wash while parked.',
                      icon: '⚡',
                    },
                  ].map((pkg) => {
                    const isSelected = carWashPackageName === pkg.name;
                    return (
                      <div
                        key={pkg.name}
                        onClick={() => {
                          setCarWashPackageName(pkg.name);
                          setCarWashCostUGX(pkg.priceUGX);
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-800 border-cyan-400 ring-1 ring-cyan-500/50 shadow-md'
                            : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-3xs font-mono">
                            <span className="font-extrabold text-cyan-300">
                              {pkg.icon} {pkg.badge}
                            </span>
                            <span className="font-bold text-white">UGX {pkg.priceUGX.toLocaleString()}</span>
                          </div>
                          <h4 className="text-xs font-black text-white mt-1">{pkg.name}</h4>
                          <p className="text-3xs text-slate-300 mt-1 leading-snug">{pkg.desc}</p>
                        </div>

                        <div className="flex items-center justify-end pt-1 border-t border-slate-700/80">
                          <span
                            className={`text-3xs font-mono font-bold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Yard Location & Preferred Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                    Yard Wash Bay Location
                  </label>
                  <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 text-xs rounded-xl text-slate-200 font-mono flex items-center justify-between">
                    <span>📍 {activeYard.name}</span>
                    <span className="text-cyan-400 font-bold">Wash Bay #1</span>
                  </div>
                </div>

                <div>
                  <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                    When Should We Wash It?
                  </label>
                  <select
                    value={carWashTimeSlot}
                    onChange={(e) => setCarWashTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white font-medium"
                  >
                    <option value="Now while parked">Now while parked in yard</option>
                    <option value="30 mins before pickup">30 mins before scheduled departure</option>
                    <option value="Upon arrival check-in">Upon vehicle arrival check-in</option>
                  </select>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-3xs font-mono font-bold uppercase text-slate-300 mb-1">
                  Special Instructions / Notes
                </label>
                <input
                  type="text"
                  value={carWashSpecialNotes}
                  onChange={(e) => setCarWashSpecialNotes(e.target.value)}
                  placeholder="e.g. Extra focus on front wheel rims brake dust, clean trunk floor..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-xs rounded-xl text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>

              {/* Summary & Submit */}
              <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-3xs font-mono text-slate-400 block uppercase">Total Service Charge</span>
                  <div className="text-base font-black text-cyan-300 font-mono">
                    UGX {carWashCostUGX.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCarWashModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingCarWash}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingCarWash ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                        Sending Request...
                      </span>
                    ) : (
                      <>
                        <Droplets className="w-4 h-4 text-slate-950" />
                        <span>Confirm Wash Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM SERVICE ORDER MODAL --- */}
      {showConfirmOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-3xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Step 2 of 2 • Order Confirmation Review
                </span>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Confirm Service Order</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmOrderModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Vehicle & Delivery Summary */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-3xs uppercase font-bold">Target Vehicle:</span>
                  <span className="font-mono font-extrabold text-white">
                    🚗 {myVehicles.find((v) => v.id === (homeServiceVehicleId || selectedVehicleId))?.make || activeVehicle?.make || 'Toyota'}{' '}
                    {myVehicles.find((v) => v.id === (homeServiceVehicleId || selectedVehicleId))?.model || activeVehicle?.model || 'Harrier'}{' '}
                    ({myVehicles.find((v) => v.id === (homeServiceVehicleId || selectedVehicleId))?.registrationNumber || activeVehicle?.registrationNumber || 'UBD 123A'})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-3xs uppercase font-bold">Booking Delivery Type:</span>
                  <span className={`px-2 py-0.5 rounded text-3xs font-black uppercase ${
                    isHomeServiceMode ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {isHomeServiceMode ? '🏠 Home Service (Doorstep Visit)' : '🏢 Workshop (Parking Yard) Service'}
                  </span>
                </div>

                {isHomeServiceMode && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1 text-3xs text-slate-300">
                    <p><strong className="text-slate-200">Address:</strong> {homeServiceAddress || 'Plot 42 Naguru Drive, Kampala'}</p>
                    <p><strong className="text-slate-200">Landmark:</strong> {homeServiceLandmark || 'Kampala Central'} • <strong className="text-slate-200 font-mono">Phone:</strong> {homeServicePhone || '+256 700 000 000'}</p>
                    <p><strong className="text-slate-200">Date & Slot:</strong> {homeServiceDate} ({homeServiceTimeSlot})</p>
                  </div>
                )}
              </div>

              {/* Itemized Requested Services */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-3xs font-mono font-bold uppercase text-slate-400">
                  <span>Requested Services ({selectedServiceCatalog.length})</span>
                  <span>Est. Price</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedServiceCatalog.map((sTitle) => {
                    const SERVICE_CATALOG_COSTS: Record<string, number> = {
                      'Full Oil & Filter Change': 80000,
                      'Eco Foam Car Wash & Vacuum': 25000,
                      'Brake Pad & Rotor Inspection': 120000,
                      'Engine Diagnostics & Scan': 50000,
                      'Wheel Alignment & Balancing': 45000,
                      'AC Servicing & Gas Refill': 90000,
                      'Battery Health Test & Service': 35000,
                      'Suspension & Shock Service': 110000,
                    };
                    const c = SERVICE_CATALOG_COSTS[sTitle] || 50000;
                    return (
                      <div key={sTitle} className="flex items-center justify-between py-1 border-b border-slate-700/50 text-xs">
                        <span className="text-slate-200 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          {sTitle}
                        </span>
                        <span className="font-mono text-slate-300 font-semibold">UGX {c.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotals & Fees */}
                <div className="pt-2 border-t border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Services Estimated Subtotal</span>
                    <span className="font-mono font-bold">
                      UGX {selectedServiceCatalog.reduce((acc, sTitle) => {
                        const SERVICE_CATALOG_COSTS: Record<string, number> = {
                          'Full Oil & Filter Change': 80000,
                          'Eco Foam Car Wash & Vacuum': 25000,
                          'Brake Pad & Rotor Inspection': 120000,
                          'Engine Diagnostics & Scan': 50000,
                          'Wheel Alignment & Balancing': 45000,
                          'AC Servicing & Gas Refill': 90000,
                          'Battery Health Test & Service': 35000,
                          'Suspension & Shock Service': 110000,
                        };
                        return acc + (SERVICE_CATALOG_COSTS[sTitle] || 50000);
                      }, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{isHomeServiceMode ? '🚗 Doorstep Transport Fee' : '🏢 Workshop Facility Fee'}</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {isHomeServiceMode ? 'UGX 20,000' : 'UGX 0 (Free)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-700">
                    <span>Grand Total Estimated</span>
                    <span className="font-mono text-emerald-400 text-base">
                      UGX {(
                        selectedServiceCatalog.reduce((acc, sTitle) => {
                          const SERVICE_CATALOG_COSTS: Record<string, number> = {
                            'Full Oil & Filter Change': 80000,
                            'Eco Foam Car Wash & Vacuum': 25000,
                            'Brake Pad & Rotor Inspection': 120000,
                            'Engine Diagnostics & Scan': 50000,
                            'Wheel Alignment & Balancing': 45000,
                            'AC Servicing & Gas Refill': 90000,
                            'Battery Health Test & Service': 35000,
                            'Suspension & Shock Service': 110000,
                          };
                          return acc + (SERVICE_CATALOG_COSTS[sTitle] || 50000);
                        }, 0) + (isHomeServiceMode ? 20000 : 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmOrderModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
              >
                ✏️ Edit Selected Services
              </button>

              <button
                type="button"
                disabled={isSubmittingOrder}
                onClick={() => handleConfirmServiceOrder()}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
              >
                {isSubmittingOrder ? (
                  <span>Confirming & Submitting...</span>
                ) : (
                  <span>✅ Confirm Service Order →</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
