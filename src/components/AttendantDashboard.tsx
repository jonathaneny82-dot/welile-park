import React, { useState, useEffect } from 'react';
import {
  User,
  Vehicle,
  ParkingSpace,
  ParkingReservation,
  ParkingSpaceStatus,
  ReservationStatus,
  VehicleService,
  ServiceStatus,
} from '../types';
import {
  Menu,
  X,
  Search,
  Bell,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Car,
  ParkingSquare,
  Calendar,
  LogOut,
  ChevronRight,
  ArrowRightLeft,
  Settings,
  ArrowLeft,
  Sliders,
  Check,
  UserCheck,
  Shield,
  Zap,
} from 'lucide-react';

interface AttendantDashboardProps {
  currentUser?: User | null;
  users: User[];
  vehicles: Vehicle[];
  parkingSpaces: ParkingSpace[];
  reservations: ParkingReservation[];
  services?: VehicleService[];
  onRefreshAll: () => void;
  onSignOut: () => void;
  googleUser?: any;
  handleGoogleLogin?: () => void;
}

type PageView =
  | 'dashboard'
  | 'scan'
  | 'verification'
  | 'reservations'
  | 'search'
  | 'manual_entry'
  | 'manual_exit'
  | 'yard'
  | 'notifications'
  | 'settings';

export const AttendantDashboard: React.FC<AttendantDashboardProps> = ({
  currentUser,
  users,
  vehicles,
  parkingSpaces,
  reservations,
  services = [],
  onRefreshAll,
  onSignOut,
  googleUser,
  handleGoogleLogin,
}) => {
  // Navigation Page State
  const [activePage, setActivePage] = useState<PageView>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [ticketInput, setTicketInput] = useState('');
  const [scannedReservation, setScannedReservation] = useState<ParkingReservation | null>(null);

  // Verification Checkboxes
  const [checkRegistration, setCheckRegistration] = useState(false);
  const [checkSlot, setCheckSlot] = useState(false);
  const [checkIdentity, setCheckIdentity] = useState(false);

  // Action Confirmation Modal State
  const [pendingAction, setPendingAction] = useState<'check-in' | 'check-out' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Reservation Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationFilter, setReservationFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');

  // Manual Entry / Exit Form State
  const [manualPlate, setManualPlate] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualSlot, setManualSlot] = useState('');

  // Local Recent Activity Log (5 transactions)
  const [activityLogs, setActivityLogs] = useState<
    { id: string; plate: string; type: 'entry' | 'exit'; time: string; slot: string }[]
  >([
    { id: '1', plate: 'UAX 456B', type: 'entry', time: '10:42 AM', slot: 'Slot A12' },
    { id: '2', plate: 'UBA 102C', type: 'exit', time: '10:15 AM', slot: 'Slot B04' },
    { id: '3', plate: 'UCD 889K', type: 'entry', time: '09:50 AM', slot: 'Slot A05' },
    { id: '4', plate: 'UEX 331M', type: 'exit', time: '09:20 AM', slot: 'Slot C01' },
    { id: '5', plate: 'UFN 554P', type: 'entry', time: '08:45 AM', slot: 'Slot B11' },
  ]);

  // Derived Statistics
  const totalSpaces = parkingSpaces.length || 100;
  const availableSpaces = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.AVAILABLE).length;
  const occupiedSpaces = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.OCCUPIED).length;
  const reservedSpaces = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.RESERVED).length;
  const occupancyPercent = Math.round(((occupiedSpaces + reservedSpaces) / totalSpaces) * 100);

  // Look up scanned vehicle, customer & space
  const currentVehicle = scannedReservation
    ? vehicles.find((v) => v.id === scannedReservation.vehicleId)
    : null;
  const currentCustomer = scannedReservation
    ? users.find((u) => u.id === scannedReservation.userId)
    : null;
  const currentSpace = scannedReservation
    ? parkingSpaces.find((s) => s.id === scannedReservation.parkingId)
    : null;

  // Determine if vehicle is already parked/checked-in
  const isVehicleParked =
    scannedReservation?.status === ReservationStatus.ACTIVE ||
    (scannedReservation?.status as string) === 'Checked In';

  // Navigation Helper with Auto-close Drawer
  const navigateTo = (page: PageView) => {
    setActivePage(page);
    setIsDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Scroll to top on activePage change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activePage]);

  // Dynamic Attendant Notifications for Entry Details & Service Completion
  const entryNotifications = reservations.map((res) => {
    const veh = vehicles.find((v) => v.id === res.vehicleId);
    return {
      id: `res-notif-${res.id}`,
      type: 'entry' as const,
      title: '🚗 New Vehicle Entry & Yard Selected',
      time: 'Recently Registered',
      text: `Car Reg: ${veh?.registrationNumber || 'Registered Car'} (${veh?.make || 'Vehicle'} ${veh?.model || ''}, ${veh?.color || 'Silver'}) selected yard space ${res.parkingId || 'Kampala Central Yard Slot A12'}.`,
      badge: 'Vehicle Entry Alert',
      plate: veh?.registrationNumber || 'Car',
    };
  });

  const completionNotifications = services
    .filter((s) => s.status === ServiceStatus.COMPLETED || (s.status as string) === 'Ready for Pickup')
    .map((srv) => {
      const veh = vehicles.find((v) => v.id === srv.vehicleId);
      return {
        id: `srv-notif-${srv.id}`,
        type: 'completion' as const,
        title: '✅ Car Service Completed',
        time: 'Just now',
        text: `Car Reg: ${veh?.registrationNumber || 'Car'} (${veh?.make || 'Vehicle'} ${veh?.model || ''}): Service "${srv.serviceType}" completed by technician. Parked in ${srv.assignedDeliveryBay || 'Slot A12 (Pickup Bay)'}.`,
        badge: 'Service Complete',
        plate: veh?.registrationNumber || 'Car',
      };
    });

  const attendantSystemNotifs = [
    ...entryNotifications,
    ...completionNotifications,
    { id: 'sys-1', type: 'system' as const, title: 'Gate Scanner Online', time: 'Just now', text: 'QR Ticket scanner calibrated and online for gate verification.', badge: 'System', plate: 'N/A' },
  ];

  // Perform QR / Code Search & Open Verification Page
  const handleVerifyTicket = (codeToVerify?: string) => {
    const code = (codeToVerify || ticketInput).trim();
    if (!code) {
      setErrorMessage('Please enter or scan a valid QR ticket code or vehicle plate.');
      return;
    }

    const matched = reservations.find(
      (r) => r.qrCode.toLowerCase() === code.toLowerCase() || r.id.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      setScannedReservation(matched);
      setErrorMessage(null);
      setCheckRegistration(false);
      setCheckSlot(false);
      setCheckIdentity(false);
      navigateTo('verification');
    } else {
      // Create a temporary mock reservation if code matches a vehicle plate
      const vehMatch = vehicles.find((v) => v.registrationNumber.toLowerCase() === code.toLowerCase());
      if (vehMatch) {
        const dummyRes: ParkingReservation = {
          id: `res-${Date.now()}`,
          userId: 'usr-customer-1',
          vehicleId: vehMatch.id,
          parkingId: 'Slot A12',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000 * 4).toISOString(),
          amount: 15000,
          status: ReservationStatus.PENDING,
          qrCode: code,
        };
        setScannedReservation(dummyRes);
        setErrorMessage(null);
        setCheckRegistration(false);
        setCheckSlot(false);
        setCheckIdentity(false);
        navigateTo('verification');
      } else {
        setErrorMessage(`No matching reservation found for "${code}".`);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    }
  };

  // Execute Entry / Exit Action
  const handleExecuteAction = async () => {
    if (!scannedReservation || !pendingAction) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/parking/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: scannedReservation.qrCode,
          action: pendingAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to complete ${pendingAction}.`);
      }

      const plateNum = currentVehicle?.registrationNumber || scannedReservation.qrCode || 'Vehicle';
      const slotNum = currentSpace?.spaceNumber || scannedReservation.parkingId || 'Slot A12';

      // Update activity logs
      const newLog = {
        id: `act-${Date.now()}`,
        plate: plateNum.toUpperCase(),
        type: pendingAction === 'check-in' ? ('entry' as const) : ('exit' as const),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        slot: slotNum,
      };
      setActivityLogs([newLog, ...activityLogs.slice(0, 4)]);

      // Show success feedback
      setActionSuccessMessage(
        pendingAction === 'check-in'
          ? `Entry Authorized! Vehicle ${plateNum} checked into ${slotNum}.`
          : `Exit Authorized! Vehicle ${plateNum} cleared for exit.`
      );

      onRefreshAll();
      setPendingAction(null);
      setCheckRegistration(false);
      setCheckSlot(false);
      setCheckIdentity(false);

      // Auto-return to home screen after 2.5s
      setTimeout(() => {
        setActionSuccessMessage(null);
        navigateTo('dashboard');
      }, 2500);

    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing action.');
      setPendingAction(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Manual Form Submission
  const handleManualSubmit = (type: 'entry' | 'exit') => {
    if (!manualPlate) {
      setErrorMessage('Please enter a vehicle registration plate number.');
      return;
    }

    const slotNum = manualSlot || 'Slot A12';
    const newLog = {
      id: `act-${Date.now()}`,
      plate: manualPlate.toUpperCase(),
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      slot: slotNum,
    };

    setActivityLogs([newLog, ...activityLogs.slice(0, 4)]);
    setActionSuccessMessage(
      type === 'entry'
        ? `Manual Entry Authorized for ${manualPlate.toUpperCase()} (${slotNum}).`
        : `Manual Exit Authorized for ${manualPlate.toUpperCase()}.`
    );

    setManualPlate('');
    setManualName('');
    setManualSlot('');

    setTimeout(() => {
      setActionSuccessMessage(null);
      navigateTo('dashboard');
    }, 2000);
  };

  // Filtered reservations for the Reservations page
  const filteredReservations = reservations.filter((r) => {
    const veh = vehicles.find((v) => v.id === r.vehicleId);
    const usr = users.find((u) => u.id === r.userId);
    const q = searchQuery.toLowerCase();

    const matchesQuery =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.parkingId.toLowerCase().includes(q) ||
      (veh && veh.registrationNumber.toLowerCase().includes(q)) ||
      (usr && usr.name.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (reservationFilter === 'active') return r.status === ReservationStatus.ACTIVE || (r.status as string) === 'Checked In';
    if (reservationFilter === 'pending') return r.status === ReservationStatus.PENDING;
    if (reservationFilter === 'completed') return r.status === ReservationStatus.COMPLETED;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans antialiased flex flex-col relative w-full overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ==============================================================
          1. SLIDE-IN HAMBURGER MENU (DRAWER)
          ============================================================== */}
      {/* Backdrop */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity duration-200 ease-in-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-[#FFFFFF] text-[#1E293B] shadow-2xl flex flex-col border-r border-[#E2E8F0] transition-transform duration-200 ease-in-out transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981] text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ParkingSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1E293B] tracking-tight">UG PARK</h2>
              <p className="text-[11px] text-[#10B981] font-bold">Yard Attendant</p>
            </div>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu Links */}
        <div className="p-4 space-y-1 overflow-y-auto flex-1">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-3 pb-2">
            Navigation Menu
          </p>

          {[
            { id: 'dashboard', label: 'Dashboard', icon: ParkingSquare },
            { id: 'scan', label: 'Scan Vehicle', icon: QrCode },
            { id: 'reservations', label: 'Reservations', icon: Calendar },
            { id: 'search', label: 'Search Vehicle', icon: Search },
            { id: 'manual_entry', label: 'Manual Entry', icon: CheckCircle2 },
            { id: 'manual_exit', label: 'Manual Exit', icon: ArrowRightLeft },
            { id: 'yard', label: 'Parking Yard', icon: Car },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as PageView)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 font-black border-l-4 border-purple-600 shadow-xs'
                    : 'text-[#1E293B] hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-[#64748B]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-purple-600" />}
              </button>
            );
          })}

          <div className="pt-4 border-t border-[#E2E8F0] mt-4">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold text-[#DC2626] hover:bg-red-50 transition cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-[#DC2626]" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-semibold">
            <span>Operation Speed</span>
            <span className="text-[#10B981] font-bold">&lt; 10s Fast Check</span>
          </div>
        </div>
      </aside>

      {/* ==============================================================
          2. HEADER (Hamburger, Title, Notifications, Profile)
          ============================================================== */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 sm:px-6 py-3.5 shadow-xs flex items-center justify-between">
        
        {/* Left: Hamburger Button (☰) & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer border border-purple-200 active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-purple-600" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-black text-[#1E293B]">
              {activePage === 'dashboard' && 'Yard Attendant Dashboard'}
              {activePage === 'scan' && 'Scan Vehicle'}
              {activePage === 'verification' && 'Vehicle Verification'}
              {activePage === 'reservations' && 'Reservations'}
              {activePage === 'search' && 'Search Vehicle'}
              {activePage === 'manual_entry' && 'Manual Entry'}
              {activePage === 'manual_exit' && 'Manual Exit'}
              {activePage === 'yard' && 'Parking Yard'}
              {activePage === 'notifications' && 'Notifications'}
              {activePage === 'settings' && 'Settings'}
            </h1>
          </div>
        </div>

        {/* Right: Notification Icon & Profile */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigateTo('notifications')}
            className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#1E293B] transition cursor-pointer border border-[#E2E8F0]"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 text-[#1E293B]" />
            {attendantSystemNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white animate-pulse">
                {attendantSystemNotifs.length}
              </span>
            )}
          </button>

          <div
            onClick={() => navigateTo('settings')}
            className="w-9 h-9 rounded-2xl bg-[#10B981] text-white font-black flex items-center justify-center text-xs shadow-xs border border-emerald-600 cursor-pointer"
            title="User Profile & Settings"
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 text-[#DC2626] px-4 py-3 text-xs sm:text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Success Feedback Modal */}
      {actionSuccessMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#E2E8F0]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#22C55E] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1E293B]">Success</h3>
              <p className="text-xs text-[#64748B] font-medium mt-1 leading-relaxed">
                {actionSuccessMessage}
              </p>
            </div>
            <button
              onClick={() => {
                setActionSuccessMessage(null);
                navigateTo('dashboard');
              }}
              className="w-full py-3.5 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs shadow-md transition cursor-pointer"
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* ==============================================================
          3. MAIN CONTAINER
          ============================================================== */}
      <main className="flex-1 p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">

        {/* ------------------------------------------------------------
            HOME PAGE (DASHBOARD)
            ------------------------------------------------------------ */}
        {activePage === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Greeting */}
            <div className="text-center space-y-1 py-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#1E293B]">
                Welcome, {currentUser?.name?.split(' ')[0] || 'Attendant'}
              </h2>
              <p className="text-xs font-semibold text-[#64748B]">
                Fast vehicle check-in and check-out management
              </p>
            </div>

            {/* ONE LARGE "SCAN VEHICLE" BUTTON IN THE CENTER */}
            <div className="bg-[#FFFFFF] rounded-3xl p-8 border border-[#E2E8F0] shadow-md text-center space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto ring-8 ring-emerald-50/50 shadow-inner">
                <QrCode className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-[#1E293B]">Scan QR Ticket or Plate</h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Tap below to launch camera scanner or enter registration plate
                </p>
              </div>

              <button
                onClick={() => navigateTo('scan')}
                className="w-full py-4 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-3"
              >
                <Camera className="w-5 h-5 text-white" />
                <span>Scan Vehicle</span>
              </button>
            </div>

            {/* THREE SMALL SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* Card 1: Available Spaces */}
              <div
                onClick={() => navigateTo('yard')}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E2E8F0] shadow-xs text-center cursor-pointer hover:border-emerald-300 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto mb-1.5">
                  <ParkingSquare className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-[#1E293B] font-mono">{availableSpaces}</p>
                <p className="text-[11px] font-bold text-[#64748B]">Available</p>
              </div>

              {/* Card 2: Occupied Spaces */}
              <div
                onClick={() => navigateTo('yard')}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E2E8F0] shadow-xs text-center cursor-pointer hover:border-blue-300 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-1.5">
                  <Car className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-[#1E293B] font-mono">{occupiedSpaces}</p>
                <p className="text-[11px] font-bold text-[#64748B]">Occupied</p>
              </div>

              {/* Card 3: Reserved Spaces */}
              <div
                onClick={() => navigateTo('reservations')}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E2E8F0] shadow-xs text-center cursor-pointer hover:border-amber-300 transition"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center mx-auto mb-1.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-xl font-black text-[#1E293B] font-mono">{reservedSpaces}</p>
                <p className="text-[11px] font-bold text-[#64748B]">Reserved</p>
              </div>

            </div>

            {/* LIVE CUSTOMER VEHICLE ENTRY & SERVICE COMPLETION ALERTS */}
            <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#1E293B]">
                    Live Vehicle Entry & Service Completion Alerts
                  </h3>
                </div>
                <button
                  onClick={() => navigateTo('notifications')}
                  className="text-3xs font-bold font-mono text-emerald-700 hover:underline cursor-pointer"
                >
                  View All ({attendantSystemNotifs.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {entryNotifications.slice(0, 2).map((notif) => (
                  <div key={notif.id} className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-900 text-xs flex items-center gap-1.5">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        Plate: {notif.plate}
                      </span>
                    </div>
                    <p className="text-emerald-950 font-medium text-[11px] leading-relaxed">{notif.text}</p>
                  </div>
                ))}

                {completionNotifications.slice(0, 2).map((notif) => (
                  <div key={notif.id} className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                        Plate: {notif.plate}
                      </span>
                    </div>
                    <p className="text-blue-950 font-medium text-[11px] leading-relaxed">{notif.text}</p>
                  </div>
                ))}

                {entryNotifications.length === 0 && completionNotifications.length === 0 && (
                  <p className="text-xs text-slate-500 italic p-2 text-center">No new vehicle entry or service completion alerts currently pending.</p>
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY (SHOWING ONLY THE LAST FIVE TRANSACTIONS) */}
            <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1E293B]">Recent Activity</h3>
                <span className="text-[10px] font-bold text-[#64748B]">Last 5 Movements</span>
              </div>

              <div className="space-y-2">
                {activityLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          log.type === 'entry'
                            ? 'bg-emerald-100 text-[#10B981]'
                            : 'bg-blue-100 text-[#2563EB]'
                        }`}
                      >
                        {log.type === 'entry' ? 'IN' : 'OUT'}
                      </div>
                      <div>
                        <p className="font-bold text-[#1E293B] font-mono">{log.plate}</p>
                        <p className="text-[10px] text-[#64748B]">{log.slot}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#64748B]">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------
            SCAN VEHICLE PAGE
            ------------------------------------------------------------ */}
        {activePage === 'scan' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-6 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#1E293B]">Scan Vehicle</h2>
                <p className="text-xs text-[#64748B]">Scan ticket QR code or enter code manually</p>
              </div>
              <button
                onClick={() => navigateTo('dashboard')}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#64748B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera Viewport / Button */}
            <div className="space-y-3">
              <div className="relative w-full h-52 bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-[#10B981] flex flex-col items-center justify-center text-white">
                {isCameraActive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-48 h-28 border-2 border-[#10B981] rounded-xl relative overflow-hidden flex items-center justify-center bg-slate-900/80">
                      <div className="absolute inset-x-0 h-0.5 bg-[#10B981] shadow-[0_0_15px_#10B981] animate-pulse top-1/2 -translate-y-1/2" />
                      <QrCode className="w-12 h-12 text-[#10B981]/40" />
                    </div>
                    <p className="text-xs font-mono font-bold text-[#10B981] mt-3 animate-pulse">
                      [ Camera Active — Scanning Ticket ]
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Camera className="w-10 h-10 text-[#10B981] mx-auto" />
                    <p className="text-xs font-bold text-slate-300">
                      Tap Camera Scan button below
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-[#10B981]" />
                  <span>{isCameraActive ? 'Stop Camera' : 'Camera Scan'}</span>
                </button>

                {/* Simulated 1-Tap Sample Scan for instant testing */}
                <button
                  onClick={() => {
                    const sample = reservations[0]?.qrCode || 'UAX 456B';
                    setTicketInput(sample);
                    handleVerifyTicket(sample);
                  }}
                  className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#10B981] font-bold text-xs transition cursor-pointer border border-emerald-200 shrink-0"
                >
                  Simulate QR Scan
                </button>
              </div>
            </div>

            {/* Manual QR Code Input */}
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <label className="text-xs font-bold text-[#1E293B] block">Manual QR Code / Plate Input</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="e.g. UAX 456B or res-1"
                  className="flex-1 bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] focus:bg-white rounded-2xl px-4 py-3 text-xs text-[#1E293B] font-mono outline-none transition"
                />
                <button
                  onClick={() => handleVerifyTicket()}
                  className="py-3 px-5 bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition cursor-pointer shadow-xs shrink-0"
                >
                  Verify Reservation
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------
            VEHICLE VERIFICATION
            ------------------------------------------------------------ */}
        {activePage === 'verification' && scannedReservation && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-6 animate-in fade-in duration-200">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateTo('scan')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#64748B] cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-[#1E293B]">Vehicle Verification</h2>
                  <p className="text-xs text-[#64748B]">Verify reservation details before authorization</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                isVehicleParked ? 'bg-blue-100 text-[#2563EB]' : 'bg-emerald-100 text-[#10B981]'
              }`}>
                {isVehicleParked ? 'PARKED IN YARD' : 'RESERVED'}
              </span>
            </div>

            {/* Verification Card Grid */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Registration Number</span>
                  <span className="text-base font-black text-[#1E293B] font-mono">
                    {currentVehicle?.registrationNumber || scannedReservation.qrCode || 'UAX 456B'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Vehicle Make & Model</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {currentVehicle?.make || 'Toyota'} {currentVehicle?.model || 'Prado'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Vehicle Color</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {currentVehicle?.color || 'Black'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Customer Name</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {currentCustomer?.name || 'Jonathan Eny'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Customer Contact</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {currentCustomer?.phone || '+256 700 123 456'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Parking Slot</span>
                  <span className="text-xs font-black text-[#10B981] font-mono">
                    {currentSpace?.spaceNumber || scannedReservation.parkingId || 'Slot A12'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Reservation Status</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {scannedReservation.status}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Arrival Time</span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Checkboxes */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-black text-[#1E293B]">Required Confirmation Checkboxes:</p>
              
              <div className="space-y-2 text-xs font-bold text-[#1E293B]">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={checkRegistration}
                    onChange={(e) => setCheckRegistration(e.target.checked)}
                    className="w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <span>Registration number matches reservation</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={checkSlot}
                    onChange={(e) => setCheckSlot(e.target.checked)}
                    className="w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <span>Parking slot confirmed</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={checkIdentity}
                    onChange={(e) => setCheckIdentity(e.target.checked)}
                    className="w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <span>Driver identity verified (optional)</span>
                </label>
              </div>
            </div>

            {/* SINGLE CONDITIONAL ACTION BUTTON */}
            <div className="pt-2">
              {!isVehicleParked ? (
                /* Display ONLY Authorize Entry if vehicle has not entered */
                <button
                  onClick={() => setPendingAction('check-in')}
                  disabled={!checkRegistration || !checkSlot}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    checkRegistration && checkSlot
                      ? 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Authorize Entry</span>
                </button>
              ) : (
                /* Display ONLY Authorize Exit if vehicle is already parked */
                <button
                  onClick={() => setPendingAction('check-out')}
                  disabled={!checkRegistration}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                    checkRegistration
                      ? 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-blue-600/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  <span>Authorize Exit</span>
                </button>
              )}
            </div>

          </div>
        )}

        {/* CONFIRMATION DIALOG MODAL BEFORE COMPLETING ACTION */}
        {pendingAction && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl border border-[#E2E8F0]">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-[#1E293B]">
                  Confirm Vehicle {pendingAction === 'check-in' ? 'Entry' : 'Exit'}
                </h3>
                <p className="text-xs text-[#64748B]">Summarizing vehicle details</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-bold">Vehicle:</span>
                  <span className="font-mono font-black text-[#1E293B]">
                    {currentVehicle?.registrationNumber || scannedReservation?.qrCode || 'UAX 456B'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-bold">Customer:</span>
                  <span className="font-bold text-[#1E293B]">
                    {currentCustomer?.name || 'Jonathan Eny'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-bold">Parking Slot:</span>
                  <span className="font-bold text-[#10B981]">
                    {currentSpace?.spaceNumber || scannedReservation?.parkingId || 'Slot A12'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPendingAction(null)}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteAction}
                  disabled={isProcessing}
                  className={`flex-1 py-3 rounded-2xl font-black text-xs text-white transition cursor-pointer shadow-md ${
                    pendingAction === 'check-in'
                      ? 'bg-[#10B981] hover:bg-emerald-600'
                      : 'bg-[#2563EB] hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : `Confirm ${pendingAction === 'check-in' ? 'Entry' : 'Exit'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            RESERVATIONS PAGE
            ------------------------------------------------------------ */}
        {activePage === 'reservations' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Search bar & Filter tabs */}
            <div className="bg-[#FFFFFF] rounded-3xl p-4 border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by plate, customer, or slot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#1E293B] outline-none transition font-medium"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold text-[#64748B]">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active / Parked' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'completed', label: 'Completed' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setReservationFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                      reservationFilter === f.id
                        ? 'bg-[#10B981] text-white font-black shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reservation cards */}
            <div className="space-y-3">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res) => {
                  const veh = vehicles.find((v) => v.id === res.vehicleId);
                  const cust = users.find((u) => u.id === res.userId);
                  return (
                    <div
                      key={res.id}
                      className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center justify-between gap-4 hover:border-emerald-300 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-[#1E293B]">
                            {veh?.registrationNumber || res.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-[#64748B]">
                            {res.parkingId}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#64748B]">
                          {cust?.name || 'Customer'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-[#10B981] uppercase font-mono">
                          {res.status}
                        </span>
                        <button
                          onClick={() => {
                            setScannedReservation(res);
                            setTicketInput(res.qrCode);
                            handleVerifyTicket(res.qrCode);
                          }}
                          className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-[#10B981] hover:text-white text-xs font-bold text-[#1E293B] transition cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-[#FFFFFF] rounded-3xl border border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                  No reservations found matching search filter.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------
            SEARCH VEHICLE PAGE
            ------------------------------------------------------------ */}
        {activePage === 'search' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-4 animate-in fade-in duration-200">
            <h2 className="text-lg font-black text-[#1E293B]">Search Vehicle</h2>
            
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Type plate number (e.g. UAX 456B)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-xs text-[#1E293B] outline-none transition font-medium"
              />
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-[#64748B]">Quick Search Results:</p>
              {vehicles
                .filter((v) => !searchQuery || v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map((veh) => (
                  <div
                    key={veh.id}
                    onClick={() => {
                      setTicketInput(veh.registrationNumber);
                      handleVerifyTicket(veh.registrationNumber);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 flex items-center justify-between cursor-pointer transition"
                  >
                    <div>
                      <p className="font-mono font-black text-xs text-[#1E293B]">{veh.registrationNumber}</p>
                      <p className="text-[11px] text-[#64748B]">{veh.make} {veh.model} ({veh.color})</p>
                    </div>
                    <span className="text-xs font-bold text-[#10B981]">Verify →</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            MANUAL ENTRY & MANUAL EXIT
            ------------------------------------------------------------ */}
        {(activePage === 'manual_entry' || activePage === 'manual_exit') && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-5 animate-in fade-in duration-200">
            <h2 className="text-lg font-black text-[#1E293B]">
              {activePage === 'manual_entry' ? 'Manual Entry' : 'Manual Exit'}
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualSubmit(activePage === 'manual_entry' ? 'entry' : 'exit');
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B] block">Registration Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UAX 456B"
                  value={manualPlate}
                  onChange={(e) => setManualPlate(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] rounded-2xl px-4 py-3 text-xs text-[#1E293B] font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1E293B] block">Driver Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Walk-in Visitor"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="w-full bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] rounded-2xl px-4 py-3 text-xs text-[#1E293B] outline-none"
                />
              </div>

              {activePage === 'manual_entry' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1E293B] block">Assigned Parking Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. Slot A12"
                    value={manualSlot}
                    onChange={(e) => setManualSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-[#E2E8F0] focus:border-[#10B981] rounded-2xl px-4 py-3 text-xs text-[#1E293B] outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl font-black text-xs text-white shadow-md transition cursor-pointer ${
                  activePage === 'manual_entry' ? 'bg-[#10B981] hover:bg-emerald-600' : 'bg-[#2563EB] hover:bg-blue-700'
                }`}
              >
                {activePage === 'manual_entry' ? 'Authorize Entry' : 'Authorize Exit'}
              </button>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------
            PARKING YARD OCCUPANCY
            ------------------------------------------------------------ */}
        {activePage === 'yard' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-lg font-black text-[#1E293B]">Parking Yard Occupancy</h2>
                <p className="text-xs text-[#64748B]">Yard space statistics</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#10B981] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {totalSpaces} Total Slots
              </span>
            </div>

            {/* Simple Donut Chart */}
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#2563EB]"
                    strokeDasharray={`${(occupiedSpaces / totalSpaces) * 100}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#F59E0B]"
                    strokeDasharray={`${(reservedSpaces / totalSpaces) * 100}, 100`}
                    strokeDashoffset={`-${(occupiedSpaces / totalSpaces) * 100}`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#10B981]"
                    strokeDasharray={`${(availableSpaces / totalSpaces) * 100}, 100`}
                    strokeDashoffset={`-${((occupiedSpaces + reservedSpaces) / totalSpaces) * 100}`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                <div className="absolute text-center">
                  <span className="text-2xl font-black text-[#1E293B] block font-mono">
                    {occupancyPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Capacity</span>
                </div>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                <span className="font-bold text-[#10B981]">Available</span>
                <p className="text-xl font-black font-mono text-[#1E293B]">{availableSpaces}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                <span className="font-bold text-[#2563EB]">Occupied</span>
                <p className="text-lg font-black font-mono text-[#1E293B]">{occupiedSpaces}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <span className="font-bold text-[#F59E0B]">Reserved</span>
                <p className="text-lg font-black font-mono text-[#1E293B]">{reservedSpaces}</p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            NOTIFICATIONS PAGE
            ------------------------------------------------------------ */}
        {activePage === 'notifications' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-lg font-black text-[#1E293B]">Parking Attendant Notifications</h2>
                <p className="text-xs text-[#64748B]">Real-time alerts for vehicle arrivals, yard selection, & service handoffs</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                {attendantSystemNotifs.length} Alerts
              </span>
            </div>

            <div className="space-y-3">
              {attendantSystemNotifs.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs shadow-2xs hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#1E293B] text-xs flex items-center gap-1.5">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-[#334155] font-medium leading-relaxed">{n.text}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {n.badge}
                    </span>
                    {n.plate !== 'N/A' && (
                      <span className="text-[10px] font-mono font-black text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                        Plate: {n.plate}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------
            SETTINGS PAGE
            ------------------------------------------------------------ */}
        {activePage === 'settings' && (
          <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-5 animate-in fade-in duration-200">
            <h2 className="text-lg font-black text-[#1E293B]">Attendant Settings</h2>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1E293B]">Scanner Settings</p>
                  <p className="text-[11px] text-[#64748B]">Auto-activate camera on scanner page</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-[#10B981] cursor-pointer" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1E293B]">Email Notifications</p>
                  <p className="text-[11px] text-[#64748B]">Automated email gate receipts</p>
                </div>
                {googleUser ? (
                  <span className="text-[11px] font-bold text-[#10B981]">✓ Connected</span>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Connect Gmail
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-[#1E293B]">Theme</p>
                <p className="text-[11px] text-[#64748B]">Light Commercial Theme (#F8FAFC)</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-[#1E293B]">User Account</p>
                <p className="text-[11px] text-[#64748B]">{currentUser?.email || 'attendant@ugpark.com'}</p>
              </div>

              <button
                onClick={onSignOut}
                className="w-full py-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-[#DC2626] font-black transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
