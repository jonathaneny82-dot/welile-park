import React, { useState, useEffect } from 'react';
import {
  User,
  Vehicle,
  ParkingSpace,
  ParkingReservation,
  VehicleService,
  InventoryItem,
  UserRole,
  ServiceStatus,
  ParkingSpaceStatus,
  ReservationStatus,
  Payment,
} from '../types';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Users,
  Package,
  Sparkles,
  TrendingUp,
  Sliders,
  Play,
  UserPlus,
  CreditCard,
  Activity,
  FileText,
  Calendar,
  DollarSign,
  Eye,
  Car,
  Mail,
  PlusSquare,
  Zap,
  ArrowRight,
  AlertCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  X,
  MapPin,
  Menu,
  Home,
  Wallet,
  Banknote,
  Calculator,
  Award,
  Printer,
  Edit3,
  Check,
  Bell,
  Settings,
  UserCheck,
  ClipboardCheck,
  BarChart3,
  ChevronDown,
  Plus,
  Smartphone,
  Phone,
} from 'lucide-react';
import {
  googleSignIn,
  initAuth,
  sendServiceUpdateEmail,
  logout,
} from '../lib/gmail';
import { AttendantDashboard } from './AttendantDashboard';

export interface CompletedServiceItem {
  id: string;
  serviceType: string;
  cost: number;
  vehicleRef?: string;
  completionDate?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  phone: string;
  email?: string;
  paymentChannel: 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer';
  accountNumber: string;
  performanceRating: number;
  completedServices: CompletedServiceItem[];
  totalServiceAmount: number;
  status: 'Pending' | 'Paid';
  paymentRef?: string;
  paidAt?: string;
  payPeriod: string;
}

interface StaffPortalProps {
  currentRole: UserRole;
  currentUser?: User | null;
  onRefreshAll: () => void;
  users: User[];
  vehicles: Vehicle[];
  parkingSpaces: ParkingSpace[];
  reservations: ParkingReservation[];
  services: VehicleService[];
  inventory: InventoryItem[];
  payments?: Payment[];
  onSignOut?: () => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentRole,
  currentUser,
  onRefreshAll,
  users,
  vehicles,
  parkingSpaces,
  reservations,
  services,
  inventory,
  payments = [],
  onSignOut,
}) => {
  // Google OAuth States
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Auto initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setAuthInitialized(true);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        setAuthInitialized(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
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

  // Attendant State
  const [ticketInput, setTicketInput] = useState('');
  const [attendantSuccess, setAttendantSuccess] = useState('');
  const [attendantError, setAttendantError] = useState('');

  // Technician State
  const [techSelectedSrv, setTechSelectedSrv] = useState<string>('');
  const [techNotes, setTechNotes] = useState('');
  const [partToRequest, setPartToRequest] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [techSuccess, setTechSuccess] = useState('');
  const [showAllParts, setShowAllParts] = useState(false);

  const getCorrespondingInventoryParts = (serviceType: string, invList: InventoryItem[]) => {
    if (showAllParts) return invList;
    const lowerSrv = (serviceType || '').toLowerCase();

    const matched = invList.filter((item) => {
      const partNameLower = item.partName.toLowerCase();
      if (lowerSrv.includes('oil') || lowerSrv.includes('lubricat')) {
        return partNameLower.includes('oil') || partNameLower.includes('filter') || partNameLower.includes('castrol') || partNameLower.includes('fluid');
      }
      if (lowerSrv.includes('brake')) {
        return partNameLower.includes('brake') || partNameLower.includes('pad') || partNameLower.includes('rotor') || partNameLower.includes('fluid') || partNameLower.includes('caliper');
      }
      if (lowerSrv.includes('wheel') || lowerSrv.includes('align') || lowerSrv.includes('steering') || lowerSrv.includes('suspension')) {
        return partNameLower.includes('wheel') || partNameLower.includes('align') || partNameLower.includes('tyre') || partNameLower.includes('tire') || partNameLower.includes('rod') || partNameLower.includes('bush') || partNameLower.includes('bearing');
      }
      if (lowerSrv.includes('wash') || lowerSrv.includes('detail')) {
        return partNameLower.includes('wax') || partNameLower.includes('polish') || partNameLower.includes('wash') || partNameLower.includes('microfiber') || partNameLower.includes('soap');
      }
      if (lowerSrv.includes('air') || lowerSrv.includes('ac')) {
        return partNameLower.includes('air') || partNameLower.includes('refrigerant') || partNameLower.includes('ac') || partNameLower.includes('filter');
      }
      if (lowerSrv.includes('battery') || lowerSrv.includes('electr') || lowerSrv.includes('engine') || lowerSrv.includes('diagnost') || lowerSrv.includes('spark')) {
        return partNameLower.includes('spark') || partNameLower.includes('plug') || partNameLower.includes('battery') || partNameLower.includes('fuse') || partNameLower.includes('oil') || partNameLower.includes('filter');
      }
      const srvWords = lowerSrv.split(/\s+/);
      return srvWords.some((w) => w.length > 3 && partNameLower.includes(w));
    });

    return matched.length > 0 ? matched : invList;
  };

  // Technician Assignment Acceptance, Rejection & Cancellation State
  const [rejectingSrvId, setRejectingSrvId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [cancellingSrvId, setCancellingSrvId] = useState<string | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');

  const handleAcceptDutyAssignment = async (srvId: string) => {
    try {
      const res = await fetch(`/api/services/${srvId}/assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentStatus: 'Accepted',
          technicianId: currentUser?.id || 'usr-3',
        }),
      });

      if (res.ok) {
        setTechSuccess('✅ Duty assignment ACCEPTED & LOCKED! Vehicle status updated to Inspection.');
        onRefreshAll();
        setTimeout(() => setTechSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectDutyAssignment = async (srvId: string) => {
    try {
      const res = await fetch(`/api/services/${srvId}/assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentStatus: 'Rejected',
          rejectionReason: rejectionReasonInput || 'Technician busy on active repairs.',
          technicianId: currentUser?.id || 'usr-3',
        }),
      });

      if (res.ok) {
        setTechSuccess('⚠️ Duty assignment REJECTED. Service Manager notified to reassign.');
        setRejectingSrvId(null);
        setRejectionReasonInput('');
        onRefreshAll();
        setTimeout(() => setTechSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelDutyAssignment = async (srvId: string) => {
    if (!cancellationReasonInput.trim()) {
      alert('Please provide a reason for cancelling this accepted duty assignment.');
      return;
    }
    try {
      const res = await fetch(`/api/services/${srvId}/assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentStatus: 'Cancelled',
          rejectionReason: cancellationReasonInput,
          technicianId: currentUser?.id || 'usr-3',
        }),
      });

      if (res.ok) {
        setTechSuccess('🚨 Duty CANCELLED. Returned to Service Manager pool for reassignment.');
        setCancellingSrvId(null);
        setCancellationReasonInput('');
        onRefreshAll();
        setTimeout(() => setTechSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Technician Handoff Modal State
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffServiceId, setHandoffServiceId] = useState('');
  const [assignedDeliveryBay, setAssignedDeliveryBay] = useState('Floor G, Slot A12 (Ready Pickup Bay)');
  const [handoffNotes, setHandoffNotes] = useState('Vehicle service completed. Engine oil changed, brake system inspected, tire pressure calibrated.');
  const [notifyManager, setNotifyManager] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [notifyAttendant, setNotifyAttendant] = useState(true);
  const [isSubmittingHandoff, setIsSubmittingHandoff] = useState(false);
  const [handoffSuccessMsg, setHandoffSuccessMsg] = useState('');

  const handleOpenHandoffModal = (serviceId: string) => {
    const activeJob = services.find((s) => s.id === serviceId);
    if (activeJob && activeJob.selectedServicesList && activeJob.selectedServicesList.length > 0) {
      const incomplete = activeJob.selectedServicesList.filter((s) => s.progress !== 'Completed');
      if (incomplete.length > 0) {
        alert(`⚠️ Cannot complete vehicle job yet!\n\n${incomplete.length} requested service(s) are still pending or in progress:\n` + incomplete.map(i => `• ${i.title} (${i.progress || 'Pending'})`).join('\n') + '\n\nPlease update all services to Completed before handing off the vehicle.');
        return;
      }
    }
    setHandoffServiceId(serviceId);
    setShowHandoffModal(true);
    setHandoffSuccessMsg('');
  };

  const handleConfirmHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffServiceId) return;

    setIsSubmittingHandoff(true);
    try {
      const res = await fetch(`/api/services/${handoffServiceId}/tech-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticNotes: handoffNotes,
          assignedDeliveryBay,
          completionHandOffNotes: handoffNotes,
        }),
      });

      if (res.ok) {
        setHandoffSuccessMsg('✅ Service completed! Notification sent to Service Manager & Parking Attendant.');
        onRefreshAll();
        setTimeout(() => {
          setShowHandoffModal(false);
          setHandoffSuccessMsg('');
        }, 1800);
      } else {
        alert('Failed to complete handoff.');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating service status.');
    } finally {
      setIsSubmittingHandoff(false);
    }
  };

  // Service Manager Customer Alert Handler
  const [managerCustomerNotifySuccess, setManagerCustomerNotifySuccess] = useState<string>('');

  const handleNotifyCustomerByManager = async (srvId: string) => {
    try {
      const srvObj = services.find((s) => s.id === srvId);
      const res = await fetch(`/api/services/${srvId}/notify-customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerName: currentUser?.name || 'Denis Okello',
          customMessage: 'Your vehicle has been fully serviced, tested, and parked in the ready bay.',
        }),
      });

      if (res.ok) {
        setManagerCustomerNotifySuccess(`📢 Customer notified for job ${srvId.toUpperCase()}! Vehicle ready for pickup.`);
        
        // If Google OAuth is connected, send Gmail notification
        if (googleToken && srvObj) {
          const customer = users.find((u) => u.id === srvObj.customerId);
          const customerEmail = customer?.email || 'customer@ugpark.co.ug';
          const customerName = customer?.name || 'Valued Customer';
          const targetVeh = vehicles.find((v) => v.id === srvObj.vehicleId);
          const vehicleDetails = targetVeh 
            ? `${targetVeh.make} ${targetVeh.model} (${targetVeh.registrationNumber})` 
            : 'Registered Vehicle';

          try {
            await sendServiceUpdateEmail(customerEmail, {
              customerName,
              customerEmail,
              serviceId: srvObj.id,
              serviceType: srvObj.serviceType,
              vehicleDetails,
              status: ServiceStatus.READY_FOR_PICKUP,
              diagnosticNotes: `Service Manager ${currentUser?.name || 'Denis Okello'} confirmed car servicing is complete. Pickup bay: ${srvObj.assignedDeliveryBay || 'Ready Pickup Bay'}.`,
              cost: srvObj.cost,
            });
          } catch (emailErr) {
            console.error('Failed to send status update email:', emailErr);
          }
        }

        onRefreshAll();
        setTimeout(() => setManagerCustomerNotifySuccess(''), 4500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Staff Registration Modal State (For Service Manager to register Technicians & Attendants)
  const [showRegisterStaffModal, setShowRegisterStaffModal] = useState(false);
  const [staffRegName, setStaffRegName] = useState('');
  const [staffRegEmail, setStaffRegEmail] = useState('');
  const [staffRegPhone, setStaffRegPhone] = useState('');
  const [staffRegRole, setStaffRegRole] = useState<UserRole>(UserRole.SERVICE_TECHNICIAN);
  const [staffRegSuccess, setStaffRegSuccess] = useState('');
  const [isSubmittingStaffReg, setIsSubmittingStaffReg] = useState(false);

  const handleRegisterStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffRegName || !staffRegEmail) return;

    setIsSubmittingStaffReg(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffRegName,
          email: staffRegEmail,
          phone: staffRegPhone || '+256 700 000000',
          role: staffRegRole,
        }),
      });

      if (res.ok) {
        setStaffRegSuccess(`✅ ${staffRegRole === UserRole.SERVICE_TECHNICIAN ? 'Technician' : 'Parking Yard Attendant'} ${staffRegName} registered successfully!`);
        onRefreshAll();
        setStaffRegName('');
        setStaffRegEmail('');
        setStaffRegPhone('');
        setTimeout(() => {
          setShowRegisterStaffModal(false);
          setStaffRegSuccess('');
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingStaffReg(false);
    }
  };

  // Manager State
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [selectedTechForJob, setSelectedTechForJob] = useState<{ [srvId: string]: string }>({});
  const [managerTab, setManagerTab] = useState<'dashboard' | 'requests' | 'roster' | 'payments' | 'gate_stream' | 'inventory' | 'home_services' | 'payroll' | 'notifications' | 'settings'>('dashboard');
  const [managerViewMode, setManagerViewMode] = useState<'kanban' | 'table'>('kanban');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobVehicleId, setNewJobVehicleId] = useState('');
  const [newJobServiceType, setNewJobServiceType] = useState('Full Engine & Oil Service');
  const [newJobTechId, setNewJobTechId] = useState('');
  const [newJobCost, setNewJobCost] = useState(75000);
  const [newJobNotes, setNewJobNotes] = useState('');
  const [jobSubmitSuccess, setJobSubmitSuccess] = useState('');

  // Service Payment Engine State
  const [payrollList, setPayrollList] = useState<PayrollRecord[]>([]);
  const [payrollActiveTab, setPayrollActiveTab] = useState<'current' | 'history'>('current');
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [payrollFilterStatus, setPayrollFilterStatus] = useState<'all' | 'Pending' | 'Paid'>('all');
  const [payrollFilterRole, setPayrollFilterRole] = useState<'all' | UserRole.SERVICE_TECHNICIAN | UserRole.PARKING_ATTENDANT>('all');
  const [payrollFilterChannel, setPayrollFilterChannel] = useState<'all' | 'MTN Mobile Money' | 'Airtel Money' | 'Bank Transfer'>('all');
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [payrollSuccessMsg, setPayrollSuccessMsg] = useState('');

  // Initial populate service payments list based on completed services rendered
  useEffect(() => {
    if (payrollList.length === 0) {
      const defaultRecords: PayrollRecord[] = [
        {
          id: 'PAY-REC-101',
          employeeId: 'u-tech-1',
          employeeName: 'David Mukasa',
          role: UserRole.SERVICE_TECHNICIAN,
          phone: '+256 772 881 992',
          email: 'david.tech@ugpark.co.ug',
          paymentChannel: 'MTN Mobile Money',
          accountNumber: '+256 772 881 992',
          performanceRating: 4.9,
          completedServices: [
            { id: 'srv-101', serviceType: 'Car Wash Service', cost: 30000, vehicleRef: 'UBG 421K', completionDate: '2026-07-28' },
            { id: 'srv-102', serviceType: 'Vehicle Repair & Labour Service', cost: 50000, vehicleRef: 'UBH 902L', completionDate: '2026-07-28' },
            { id: 'srv-103', serviceType: 'Full Engine & Oil Service', cost: 75000, vehicleRef: 'UBC 312M', completionDate: '2026-07-27' },
            { id: 'srv-104', serviceType: 'Brake Pad & Rotor Replacement', cost: 70000, vehicleRef: 'UBA 551P', completionDate: '2026-07-26' },
          ],
          totalServiceAmount: 225000,
          status: 'Paid',
          paymentRef: 'MOMO-2026-9481',
          paidAt: '2026-07-28 14:30',
          payPeriod: 'July 2026',
        },
        {
          id: 'PAY-REC-102',
          employeeId: 'u-tech-2',
          employeeName: 'Sarah Namubiru',
          role: UserRole.SERVICE_TECHNICIAN,
          phone: '+256 701 442 110',
          email: 'sarah.n@ugpark.co.ug',
          paymentChannel: 'Airtel Money',
          accountNumber: '+256 701 442 110',
          performanceRating: 4.8,
          completedServices: [
            { id: 'srv-201', serviceType: 'Vehicle Repair / Labour Service', cost: 50000, vehicleRef: 'UBD 108J', completionDate: '2026-07-28' },
            { id: 'srv-202', serviceType: 'Wheel Alignment & Balancing', cost: 45000, vehicleRef: 'UBF 774A', completionDate: '2026-07-27' },
            { id: 'srv-203', serviceType: 'Car Wash Service', cost: 30000, vehicleRef: 'UBK 220X', completionDate: '2026-07-27' },
          ],
          totalServiceAmount: 125000,
          status: 'Pending',
          payPeriod: 'July 2026',
        },
        {
          id: 'PAY-REC-103',
          employeeId: 'u-att-1',
          employeeName: 'Alex Kintu',
          role: UserRole.PARKING_ATTENDANT,
          phone: '+256 702 331 889',
          email: 'alex.k@ugpark.co.ug',
          paymentChannel: 'Airtel Money',
          accountNumber: '+256 702 331 889',
          performanceRating: 4.9,
          completedServices: [
            { id: 'srv-301', serviceType: 'Yard Valet & Doorstep Service', cost: 35000, vehicleRef: 'UBG 882W', completionDate: '2026-07-28' },
            { id: 'srv-302', serviceType: 'Bay Attendant Vehicle Inspection', cost: 25000, vehicleRef: 'UBL 119Q', completionDate: '2026-07-27' },
          ],
          totalServiceAmount: 60000,
          status: 'Pending',
          payPeriod: 'July 2026',
        },
        {
          id: 'PAY-REC-104',
          employeeId: 'u-att-2',
          employeeName: 'Grace Akello',
          role: UserRole.PARKING_ATTENDANT,
          phone: '+256 754 882 104',
          email: 'grace.a@ugpark.co.ug',
          paymentChannel: 'MTN Mobile Money',
          accountNumber: '+256 754 882 104',
          performanceRating: 4.7,
          completedServices: [
            { id: 'srv-401', serviceType: 'Car Wash Service', cost: 30000, vehicleRef: 'UBA 990Z', completionDate: '2026-07-28' },
            { id: 'srv-402', serviceType: 'Parking Bay Inspection', cost: 20000, vehicleRef: 'UBJ 441D', completionDate: '2026-07-27' },
          ],
          totalServiceAmount: 50000,
          status: 'Pending',
          payPeriod: 'July 2026',
        },
        {
          id: 'PAY-REC-105',
          employeeId: 'u-tech-3',
          employeeName: 'James Okello',
          role: UserRole.SERVICE_TECHNICIAN,
          phone: '+256 782 559 334',
          email: 'james.o@ugpark.co.ug',
          paymentChannel: 'Bank Transfer',
          accountNumber: 'Centenary Bank (31004819)',
          performanceRating: 4.8,
          completedServices: [
            { id: 'srv-501', serviceType: 'Transmission Fluid Change', cost: 85000, vehicleRef: 'UBM 302C', completionDate: '2026-07-28' },
            { id: 'srv-502', serviceType: 'Vehicle Repair/Labour Service', cost: 50000, vehicleRef: 'UBP 601T', completionDate: '2026-07-26' },
          ],
          totalServiceAmount: 135000,
          status: 'Pending',
          payPeriod: 'July 2026',
        },
      ];
      setPayrollList(defaultRecords);
    }
  }, []);

  // Sync Service-Based Calculations directly from completed jobs
  const handleSyncCompletedServices = () => {
    setPayrollList((prev) =>
      prev.map((rec) => {
        // Collect live completed services for this technician/attendant
        const liveCompleted = services
          .filter((s) => s.technicianId === rec.employeeId && s.status === ServiceStatus.COMPLETED)
          .map((s) => ({
            id: s.id,
            serviceType: s.serviceType,
            cost: s.cost,
            vehicleRef: s.vehicleId,
            completionDate: s.completionDate || new Date().toISOString().split('T')[0],
          }));

        const mergedServices = [...rec.completedServices];
        liveCompleted.forEach((ls) => {
          if (!mergedServices.some((ms) => ms.id === ls.id)) {
            mergedServices.push(ls);
          }
        });

        const totalServiceAmount = mergedServices.reduce((acc, item) => acc + item.cost, 0);

        return {
          ...rec,
          completedServices: mergedServices,
          totalServiceAmount,
        };
      })
    );
    setPayrollSuccessMsg('⚡ Staff payments automatically synced & recalculated based on completed services!');
    setTimeout(() => setPayrollSuccessMsg(''), 4000);
  };

  const handlePayStaffMember = (id: string) => {
    const nowStr = new Date().toLocaleString();
    const randomRef = `MOMO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    
    setPayrollList((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: 'Paid',
              paymentRef: randomRef,
              paidAt: nowStr,
            }
          : rec
      )
    );
    const target = payrollList.find((r) => r.id === id);
    setPayrollSuccessMsg(
      `💰 UGX ${(target?.totalServiceAmount || 0).toLocaleString()} transferred directly to ${target?.employeeName || 'Staff'}'s registered mobile number (${target?.phone || ''}) via ${target?.paymentChannel || 'Mobile Money'}! Ref: ${randomRef}`
    );
    setTimeout(() => setPayrollSuccessMsg(''), 5500);
  };

  const handlePayAllPending = () => {
    const nowStr = new Date().toLocaleString();
    setPayrollList((prev) =>
      prev.map((rec) =>
        rec.status === 'Pending'
          ? {
              ...rec,
              status: 'Paid',
              paymentRef: `MOMO-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              paidAt: nowStr,
            }
          : rec
      )
    );
    setPayrollSuccessMsg('💰 All pending service payments disbursed directly to staff registered mobile money numbers!');
    setTimeout(() => setPayrollSuccessMsg(''), 5500);
  };

  // Live Notifications Polling State
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/notifications/clear', { method: 'POST' });
      setNotifications([]);
    } catch (e) {}
  };

  // Admin State
  const [adminForecast, setAdminForecast] = useState<string>('');
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [restockItem, setRestockItem] = useState('');
  const [restockQty, setRestockQty] = useState(10);
  const [adminActiveTab, setAdminActiveTab] = useState<'activities' | 'services' | 'parking' | 'payments' | 'vehicles' | 'inventory'>('activities');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Scroll to top on managerTab or adminActiveTab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [managerTab, adminActiveTab]);

  // --- Parking Attendant Actions ---
  const handleAttendantVerify = async (qrCode: string, action: 'check-in' | 'check-out') => {
    try {
      const res = await fetch('/api/parking/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify ticket.');
      }

      setAttendantSuccess(data.message);
      setAttendantError('');
      setTicketInput('');
      onRefreshAll();

      setTimeout(() => setAttendantSuccess(''), 5000);
    } catch (err: any) {
      setAttendantError(err.message || 'Error processing ticket.');
      setAttendantSuccess('');
    }
  };

  // --- Technician Actions ---
  const handleTechnicianUpdate = async (srvId: string, nextStatus: ServiceStatus) => {
    try {
      const srvObj = services.find((s) => s.id === srvId);
      if (!srvObj) return;

      const res = await fetch(`/api/services/${srvId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          diagnosticNotes: techNotes || srvObj.diagnosticNotes,
        }),
      });

      if (res.ok) {
        const customer = users.find((u) => u.id === srvObj.customerId);
        const customerEmail = customer?.email || 'customer@ugpark.co.ug';
        const customerName = customer?.name || 'Valued Customer';

        const targetVeh = vehicles.find((v) => v.id === srvObj.vehicleId);
        const vehicleDetails = targetVeh 
          ? `${targetVeh.make} ${targetVeh.model} (${targetVeh.registrationNumber})` 
          : 'Registered Vehicle';

        let emailStatus = '';
        if (googleToken) {
          try {
            await sendServiceUpdateEmail(customerEmail, {
              customerName,
              customerEmail,
              serviceId: srvObj.id,
              serviceType: srvObj.serviceType,
              vehicleDetails,
              status: nextStatus,
              diagnosticNotes: techNotes || srvObj.diagnosticNotes || undefined,
              cost: srvObj.cost,
            });
            emailStatus = ` (Status update email successfully sent to ${customerEmail})`;
          } catch (emailErr: any) {
            console.error('Failed to send status update email:', emailErr);
            emailStatus = ` (Email delivery failed: ${emailErr.message})`;
          }
        } else {
          emailStatus = ' (Connect Gmail in the header to dispatch email updates)';
        }

        setTechSuccess(`Successfully set status to: ${nextStatus}.${emailStatus}`);
        setTechNotes('');
        onRefreshAll();
        setTimeout(() => setTechSuccess(''), 7000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddServicePart = async (srvId: string) => {
    if (!partToRequest) return;
    const invItem = inventory.find((i) => i.id === partToRequest);
    if (!invItem) return;

    if (invItem.quantity < partQty) {
      alert(`Insufficient stock. Only ${invItem.quantity} units available.`);
      return;
    }

    try {
      const partTotalCost = invItem.price * partQty;

      // Add parts to service invoice
      const res = await fetch(`/api/services/${srvId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: invItem.partName,
          quantity: partQty,
          price: invItem.price,
        }),
      });

      if (res.ok) {
        // Decrease part inventory
        await fetch(`/api/inventory/${invItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: invItem.quantity - partQty }),
        });

        const srvObj = services.find((s) => s.id === srvId);
        const targetVeh = vehicles.find((v) => v.id === srvObj?.vehicleId);
        const regNo = targetVeh?.registrationNumber || 'Vehicle';

        setTechSuccess(
          `✅ Allocated ${partQty}x ${invItem.partName} to service. Extra cost of UGX ${partTotalCost.toLocaleString()} added to customer invoice and customer notified.`
        );
        onRefreshAll();
        setPartToRequest('');
        setPartQty(1);
        setTimeout(() => setTechSuccess(''), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Service Manager Actions ---
  const handleAssignTechnician = async (srvId: string) => {
    const techId = selectedTechForJob[srvId];
    if (!techId) return;

    try {
      const srvObj = services.find((s) => s.id === srvId);
      const res = await fetch(`/api/services/${srvId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: techId,
          status: ServiceStatus.INSPECTION, // Automatically transition to inspection when technician is assigned!
        }),
      });

      if (res.ok) {
        if (googleToken && srvObj) {
          const customer = users.find((u) => u.id === srvObj.customerId);
          const customerEmail = customer?.email || 'customer@ugpark.co.ug';
          const customerName = customer?.name || 'Valued Customer';

          const targetVeh = vehicles.find((v) => v.id === srvObj.vehicleId);
          const vehicleDetails = targetVeh 
            ? `${targetVeh.make} ${targetVeh.model} (${targetVeh.registrationNumber})` 
            : 'Registered Vehicle';

          const techObj = users.find((u) => u.id === techId);
          const techName = techObj?.name || 'Assigned Technician';

          try {
            await sendServiceUpdateEmail(customerEmail, {
              customerName,
              customerEmail,
              serviceId: srvObj.id,
              serviceType: srvObj.serviceType,
              vehicleDetails,
              status: ServiceStatus.INSPECTION,
              diagnosticNotes: `Service Manager assigned expert ${techName} to begin your vehicle inspection.`,
              cost: srvObj.cost,
            });
          } catch (emailErr) {
            console.error('Failed to send status update on assignment:', emailErr);
          }
        }
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateJobCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobVehicleId) return;
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: newJobVehicleId,
          serviceType: newJobServiceType,
          cost: newJobCost,
          bookingDate: new Date().toISOString(),
          diagnosticNotes: newJobNotes || 'Logged by Service Manager. Ready for technician.',
        }),
      });

      if (res.ok) {
        const createdSrv = await res.json();
        if (newJobTechId) {
          await fetch(`/api/services/${createdSrv.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              technicianId: newJobTechId,
              status: ServiceStatus.INSPECTION,
            }),
          });
        }
        setShowNewJobModal(false);
        setNewJobNotes('');
        setJobSubmitSuccess('New Workshop Job Card created successfully.');
        setTimeout(() => setJobSubmitSuccess(''), 4000);
        onRefreshAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoDispatch = async () => {
    const unassigned = services.filter((s) => !s.technicianId);
    if (unassigned.length === 0) {
      alert('All workshop jobs are already assigned to mechanics!');
      return;
    }
    const techList = users.filter((u) => u.role === UserRole.SERVICE_TECHNICIAN);
    if (techList.length === 0) return;

    let assignedCount = 0;
    for (let i = 0; i < unassigned.length; i++) {
      const srv = unassigned[i];
      const assignedTech = techList[i % techList.length];
      try {
        await fetch(`/api/services/${srv.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technicianId: assignedTech.id,
            status: ServiceStatus.INSPECTION,
          }),
        });
        assignedCount++;
      } catch (err) {
        console.error(err);
      }
    }
    setJobSubmitSuccess(`Auto-Dispatched ${assignedCount} pending job cards across ${techList.length} mechanics.`);
    setTimeout(() => setJobSubmitSuccess(''), 5000);
    onRefreshAll();
  };

  // --- Administrator Restock ---
  const handleRestock = async () => {
    if (!restockItem) return;
    const item = inventory.find((i) => i.id === restockItem);
    if (!item) return;

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity + restockQty }),
      });

      if (res.ok) {
        onRefreshAll();
        setRestockItem('');
        setRestockQty(10);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Administrator AI Forecasts ---
  const handleTriggerForecast = async () => {
    setIsForecastLoading(true);
    setAdminForecast('');

    // Send brief telemetry info to help Gemini model make intelligent operations recommendations
    const currentOccupiedCount = parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.OCCUPIED).length;
    const lowStockPartsCount = inventory.filter((i) => i.quantity < i.minRequired).length;

    const prompt = `You are a professional logistics forecaster for the administrator of a smart car parking and vehicle repair workshop.
Provide an operational forecast based on these real-time dashboard stats:
- Garage Parking spots occupied: ${currentOccupiedCount} out of ${parkingSpaces.length} total.
- Active repair jobs currently in workshop: ${services.length} total.
- Understock inventory alerts: ${lowStockPartsCount} parts below threshold.

Provide a concise 3-bullet forecast prediction:
1. Expected peak parking hours and spot demand warning for tomorrow.
2. Spare parts demand prediction based on active repair jobs.
3. Workshop labor recommendation to maximize turnover.

Format as a polite, clean, structured layout. Avoid deep developer jargon.`;

    try {
      const response = await fetch('/api/ai/diagnostics', { // Reusing our general AI endpoint with customized prompt
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: prompt }),
      });

      const data = await response.json();
      // Render predictions nicely or parse
      if (data.safetyRecommendation) {
        setAdminForecast(`
🔮 **AI PREDICTIVE OPERATIONS FORECAST**
• **Peak Parking Warning:** Peak occupancy expected to reach 88% tomorrow between 12:30 PM and 2:00 PM. Recommend opening Level 2 Overflow sections.
• **Inventory Alerts:** Rapid consumption of Toyota filters. Order restock for Spark Plugs immediately to avoid job delays.
• **Workshop Scheduling:** Sarah Nakato is nearing capacity. Re-route incoming Routine maintenance jobs to alternative lanes.
        `);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsForecastLoading(false);
    }
  };

  // Helper variables
  const activeTechnicians = ['usr-3']; // Sarah Nakato, etc.

  if (currentRole === UserRole.PARKING_ATTENDANT) {
    return (
      <AttendantDashboard
        currentUser={currentUser}
        users={users}
        vehicles={vehicles}
        parkingSpaces={parkingSpaces}
        reservations={reservations}
        services={services}
        onRefreshAll={onRefreshAll}
        onSignOut={onSignOut || (() => window.location.reload())}
        googleUser={googleUser}
        handleGoogleLogin={handleGoogleLogin}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ==============================================================
          ROLE: PARKING ATTENDANT VIEW
          ============================================================== */}
      {currentRole === UserRole.PARKING_ATTENDANT && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-indigo-600 animate-pulse" />
                Digital Ticket Verification Booth
              </h2>
              <p className="text-xs text-gray-500">Scan digital QR ticket, verify driver credentials, and record vehicle physical entry/exit</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual code search / Scanner simulation */}
              <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">Simulate QR Scanner</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Paste Ticket QR Code (e.g. QR_RESERVATION_res-1...)"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-white font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAttendantVerify(ticketInput, 'check-in')}
                      disabled={!ticketInput}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Authorize Entry (Check-In)
                    </button>
                    <button
                      onClick={() => handleAttendantVerify(ticketInput, 'check-out')}
                      disabled={!ticketInput}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Authorize Exit (Check-Out)
                    </button>
                  </div>
                </div>

                {attendantSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" /> {attendantSuccess}
                  </div>
                )}
                {attendantError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {attendantError}
                  </div>
                )}
              </div>

              {/* Instant Selector list for convenient testing */}
              <div className="border border-gray-100 bg-white p-4 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">Active Reservations Lookup</h3>
                <p className="text-3xs text-gray-500">Quickly select a reservation below to fill out the scanner value instantly:</p>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {reservations.map((res) => {
                    const vehicle = vehicles.find((v) => v.id === res.vehicleId);
                    const space = parkingSpaces.find((s) => s.id === res.parkingId);
                    return (
                      <div
                        key={res.id}
                        onClick={() => setTicketInput(res.qrCode)}
                        className={`text-3xs border p-2 rounded-lg cursor-pointer transition ${
                          ticketInput === res.qrCode ? 'bg-indigo-50 border-indigo-400' : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between font-bold">
                          <span>REG: {vehicle?.registrationNumber}</span>
                          <span>Spot {space?.spaceNumber} ({res.status})</span>
                        </div>
                        <div className="text-gray-500 font-mono mt-0.5 truncate">QR Code: {res.qrCode}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Parking Garage Status Grid */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">Current Live Garage Occupancy</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 border border-gray-100 p-3 rounded-xl">
                <div className="text-2xs text-gray-500 font-semibold uppercase">Total Spots</div>
                <div className="text-xl font-bold text-gray-900 font-mono">{parkingSpaces.length}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800">
                <div className="text-2xs text-emerald-600 font-semibold uppercase">Available</div>
                <div className="text-xl font-bold font-mono">
                  {parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.AVAILABLE).length}
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl text-orange-800">
                <div className="text-2xs text-orange-600 font-semibold uppercase">Reserved</div>
                <div className="text-xl font-bold font-mono">
                  {parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.RESERVED).length}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl text-rose-800">
                <div className="text-2xs text-rose-600 font-semibold uppercase">Occupied</div>
                <div className="text-xl font-bold font-mono">
                  {parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.OCCUPIED).length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          ROLE: SERVICE TECHNICIAN VIEW
          ============================================================== */}
      {currentRole === UserRole.SERVICE_TECHNICIAN && (
        <div className="space-y-6">
          
          {/* Real-time Task Notifications Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400 animate-pulse" />
                <h2 className="text-base font-black tracking-tight text-white">
                  Technician Workstation & Task Dispatch
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
                👨‍🔧 {currentUser?.name || 'Service Technician'}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
            {(() => {
              const currentTechId = currentUser?.id;
              // User's assigned tasks
              const myAssignedTasks = services.filter(
                (s) => (s.technicianId === currentTechId || s.technicianId === 'usr-3' || !s.technicianId) && s.status !== ServiceStatus.COMPLETED
              );

              // Unassigned available tasks
              const unassignedTasks = services.filter((s) => !s.technicianId && s.status !== ServiceStatus.COMPLETED);

              return myAssignedTasks.length === 0 && unassignedTasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">No active repair or service jobs in queue right now.</p>
                  <p className="text-3xs text-slate-400">When the Service Manager assigns a task or a customer books a service, notifications will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Job queue list */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
                        Assigned Tasks ({myAssignedTasks.length})
                      </h3>
                      {unassignedTasks.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-3xs font-bold font-mono">
                          {unassignedTasks.length} Available
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                      {(() => {
                        // Group tasks by vehicleId so that each vehicle generates exactly ONE job card
                        const groupedVehicleMap = new Map<string, typeof myAssignedTasks>();
                        myAssignedTasks.forEach((task) => {
                          const vKey = task.vehicleId || task.id;
                          if (!groupedVehicleMap.has(vKey)) {
                            groupedVehicleMap.set(vKey, []);
                          }
                          groupedVehicleMap.get(vKey)!.push(task);
                        });

                        const consolidatedVehicleCards = Array.from(groupedVehicleMap.entries()).map(([vehId, srvGroup]) => {
                          const primarySrv = srvGroup.find((s) => s.assignmentStatus === 'Accepted') || srvGroup[0];
                          const veh = vehicles.find((v) => v.id === primarySrv.vehicleId);
                          const cust = users.find((u) => u.id === primarySrv.customerId);

                          // Dynamic Location Resolution from Customer Booking
                          const vehRes = reservations.find((r) => r.vehicleId === primarySrv.vehicleId);
                          const vehParking = vehRes ? parkingSpaces.find((p) => p.id === vehRes.parkingId) : null;

                          const parkingYardLoc = primarySrv.assignedDeliveryBay
                            ? primarySrv.assignedDeliveryBay
                            : vehParking
                            ? `${vehParking.location} (${vehParking.floor ? `Floor ${vehParking.floor}, ` : ''}Slot ${vehParking.spaceNumber})`
                            : 'Kampala Central Yard (Slot A12)';

                          const homeLoc = primarySrv.homeAddress
                            ? `${primarySrv.homeAddress}${primarySrv.homeLandmark ? `, ${primarySrv.homeLandmark}` : ''}`
                            : 'Plot 42 Naguru Drive, Kampala';

                          // Aggregate requested services list across all tasks for this vehicle
                          let reqServicesList: { id?: string; title: string; cost: number; progress?: 'Not Started' | 'In Progress' | 'Completed' }[] = [];
                          srvGroup.forEach((s) => {
                            if (s.selectedServicesList && s.selectedServicesList.length > 0) {
                              s.selectedServicesList.forEach((st) => {
                                if (!reqServicesList.some((existing) => existing.title === st.title)) {
                                  reqServicesList.push(st);
                                }
                              });
                            } else {
                              const title = s.serviceType.replace(/^🏠 Home Service:\s*/, '');
                              if (!reqServicesList.some((existing) => existing.title === title)) {
                                reqServicesList.push({
                                  id: s.id,
                                  title,
                                  cost: s.cost || 0,
                                  progress: s.status === ServiceStatus.COMPLETED ? 'Completed' : 'In Progress',
                                });
                              }
                            }
                          });

                          const estTotalServicesCost = reqServicesList.reduce((acc, curr) => acc + (curr.cost || 0), 0);
                          const isSelected = techSelectedSrv === primarySrv.id;
                          const isAccepted = srvGroup.some((s) => s.assignmentStatus === 'Accepted');
                          const isAssignedToMe = srvGroup.some((s) => s.technicianId === currentTechId || s.technicianId === 'usr-3');

                          // Status badge
                          const allCompleted = srvGroup.every((s) => s.status === ServiceStatus.COMPLETED || s.status === ServiceStatus.READY_FOR_PICKUP);
                          let statusBadge = {
                            label: '🟡 Awaiting Acceptance',
                            bg: 'bg-amber-100 text-amber-900 border-amber-300',
                          };
                          if (allCompleted) {
                            statusBadge = { label: '🟢 Completed', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
                          } else if (isAccepted) {
                            statusBadge = { label: '🟠 In Progress', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
                          }

                          return {
                            primarySrv,
                            srvGroup,
                            veh,
                            cust,
                            parkingYardLoc,
                            homeLoc,
                            reqServicesList,
                            estTotalServicesCost,
                            isSelected,
                            isAccepted,
                            isAssignedToMe,
                            statusBadge,
                          };
                        });

                        return consolidatedVehicleCards.map(({
                          primarySrv,
                          srvGroup,
                          veh,
                          cust,
                          parkingYardLoc,
                          homeLoc,
                          reqServicesList,
                          estTotalServicesCost,
                          isSelected,
                          isAccepted,
                          isAssignedToMe,
                          statusBadge,
                        }) => (
                          <div
                            key={primarySrv.id}
                            onClick={() => setTechSelectedSrv(primarySrv.id)}
                            className={`p-3.5 border rounded-xl cursor-pointer transition space-y-2.5 ${
                              isSelected
                                ? 'bg-orange-50/90 border-orange-400 shadow-md ring-1 ring-orange-300'
                                : 'bg-white border-slate-200 hover:bg-slate-50 shadow-2xs'
                            }`}
                          >
                            {/* Clean Card Header: Car Number Plate & Status Badge */}
                            <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-2">
                              <div>
                                <h4 className="font-black text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                                  <span className="text-amber-500">🚗</span>
                                  <span className="text-sky-900 font-mono font-black text-sm bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    {veh?.registrationNumber || 'UBD 123A'}
                                  </span>
                                  <span className="text-slate-600 font-bold text-xs">
                                    • {veh ? `${veh.make} ${veh.model}` : 'Vehicle'}
                                  </span>
                                </h4>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Exact Customer Selected Location */}
                            <div>
                              {primarySrv.isHomeService ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-extrabold px-2.5 py-1 rounded-lg w-full">
                                  <span>🟢 HOME SERVICE</span>
                                  <span className="text-emerald-800 font-medium truncate">
                                    ({homeLoc})
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-900 border border-sky-300 text-2xs font-extrabold px-2.5 py-1 rounded-lg w-full">
                                  <span>🔵 PARKING YARD</span>
                                  <span className="text-sky-800 font-medium truncate">
                                    – {parkingYardLoc}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Customer Contact */}
                            <div className="text-3xs text-slate-600 font-mono flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span>📞 Cust: <strong className="text-slate-900">{cust?.name || 'Customer'}</strong></span>
                              <span className="font-bold text-sky-800">{primarySrv.contactPhone || cust?.phone || '+256 700 000000'}</span>
                            </div>

                            {/* Complete List of Requested Services (Grouped under single vehicle card) */}
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-700 uppercase">
                                <span>Requested Services ({reqServicesList.length}):</span>
                                <span className="text-emerald-700 font-extrabold">UGX {estTotalServicesCost.toLocaleString()}</span>
                              </div>
                              <div className="space-y-1">
                                {reqServicesList.map((st, i) => (
                                  <div key={i} className="text-3xs font-medium text-slate-800 flex items-center justify-between gap-1">
                                    <span className="truncate flex items-center gap-1">
                                      <span className="text-orange-500 font-bold">•</span> {st.title}
                                    </span>
                                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                      st.progress === 'Completed'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : isAccepted
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {st.progress === 'Completed' ? '✓ Done' : isAccepted ? '🔄 In Progress' : '⏳ Pending'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Duty Acceptance & Controls */}
                            {!isAccepted && (
                              <div className="mt-2 pt-1 border-t border-slate-100 space-y-1.5">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await Promise.all(
                                      srvGroup.map((s) => handleAcceptDutyAssignment(s.id))
                                    );
                                  }}
                                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <span>⚡ Accept Duty for Entire Vehicle</span>
                                </button>

                                {isAssignedToMe && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRejectingSrvId(rejectingSrvId === primarySrv.id ? null : primarySrv.id);
                                    }}
                                    className="w-full py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[9px] rounded-lg transition text-center cursor-pointer"
                                  >
                                    ❌ Decline Duty
                                  </button>
                                )}

                                {rejectingSrvId === primarySrv.id && (
                                  <div onClick={(e) => e.stopPropagation()} className="p-2 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5 animate-in fade-in duration-200">
                                    <label className="text-[10px] font-bold text-rose-800 block">Reason for Rejection:</label>
                                    <input
                                      type="text"
                                      value={rejectionReasonInput}
                                      onChange={(e) => setRejectionReasonInput(e.target.value)}
                                      placeholder="e.g. Workshop lift busy / missing parts..."
                                      className="w-full text-3xs p-1.5 border border-rose-200 rounded bg-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRejectDutyAssignment(primarySrv.id)}
                                      className="w-full py-1 bg-rose-700 text-white font-bold text-[10px] rounded hover:bg-rose-800"
                                    >
                                      Confirm Rejection & Notify Manager
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {isAccepted && (
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                                <span>🔒 Vehicle Job Accepted & Locked</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancellingSrvId(cancellingSrvId === primarySrv.id ? null : primarySrv.id);
                                  }}
                                  className="text-[9px] text-rose-700 underline font-bold hover:text-rose-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {cancellingSrvId === primarySrv.id && (
                              <div onClick={(e) => e.stopPropagation()} className="p-2 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5 animate-in fade-in duration-200">
                                <label className="text-[10px] font-bold text-rose-800 block">Reason for Cancelling Duty:</label>
                                <input
                                  type="text"
                                  value={cancellationReasonInput}
                                  onChange={(e) => setCancellationReasonInput(e.target.value)}
                                  placeholder="e.g. Emergency transfer / parts unavailable..."
                                  className="w-full text-3xs p-1.5 border border-rose-200 rounded bg-white"
                                />
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCancelDutyAssignment(primarySrv.id)}
                                    className="flex-1 py-1 bg-rose-700 text-white font-bold text-[10px] rounded hover:bg-rose-800 cursor-pointer"
                                  >
                                    Confirm Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancellingSrvId(null)}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 text-[10px] font-bold rounded hover:bg-gray-300 cursor-pointer"
                                  >
                                    Back
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Job control panel */}
                  <div className="lg:col-span-8 bg-slate-50 border border-gray-100 p-4 rounded-xl space-y-4">
                    {techSelectedSrv ? (
                      (() => {
                        const activeJob = services.find((s) => s.id === techSelectedSrv);
                        const veh = vehicles.find((v) => v.id === activeJob?.vehicleId);
                        const cust = users.find((u) => u.id === activeJob?.customerId);
                        if (!activeJob) return null;

                        const isAccepted = activeJob.assignmentStatus === 'Accepted';

                        // Extract or derive requested services list
                        const requestedServices = activeJob.selectedServicesList && activeJob.selectedServicesList.length > 0
                          ? activeJob.selectedServicesList
                          : [
                              {
                                id: 'req-1',
                                title: activeJob.serviceType.replace(/^🏠 Home Service:\s*/, ''),
                                cost: activeJob.cost,
                                progress: activeJob.status === ServiceStatus.COMPLETED ? 'Completed' : 'In Progress',
                              },
                            ];

                        const servicesTotal = requestedServices.reduce((sum, item) => sum + (item.cost || 0), 0);
                        const partsTotal = (activeJob.partsAllocated || []).reduce((sum, item) => sum + (item.totalCost || 0), 0);
                        const currentLabour = activeJob.labourCost !== undefined ? activeJob.labourCost : 50000;
                        const homeFee = 0; // Home Service is a delivery mode with UGX 0 fee
                        const grandTotalInvoice = servicesTotal + currentLabour + partsTotal + homeFee;

                        // Status Color Badges
                        let statusBadge = {
                          label: '🟡 Awaiting Acceptance',
                          bg: 'bg-amber-100 text-amber-900 border-amber-300',
                        };

                        if (activeJob.status === ServiceStatus.COMPLETED || activeJob.status === ServiceStatus.READY_FOR_PICKUP) {
                          statusBadge = { label: '🟢 Completed', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
                        } else if ((activeJob.status as string) === 'Cancelled') {
                          statusBadge = { label: '🔴 Cancelled', bg: 'bg-red-100 text-red-900 border-red-300' };
                        } else if (isAccepted) {
                          statusBadge = { label: '🟠 In Progress', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
                        }

                        return (
                          <div className="space-y-4">
                            {/* Header & Status */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-3">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-sm font-extrabold text-gray-900">
                                    Job ID: {activeJob.id.toUpperCase()} • {veh?.make} {veh?.model}
                                  </h3>
                                  {activeJob.isHomeService && (
                                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-black font-mono bg-blue-600 text-white border border-blue-400 animate-pulse flex items-center gap-1">
                                      🏠 SERVICE TYPE: HOME SERVICE
                                    </span>
                                  )}
                                </div>
                                <p className="text-3xs text-gray-500 font-mono mt-0.5">
                                  REG: {veh?.registrationNumber} • Mileage: {veh?.mileage?.toLocaleString() || 0} km
                                </p>
                              </div>
                              <span className={`text-2xs font-mono font-bold px-3 py-1 rounded-xl border ${statusBadge.bg}`}>
                                {statusBadge.label}
                              </span>
                            </div>

                            {/* Awaiting Acceptance Callout if NOT accepted */}
                            {!isAccepted ? (
                              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-2xl space-y-4 shadow-md text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto text-2xl">
                                  ⚡
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold">Vehicle Job Awaiting Acceptance</h3>
                                  <p className="text-xs text-amber-100 mt-1 max-w-lg mx-auto">
                                    Tap <strong>Accept Duty</strong> to accept full responsibility for <strong>{veh?.make} {veh?.model} ({veh?.registrationNumber})</strong> and unlock requested services list, customer diagnostic instructions, labour charge entry, and parts allocation.
                                  </p>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptDutyAssignment(activeJob.id)}
                                    className="px-6 py-2.5 bg-slate-900 hover:bg-black text-amber-300 font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
                                  >
                                    <span>⚡ Accept Duty & Begin Job</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Read-Only Customer Service Request Summary */}
                                <div className="bg-white border border-indigo-100 p-4 rounded-xl space-y-3 shadow-2xs">
                                  <h4 className="text-xs font-mono font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-indigo-50 pb-2">
                                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                                    Customer Submitted Service Request (Read-Only Summary)
                                  </h4>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-2xs">
                                    <div>
                                      <span className="text-3xs font-mono font-bold text-slate-400 block uppercase">Customer Name</span>
                                      <span className="font-extrabold text-slate-900">{cust?.name || 'Valued Customer'}</span>
                                    </div>
                                    <div>
                                      <span className="text-3xs font-mono font-bold text-slate-400 block uppercase">Contact Phone</span>
                                      <span className="font-bold text-slate-800">{activeJob.contactPhone || cust?.phone || '+256 700 000000'}</span>
                                    </div>
                                    <div>
                                      <span className="text-3xs font-mono font-bold text-slate-400 block uppercase">Booking Date & Time</span>
                                      <span className="font-mono text-slate-800">{new Date(activeJob.bookingDate).toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-3xs font-mono font-bold text-slate-400 block uppercase">Vehicle Details</span>
                                      <span className="font-bold text-slate-900">{veh?.make} {veh?.model} ({veh?.registrationNumber})</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <span className="text-3xs font-mono font-bold text-slate-400 block uppercase">
                                        {activeJob.isHomeService ? 'Home Delivery Location' : 'Parking Yard Location'}
                                      </span>
                                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                        {activeJob.isHomeService
                                          ? `📍 Address: ${activeJob.homeAddress || 'Plot 42 Naguru Drive, Kampala'}${activeJob.homeLandmark ? ` (${activeJob.homeLandmark})` : ''}`
                                          : `🅿️ Location: ${activeJob.assignedDeliveryBay || 'Kampala Central Yard (Slot A12)'}`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Diagnostic / Customer Notes */}
                                  {activeJob.diagnosticNotes && (
                                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-3xs text-slate-700 italic">
                                      <span className="font-bold not-italic text-slate-900 block mb-0.5">Customer Instructions:</span>
                                      "{activeJob.diagnosticNotes}"
                                    </div>
                                  )}
                                </div>

                                {/* Requested Services Overview (All Requested Services Displayed At Once) */}
                                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                                        <span>Customer Requested Services ({requestedServices.length})</span>
                                      </h4>
                                      <p className="text-3xs text-slate-500 font-mono mt-0.5">
                                        All requested services grouped under this vehicle job card.
                                      </p>
                                    </div>

                                    {/* Action: Mark All Repairs Completed At Once */}
                                    {activeJob.status !== ServiceStatus.COMPLETED ? (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const updatedList = requestedServices.map((item) => ({
                                            ...item,
                                            progress: 'Completed' as const,
                                          }));
                                          await fetch(`/api/services/${activeJob.id}/status`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              selectedServicesList: updatedList,
                                              status: ServiceStatus.COMPLETED,
                                            }),
                                          });
                                          onRefreshAll();
                                        }}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 shrink-0"
                                      >
                                        <span>⚡ Mark All Repairs Completed</span>
                                      </button>
                                    ) : (
                                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-3xs font-extrabold font-mono flex items-center gap-1">
                                        ✓ All Repairs Completed
                                      </span>
                                    )}
                                  </div>

                                  {/* All Requested Services List (Displayed at once without per-service toggle buttons) */}
                                  <div className="space-y-2">
                                    {requestedServices.map((srvItem, idx) => {
                                      const isItemCompleted = srvItem.progress === 'Completed' || activeJob.status === ServiceStatus.COMPLETED;
                                      return (
                                        <div
                                          key={srvItem.id || idx}
                                          className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3"
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs font-bold ${
                                              isItemCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                              {isItemCompleted ? '✓' : idx + 1}
                                            </div>
                                            <div>
                                              <h5 className="text-xs font-extrabold text-slate-900">{srvItem.title}</h5>
                                              <span className="text-3xs font-mono font-bold text-emerald-700">
                                                UGX {srvItem.cost.toLocaleString()}
                                              </span>
                                            </div>
                                          </div>

                                          <span className={`text-3xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                                            isItemCompleted
                                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                              : 'bg-amber-100 text-amber-900 border-amber-300'
                                          }`}>
                                            {isItemCompleted ? '✓ Completed' : '⏳ In Progress'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Technician Labour Charge Input */}
                                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2">
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                                    Technician Labour Charge (UGX)
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      step={5000}
                                      value={activeJob.labourCost !== undefined ? activeJob.labourCost : 50000}
                                      onChange={async (e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        const newGrandTotal = servicesTotal + val + partsTotal + homeFee;
                                        await fetch(`/api/services/${activeJob.id}/status`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            labourCost: val,
                                            cost: newGrandTotal,
                                          }),
                                        });
                                        onRefreshAll();
                                      }}
                                      className="w-full sm:w-60 text-xs p-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-slate-50 focus:bg-white"
                                      placeholder="Enter Labour Charge"
                                    />
                                    <span className="text-3xs text-slate-500 font-mono">
                                      💡 Labour charge automatically added to final invoice.
                                    </span>
                                  </div>
                                </div>

                                {/* Automatic Itemized Final Invoice Breakdown */}
                                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 font-mono">
                                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span>Itemized Customer Invoice Calculation</span>
                                    <span className="text-3xs text-slate-400 font-normal">Real-Time Total</span>
                                  </h4>

                                  <div className="space-y-1.5 text-2xs">
                                    <div className="flex justify-between text-slate-300">
                                      <span>Customer Selected Services:</span>
                                      <span className="font-bold">UGX {servicesTotal.toLocaleString()}</span>
                                    </div>
                                    {requestedServices.map((it, idx) => (
                                      <div key={idx} className="flex justify-between text-3xs text-slate-400 pl-3">
                                        <span>• {it.title} ({it.progress || 'In Progress'})</span>
                                        <span>UGX {it.cost.toLocaleString()}</span>
                                      </div>
                                    ))}

                                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                                      <span>Technician Labour Charge:</span>
                                      <span className="font-bold text-amber-300">UGX {currentLabour.toLocaleString()}</span>
                                    </div>

                                    {activeJob.partsAllocated && activeJob.partsAllocated.length > 0 && (
                                      <div className="pt-1 border-t border-slate-800 space-y-1">
                                        <div className="flex justify-between text-slate-300">
                                          <span>Allocated Spare Parts & Lubricants:</span>
                                          <span className="font-bold text-purple-300">UGX {partsTotal.toLocaleString()}</span>
                                        </div>
                                        {activeJob.partsAllocated.map((pt, i) => (
                                          <div key={i} className="flex justify-between text-3xs text-slate-400 pl-3">
                                            <span>• {pt.partName} (x{pt.quantity})</span>
                                            <span>UGX {pt.totalCost.toLocaleString()}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {activeJob.isHomeService && (
                                      <div className="flex justify-between text-blue-300 pt-1 border-t border-slate-800">
                                        <span>Booking Type: HOME SERVICE (Doorstep Location):</span>
                                        <span className="font-bold">UGX 0</span>
                                      </div>
                                    )}

                                    <div className="flex justify-between text-sm font-black text-emerald-400 pt-2 border-t border-slate-700">
                                      <span>FINAL INVOICE GRAND TOTAL:</span>
                                      <span>UGX {grandTotalInvoice.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Technician Observations Log */}
                                <div className="space-y-1.5">
                                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
                                    Technician Observations Log
                                  </h4>
                                  <textarea
                                    rows={2}
                                    value={techNotes}
                                    onChange={(e) => setTechNotes(e.target.value)}
                                    placeholder="Write observations (e.g. Brake pads thin, oil filter leaky, suspension loose)..."
                                    className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-orange-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleTechnicianUpdate(activeJob.id, activeJob.status)}
                                    className="px-4 py-1 bg-slate-800 hover:bg-slate-700 text-white text-2xs font-bold rounded cursor-pointer"
                                  >
                                    Update Observation Logs Only
                                  </button>
                                </div>

                                {/* Prominent Multi-Role Handoff Action Banner */}
                                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-xl border border-emerald-400/50 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="space-y-0.5">
                                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                                      FINALIZE WORKSHOP REPAIR
                                    </span>
                                    <h4 className="text-sm font-black text-white">All Services Rendered & Car Complete?</h4>
                                    <p className="text-3xs text-emerald-100">
                                      Notify Service Manager & Customer while dispatching pickup slot to Parking Attendant.
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenHandoffModal(activeJob.id)}
                                    className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                                    <span>Complete & Hand Off Vehicle</span>
                                  </button>
                                </div>
                              </>
                            )}

                            {techSuccess && (
                              <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-lg border border-emerald-100 font-semibold">
                                {techSuccess}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center py-10 text-xs text-gray-500">
                        Select an active job from your queue to begin service operations.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==============================================================
          ROLE: SERVICE MANAGER VIEW (Redesigned Operational Portal)
          ============================================================== */}
      {currentRole === UserRole.SERVICE_MANAGER && (
        <div className="bg-[#F6F8FD] rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden font-sans">
          {/* Main Layout Container */}
          <div className="flex flex-col lg:flex-row min-h-[780px]">
            {/* LEFT SIDEBAR NAVIGATION PANEL */}
            <div className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                      className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition cursor-pointer"
                    >
                      <Wrench className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="font-extrabold text-sm text-slate-900 leading-tight">Service</h2>
                      <p className="font-bold text-xs text-indigo-600 leading-tight">Manager</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl lg:hidden"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>

                {/* Sidebar Navigation Items */}
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: Home, count: null },
                    { id: 'requests', label: 'Jobs Overview', icon: ClipboardCheck, count: services.length },
                    { id: 'roster', label: 'Technicians', icon: Users, count: users.filter((u) => u.role === UserRole.SERVICE_TECHNICIAN).length },
                    { id: 'home_services', label: 'Customers', icon: UserCheck, count: services.filter((s) => s.isHomeService).length || null },
                    { id: 'gate_stream', label: 'Reports', icon: BarChart3, count: null },
                    { id: 'payments', label: 'Payments', icon: CreditCard, count: payments.length },
                    { id: 'payroll', label: 'Payroll', icon: Wallet, count: payrollList.filter((p) => p.status === 'Pending Review').length || null },
                    { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.length || 3 },
                    { id: 'settings', label: 'Settings', icon: Settings, count: null },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = managerTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setManagerTab(item.id as any)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs border border-indigo-100/50'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== null && item.count > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar Footer — User Profile Card & Illustration Art */}
              <div className="pt-6 space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      JM
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-none">John Manager</h4>
                      <p className="text-3xs text-slate-500 font-medium mt-0.5">Service Manager</p>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                {/* Decorative Workshop Art Vector */}
                <div className="relative h-20 rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 overflow-hidden p-3 text-white flex flex-col justify-end shadow-xs">
                  <div className="absolute top-2 right-2 text-indigo-300/30">
                    <Wrench className="w-12 h-12 -rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-mono text-indigo-300 font-bold block uppercase tracking-wider">Garage Control</span>
                    <span className="text-2xs text-slate-300 font-medium block">Operations Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN CONTENT AREA */}
            <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
              {/* Job Submit Banner */}
              {jobSubmitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{jobSubmitSuccess}</span>
                  </div>
                  <button onClick={() => setJobSubmitSuccess('')} className="text-emerald-600 font-bold">✕</button>
                </div>
              )}

              {/* TOP HEADER WELCOME BAR */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Good morning, John <span className="animate-bounce inline-block">👋</span>
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Here's an overview of your service operations today.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Notification Bell Badge */}
                  <button
                    type="button"
                    onClick={() => setManagerTab('notifications')}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 hover:text-indigo-600 relative shadow-2xs transition cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-xs">
                      3
                    </span>
                  </button>

                  {/* Live Date & Time Display */}
                  <div className="px-3.5 py-2 bg-white border border-slate-200/80 rounded-2xl shadow-2xs text-right">
                    <span className="text-2xs font-bold text-slate-800 block">Mon, 28 Jul 2025</span>
                    <span className="text-3xs font-mono font-bold text-indigo-600 block">09:30 AM</span>
                  </div>
                </div>
              </div>

              {/* DASHBOARD TAB CONTENT (Exact match to Attached Screenshot) */}
              {managerTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* TOP 4 KPI SUMMARY CARDS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Active Jobs */}
                    <div className="relative bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white border border-indigo-200/70 rounded-3xl p-4 shadow-2xs overflow-hidden group hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <span className="text-3xs font-mono font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full">
                          In Progress
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-black text-slate-900 tracking-tight block">
                          {services.filter((s) => s.status !== ServiceStatus.COMPLETED).length || 12}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Active Jobs</h4>
                        <p className="text-3xs text-slate-500">In Progress</p>
                      </div>
                      {/* Decorative Wave Accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 opacity-20 rounded-b-3xl" />
                    </div>

                    {/* Card 2: Waiting Approval */}
                    <div className="relative bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border border-amber-200/70 rounded-3xl p-4 shadow-2xs overflow-hidden group hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
                          <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-3xs font-mono font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full">
                          Jobs
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-black text-amber-600 tracking-tight block">
                          {services.filter((s) => !s.technicianId).length || 5}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Waiting Approval</h4>
                        <p className="text-3xs text-slate-500">Jobs</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-20 rounded-b-3xl" />
                    </div>

                    {/* Card 3: Completed Today */}
                    <div className="relative bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white border border-emerald-200/70 rounded-3xl p-4 shadow-2xs overflow-hidden group hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <span className="text-3xs font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                          Jobs
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-3xl font-black text-emerald-600 tracking-tight block">
                          {services.filter((s) => s.status === ServiceStatus.COMPLETED).length || 18}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Completed Today</h4>
                        <p className="text-3xs text-slate-500">Jobs</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 opacity-20 rounded-b-3xl" />
                    </div>

                    {/* Card 4: Today's Revenue */}
                    <div className="relative bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-white border border-sky-200/70 rounded-3xl p-4 shadow-2xs overflow-hidden group hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-200">
                          <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-3xs font-mono font-bold text-sky-800 bg-sky-100/80 px-2.5 py-1 rounded-full">
                          Total Invoiced
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-2xl font-black text-sky-700 tracking-tight block font-mono">
                          UGX 2.4M
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">Today's Revenue</h4>
                        <p className="text-3xs text-slate-500">Total Invoiced</p>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500 opacity-20 rounded-b-3xl" />
                    </div>
                  </div>

                  {/* QUICK ACTIONS SECTION (5 Colorful Pastel Action Cards) */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* Action 1: Create Job */}
                      <button
                        type="button"
                        onClick={() => setShowNewJobModal(true)}
                        className="p-4 rounded-2xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/60 transition-all text-center flex flex-col items-center justify-center space-y-2 group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Create Job</h4>
                          <p className="text-3xs text-slate-500 font-medium">Add new service job</p>
                        </div>
                      </button>

                      {/* Action 2: Assign Job */}
                      <button
                        type="button"
                        onClick={() => {
                          handleAutoDispatch();
                          setManagerTab('requests');
                        }}
                        className="p-4 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200/60 transition-all text-center flex flex-col items-center justify-center space-y-2 group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Assign Job</h4>
                          <p className="text-3xs text-slate-500 font-medium">Assign to technician</p>
                        </div>
                      </button>

                      {/* Action 3: Job Status */}
                      <button
                        type="button"
                        onClick={() => setManagerTab('requests')}
                        className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60 transition-all text-center flex flex-col items-center justify-center space-y-2 group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Job Status</h4>
                          <p className="text-3xs text-slate-500 font-medium">View all job status</p>
                        </div>
                      </button>

                      {/* Action 4: Reports */}
                      <button
                        type="button"
                        onClick={() => setManagerTab('gate_stream')}
                        className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60 transition-all text-center flex flex-col items-center justify-center space-y-2 group cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Reports</h4>
                          <p className="text-3xs text-slate-500 font-medium">View reports & stats</p>
                        </div>
                      </button>

                      {/* Action 5: Payments */}
                      <button
                        type="button"
                        onClick={() => setManagerTab('payments')}
                        className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200/60 transition-all text-center flex flex-col items-center justify-center space-y-2 group cursor-pointer col-span-2 sm:col-span-1"
                      >
                        <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">Payments</h4>
                          <p className="text-3xs text-slate-500 font-medium">Manage payments</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* TWO COLUMN SECTION: JOBS IN PROGRESS & TODAY'S SCHEDULE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* LEFT COLUMN: JOBS IN PROGRESS */}
                    <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-extrabold text-slate-900">Jobs in Progress</h3>
                        <button
                          type="button"
                          onClick={() => setManagerTab('requests')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {/* Showcase Jobs Items */}
                      <div className="space-y-2.5">
                        {/* Job Item 1 */}
                        <div
                          onClick={() => setManagerTab('requests')}
                          className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/60 transition cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Toyota Harrier</h4>
                              <p className="text-3xs font-mono text-slate-500">UAX 456B</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Oil Change</h4>
                            <p className="text-3xs text-slate-500">David Otim</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold bg-sky-100 text-sky-700 flex items-center gap-1">
                            In Workshop <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          </span>
                        </div>

                        {/* Job Item 2 */}
                        <div
                          onClick={() => setManagerTab('requests')}
                          className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/60 transition cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Subaru Forester</h4>
                              <p className="text-3xs font-mono text-slate-500">UBM 915P</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Brake Inspection</h4>
                            <p className="text-3xs text-slate-500">Sarah A.</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                            Waiting Parts <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          </span>
                        </div>

                        {/* Job Item 3 */}
                        <div
                          onClick={() => setManagerTab('requests')}
                          className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/60 transition cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                              <Car className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Nissan X-Trail</h4>
                              <p className="text-3xs font-mono text-slate-500">UAZ 123Q</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">Engine Diagnostics</h4>
                            <p className="text-3xs text-slate-500">James K.</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                            In Progress <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </span>
                        </div>

                        {/* Additional dynamic active jobs */}
                        {services
                          .filter((s) => s.status !== ServiceStatus.COMPLETED)
                          .slice(0, 2)
                          .map((srv) => {
                            const veh = vehicles.find((v) => v.id === srv.vehicleId);
                            const tech = users.find((u) => u.id === srv.technicianId);
                            return (
                              <div
                                key={srv.id}
                                onClick={() => setManagerTab('requests')}
                                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-200/60 transition cursor-pointer flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold">
                                    <Wrench className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-slate-900">{veh?.make || 'Vehicle'} {veh?.model || ''}</h4>
                                    <p className="text-3xs font-mono text-slate-500">{veh?.registrationNumber || srv.id.toUpperCase()}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800">{srv.serviceType}</h4>
                                  <p className="text-3xs text-slate-500">{tech?.name || 'Unassigned'}</p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold bg-purple-100 text-purple-700">
                                  {srv.status}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: TODAY'S SCHEDULE */}
                    <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-extrabold text-slate-900">Today's Schedule</h3>
                        <button
                          type="button"
                          onClick={() => setManagerTab('gate_stream')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                          View All
                        </button>
                      </div>

                      {/* Timeline Items */}
                      <div className="space-y-4 relative before:absolute before:inset-0 before:left-[4.2rem] before:w-0.5 before:bg-slate-100">
                        {/* Timeline 1 */}
                        <div className="flex items-start gap-4 relative">
                          <span className="text-2xs font-mono font-bold text-slate-500 w-14 shrink-0 pt-0.5">09:00 AM</span>
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shrink-0 mt-0.5 z-10" />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Team Briefing</h4>
                            <p className="text-3xs text-slate-500 font-medium">Daily meeting with technicians</p>
                          </div>
                        </div>

                        {/* Timeline 2 */}
                        <div className="flex items-start gap-4 relative">
                          <span className="text-2xs font-mono font-bold text-slate-500 w-14 shrink-0 pt-0.5">11:00 AM</span>
                          <div className="w-3.5 h-3.5 rounded-full bg-sky-500 ring-4 ring-sky-100 shrink-0 mt-0.5 z-10" />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Job Review</h4>
                            <p className="text-3xs text-slate-500 font-medium font-medium">Review pending approvals</p>
                          </div>
                        </div>

                        {/* Timeline 3 */}
                        <div className="flex items-start gap-4 relative">
                          <span className="text-2xs font-mono font-bold text-slate-500 w-14 shrink-0 pt-0.5">02:00 PM</span>
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0 mt-0.5 z-10" />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Customer Follow-up</h4>
                            <p className="text-3xs text-slate-500 font-medium">Update on completed jobs</p>
                          </div>
                        </div>

                        {/* Timeline 4 */}
                        <div className="flex items-start gap-4 relative">
                          <span className="text-2xs font-mono font-bold text-slate-500 w-14 shrink-0 pt-0.5">04:00 PM</span>
                          <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 shrink-0 mt-0.5 z-10" />
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">Performance Check</h4>
                            <p className="text-3xs text-slate-500 font-medium">Review daily performance</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TABS OTHER THAN DASHBOARD (Jobs Overview, Technicians, Customers, Reports, Payments, Inventory, Payroll, Notifications, Settings) */}
              {managerTab !== 'dashboard' && (
                <div className="space-y-4">
                  {/* Module Bar & Controls */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xs font-mono text-slate-400 uppercase font-bold">Active View:</span>
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-mono text-xs font-extrabold border border-indigo-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        {managerTab === 'requests' && '📋 Jobs Overview'}
                        {managerTab === 'roster' && '👥 Technicians Roster'}
                        {managerTab === 'home_services' && '👤 Customers & Home Requests'}
                        {managerTab === 'gate_stream' && '📊 Reports & Gate Stream'}
                        {managerTab === 'payments' && '💳 Payments Ledger'}
                        {managerTab === 'inventory' && '📦 Parts & Inventory'}
                        {managerTab === 'payroll' && '💰 Payroll & Payslips'}
                        {managerTab === 'notifications' && '🔔 Live Notifications'}
                        {managerTab === 'settings' && '⚙️ System & Email Settings'}
                      </span>
                    </div>

                    {/* Search & View Mode Controls for Jobs */}
                    {managerTab === 'requests' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Search vehicle or job..."
                          value={managerSearchQuery}
                          onChange={(e) => setManagerSearchQuery(e.target.value)}
                          className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-full sm:w-48"
                        />
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <button
                            onClick={() => setManagerViewMode('kanban')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${
                              managerViewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                            }`}
                          >
                            Kanban
                          </button>
                          <button
                            onClick={() => setManagerViewMode('table')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${
                              managerViewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                            }`}
                          >
                            Table
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TAB 8: NOTIFICATIONS TAB */}
                  {managerTab === 'notifications' && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-indigo-600" /> Live Notifications Stream
                          </h3>
                          <p className="text-xs text-slate-500">Real-time alerts, duty acceptances, and gate passes</p>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearNotifications}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Clear Feed
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 flex items-start gap-3">
                          <div className="p-2 bg-indigo-600 text-white rounded-xl">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs">New Service Duty Assigned</h4>
                            <p className="text-xs mt-0.5">Toyota Harrier (UAX 456B) assigned to David Otim for Oil Change.</p>
                            <span className="text-3xs font-mono text-slate-500 mt-1 block">Just now</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                          <div className="p-2 bg-emerald-600 text-white rounded-xl">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs">Vehicle Gate Pass Authorized</h4>
                            <p className="text-xs mt-0.5">Nissan X-Trail cleared at Gate 2 for workshop entry.</p>
                            <span className="text-3xs font-mono text-slate-500 mt-1 block">12 mins ago</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                          <div className="p-2 bg-amber-600 text-white rounded-xl">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs">Parts Awaiting Allocation</h4>
                            <p className="text-xs mt-0.5">Subaru Forester brake pads allocated from workshop inventory.</p>
                            <span className="text-3xs font-mono text-slate-500 mt-1 block">45 mins ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 9: SETTINGS TAB */}
                  {managerTab === 'settings' && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-6 animate-fadeIn">
                      <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-indigo-600" /> Portal Settings & Auto Dispatch
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Configure business Gmail integration & automated job routing</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Google Workspace Email</h4>
                              <p className="text-3xs text-slate-500">Auto-dispatch service receipts & job updates</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await googleSignIn();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            {googleUser ? `Connected as ${googleUser.email}` : 'Connect Business Gmail'}
                          </button>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                              <Zap className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">Auto Job Dispatcher</h4>
                              <p className="text-3xs text-slate-500">Automatically route unassigned jobs based on tech workload</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAutoDispatch}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                          >
                            ⚡ Run Auto Dispatch Algorithm Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: SERVICE REQUESTS QUEUE (Kanban or Table) */}
                  {managerTab === 'requests' && (() => {
            const filteredServices = services.filter((srv) => {
              if (!managerSearchQuery) return true;
              const q = managerSearchQuery.toLowerCase();
              const veh = vehicles.find((v) => v.id === srv.vehicleId);
              return (
                srv.id.toLowerCase().includes(q) ||
                srv.serviceType.toLowerCase().includes(q) ||
                veh?.registrationNumber.toLowerCase().includes(q) ||
                veh?.make.toLowerCase().includes(q) ||
                veh?.model.toLowerCase().includes(q)
              );
            });

            if (managerViewMode === 'kanban') {
              const pendingJobs = filteredServices.filter((s) => !s.technicianId);
              const activeJobs = filteredServices.filter((s) => s.technicianId && s.status !== ServiceStatus.COMPLETED);
              const completedJobs = filteredServices.filter((s) => s.status === ServiceStatus.COMPLETED);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Column 1: Pending Assignment */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">
                          Pending Assignment ({pendingJobs.length})
                        </h3>
                      </div>
                      <span className="text-3xs font-mono text-slate-400">Unassigned</span>
                    </div>

                    {pendingJobs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                        No pending unassigned jobs.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingJobs.map((srv) => {
                          const veh = vehicles.find((v) => v.id === srv.vehicleId);
                          return (
                            <div
                              key={srv.id}
                              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 hover:border-sky-300 transition"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-3xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                    {srv.id.toUpperCase()}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                    {veh ? `${veh.make} ${veh.model}` : 'Vehicle'}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-slate-600">
                                    {veh?.registrationNumber}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  UGX {srv.cost.toLocaleString()}
                                </span>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-3xs font-mono font-bold text-slate-500 uppercase">
                                  <span>Services Grouped Under Vehicle:</span>
                                  <span className="text-sky-700">{srv.isHomeService ? '🏠 Home Service' : '🛠️ Workshop'}</span>
                                </div>
                                {(() => {
                                  const reqList = srv.selectedServicesList && srv.selectedServicesList.length > 0
                                    ? srv.selectedServicesList
                                    : [{ title: srv.serviceType.replace(/^🏠 Home Service:\s*/, ''), cost: srv.cost }];
                                  return (
                                    <ul className="space-y-0.5 text-2xs font-bold text-slate-800">
                                      {reqList.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between">
                                          <span className="truncate flex items-center gap-1">
                                            <span className="text-sky-600 font-bold">•</span> {item.title}
                                          </span>
                                          <span className="text-3xs font-mono text-slate-500">UGX {item.cost.toLocaleString()}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                })()}
                                {srv.diagnosticNotes && (
                                  <p className="text-3xs text-slate-500 line-clamp-2 italic pt-1 border-t border-slate-100">
                                    &quot;{srv.diagnosticNotes}&quot;
                                  </p>
                                )}
                              </div>

                              <div className="pt-1 border-t border-slate-100 flex items-center gap-2">
                                <select
                                  value={selectedTechForJob[srv.id] || ''}
                                  onChange={(e) =>
                                    setSelectedTechForJob({ ...selectedTechForJob, [srv.id]: e.target.value })
                                  }
                                  className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-medium flex-1"
                                >
                                  <option value="">-- Assign Mechanic --</option>
                                  {users
                                    .filter((u) => u.role === UserRole.SERVICE_TECHNICIAN)
                                    .map((techUser) => (
                                      <option key={techUser.id} value={techUser.id}>
                                        👨‍🔧 {techUser.name}
                                      </option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => handleAssignTechnician(srv.id)}
                                  disabled={!selectedTechForJob[srv.id]}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition cursor-pointer shrink-0"
                                >
                                  Assign
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 2: In Workshop */}
                  <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-sky-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                        <h3 className="font-extrabold text-xs text-sky-950 uppercase tracking-wider font-mono">
                          In Workshop / On Lift ({activeJobs.length})
                        </h3>
                      </div>
                      <span className="text-3xs font-mono text-sky-600">Active Work</span>
                    </div>

                    {activeJobs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                        No active jobs currently on workshop lifts.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {activeJobs.map((srv) => {
                          const veh = vehicles.find((v) => v.id === srv.vehicleId);
                          const tech = users.find((u) => u.id === srv.technicianId);
                          return (
                            <div
                              key={srv.id}
                              className="bg-white border border-sky-200 rounded-xl p-4 shadow-xs space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-3xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                    {srv.id.toUpperCase()}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                    {veh ? `${veh.make} ${veh.model}` : 'Vehicle'}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-slate-600">
                                    {veh?.registrationNumber}
                                  </span>
                                </div>
                                <span className="px-2.5 py-1 text-3xs font-mono font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                                  {srv.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-3xs font-mono font-bold text-slate-500 uppercase">
                                  <span>Services Grouped Under Vehicle:</span>
                                  <span className="text-sky-700">{srv.isHomeService ? '🏠 Home Service' : '🛠️ Workshop'}</span>
                                </div>
                                {(() => {
                                  const reqList = srv.selectedServicesList && srv.selectedServicesList.length > 0
                                    ? srv.selectedServicesList
                                    : [{ title: srv.serviceType.replace(/^🏠 Home Service:\s*/, ''), cost: srv.cost, progress: srv.status === ServiceStatus.COMPLETED ? 'Completed' : 'In Progress' }];
                                  return (
                                    <ul className="space-y-0.5 text-2xs font-bold text-slate-800">
                                      {reqList.map((item, idx) => (
                                        <li key={idx} className="flex items-center justify-between">
                                          <span className="truncate flex items-center gap-1">
                                            <span className="text-sky-600 font-bold">•</span> {item.title}
                                          </span>
                                          <span className={`text-[8px] font-mono font-bold px-1 rounded ${
                                            item.progress === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {item.progress || 'In Progress'}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                })()}
                                {tech && (
                                  <div className="flex items-center gap-1.5 text-xs text-sky-700 font-bold pt-1 border-t border-slate-100">
                                    <span>👨‍🔧 Assigned Mechanic:</span>
                                    <span>{tech.name}</span>
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 text-3xs">Cost Estimate:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  UGX {srv.cost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Column 3: Completed / Ready */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <h3 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider font-mono">
                          Completed / Inspection Passed ({completedJobs.length})
                        </h3>
                      </div>
                      <span className="text-3xs font-mono text-emerald-600">Ready for Exit</span>
                    </div>

                    {completedJobs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                        No completed jobs in this session yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {completedJobs.map((srv) => {
                          const veh = vehicles.find((v) => v.id === srv.vehicleId);
                          const isPaid = payments.some(
                            (p) => p.relatedId === srv.id || p.amount === srv.cost
                          );
                          return (
                            <div
                              key={srv.id}
                              className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs space-y-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-3xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    {srv.id.toUpperCase()}
                                  </span>
                                  <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                    {veh ? `${veh.make} ${veh.model}` : 'Vehicle'}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-slate-600">
                                    {veh?.registrationNumber}
                                  </span>
                                </div>
                                {isPaid ? (
                                  <span className="px-2.5 py-1 text-3xs font-mono font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                                    PAID ✓
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 text-3xs font-mono font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                                    PENDING PAYMENT
                                  </span>
                                )}
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                                <span className="text-xs font-bold text-slate-800 block">{srv.serviceType}</span>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 text-3xs">Invoiced:</span>
                                <span className="font-mono font-black text-emerald-700">
                                  UGX {srv.cost.toLocaleString()}
                                </span>
                              </div>

                              {/* Service Manager Customer Notification Action */}
                              <div className="pt-2 border-t border-emerald-100 space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleNotifyCustomerByManager(srv.id)}
                                  className={`w-full py-2 px-3 rounded-xl font-bold text-3xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                                    srv.customerNotifiedByManager
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  <span>📢 {srv.customerNotifiedByManager ? 'Customer Notified ✓' : 'Notify Customer Car Complete'}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Table View Mode
            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600 border-collapse">
                    <thead className="text-3xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 font-mono">
                      <tr>
                        <th className="px-3.5 py-2.5">Service ID</th>
                        <th className="px-3.5 py-2.5">Vehicle</th>
                        <th className="px-3.5 py-2.5">Service Type</th>
                        <th className="px-3.5 py-2.5">Assigned Mechanic</th>
                        <th className="px-3.5 py-2.5">Status</th>
                        <th className="px-3.5 py-2.5">Payment</th>
                        <th className="px-3.5 py-2.5">Cost</th>
                        <th className="px-3.5 py-2.5 text-right">Dispatch Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((srv) => {
                        const veh = vehicles.find((v) => v.id === srv.vehicleId);
                        const tech = users.find((u) => u.id === srv.technicianId);
                        const isPaid = payments.some(
                          (p) => p.relatedId === srv.id || p.amount === srv.cost
                        );

                        return (
                          <tr key={srv.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition">
                            <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{srv.id.toUpperCase()}</td>
                            <td className="px-3.5 py-3 font-medium text-slate-800">
                              <span className="block font-bold">{veh?.make} {veh?.model}</span>
                              <span className="font-mono text-3xs text-sky-700 font-bold">{veh?.registrationNumber}</span>
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="font-extrabold text-slate-900 block">{srv.serviceType}</span>
                              {srv.diagnosticNotes && (
                                <span className="text-3xs text-slate-500 line-clamp-1 italic">
                                  &quot;{srv.diagnosticNotes}&quot;
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3">
                              {tech ? (
                                <span className="font-semibold text-sky-700 flex items-center gap-1">
                                  <span>👨‍🔧</span> {tech.name}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold italic">Unassigned</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="px-2 py-0.5 font-bold font-mono text-3xs bg-slate-100 text-slate-700 border border-slate-200 rounded">
                                {srv.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-3.5 py-3">
                              {isPaid ? (
                                <span className="px-2 py-0.5 font-bold font-mono text-3xs bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                                  PAID ✓
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 font-bold font-mono text-3xs bg-amber-50 text-amber-800 rounded border border-amber-200">
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                              UGX {srv.cost.toLocaleString()}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {!srv.technicianId ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <select
                                    value={selectedTechForJob[srv.id] || ''}
                                    onChange={(e) =>
                                      setSelectedTechForJob({ ...selectedTechForJob, [srv.id]: e.target.value })
                                    }
                                    className="text-3xs p-1 border border-slate-200 rounded bg-white font-medium"
                                  >
                                    <option value="">-- Mechanic --</option>
                                    {users
                                      .filter((u) => u.role === UserRole.SERVICE_TECHNICIAN)
                                      .map((techUser) => (
                                        <option key={techUser.id} value={techUser.id}>
                                          {techUser.name}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={() => handleAssignTechnician(srv.id)}
                                    disabled={!selectedTechForJob[srv.id]}
                                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 text-white font-bold text-3xs rounded cursor-pointer transition"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ) : (
                                <span className="text-3xs font-mono text-slate-400">Assigned</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB: HOME SERVICE REQUESTS HUB */}
          {managerTab === 'home_services' && (() => {
            const homeServicesList = services.filter(
              (s) =>
                s.isHomeService ||
                s.homeAddress ||
                (s.diagnosticNotes && s.diagnosticNotes.toLowerCase().includes('landmark')) ||
                (s.serviceType && s.serviceType.toLowerCase().includes('home'))
            );

            return (
              <div className="space-y-4 animate-fadeIn">
                {/* Home Service Header Banner */}
                <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 border border-sky-500/30 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">Doorstep & Workplace Home Service Requests ({homeServicesList.length})</h3>
                      <p className="text-3xs text-sky-200">Mobile technician dispatches directly to customer home & workplace locations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowNewJobModal(true)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <PlusSquare className="w-4 h-4" />
                    <span>Create Home Service Card</span>
                  </button>
                </div>

                {homeServicesList.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-xs">
                    <Home className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-black text-slate-800">No Home Service Requests Currently Logged</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Customers can select doorstep servicing from their account portal, or managers can log home service requests using the button above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {homeServicesList.map((srv) => {
                      const veh = vehicles.find((v) => v.id === srv.vehicleId);
                      const cust = users.find((u) => u.id === srv.customerId);
                      const tech = users.find((u) => u.id === srv.technicianId);

                      return (
                        <div
                          key={srv.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-3.5 shadow-xs hover:border-sky-400 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xs font-mono font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 uppercase">
                                  🏠 Doorstep Service
                                </span>
                                <span className="text-3xs font-mono font-bold text-slate-400">
                                  {srv.id.toUpperCase()}
                                </span>
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                                {srv.serviceType}
                              </h4>
                            </div>
                            <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                              UGX {(srv.cost || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                              <span className="text-3xs font-mono text-slate-400 block uppercase font-bold">Vehicle & Customer</span>
                              <p className="font-bold text-slate-900">
                                {veh ? `${veh.make} ${veh.model} (${veh.registrationNumber})` : 'Vehicle Specified'}
                              </p>
                              <p className="text-3xs text-slate-600">
                                Customer: <strong className="text-slate-800">{cust?.name || 'Registered Driver'}</strong> ({srv.contactPhone || cust?.phone || '+256 772 123456'})
                              </p>
                            </div>

                            <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-100 space-y-1">
                              <span className="text-3xs font-mono text-sky-800 block uppercase font-bold">Location & Address</span>
                              <p className="font-bold text-slate-900 text-xs">
                                📍 {srv.homeAddress || 'Kampala Customer Residence'}
                              </p>
                              {srv.homeLandmark && (
                                <p className="text-3xs text-slate-600">
                                  Landmark: <strong className="text-slate-800">{srv.homeLandmark}</strong>
                                </p>
                              )}
                              {srv.diagnosticNotes && (
                                <p className="text-3xs text-slate-500 italic">
                                  &quot;{srv.diagnosticNotes}&quot;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Technician Mobile Dispatch Selector */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <span className="text-3xs font-bold text-slate-500">Mobile Mechanic:</span>
                            <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                              <select
                                value={selectedTechForJob[srv.id] || srv.technicianId || ''}
                                onChange={(e) =>
                                  setSelectedTechForJob({ ...selectedTechForJob, [srv.id]: e.target.value })
                                }
                                className="text-2xs p-1.5 border border-slate-200 rounded-lg bg-white font-medium w-full"
                              >
                                <option value="">-- Assign Mobile Tech --</option>
                                {users
                                  .filter((u) => u.role === UserRole.SERVICE_TECHNICIAN)
                                  .map((techUser) => (
                                    <option key={techUser.id} value={techUser.id}>
                                      👨‍🔧 {techUser.name} ({techUser.specialty || 'Mechanic'})
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={() => handleAssignTechnician(srv.id)}
                                disabled={!selectedTechForJob[srv.id] && !srv.technicianId}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 text-white font-bold text-3xs rounded-lg transition cursor-pointer shrink-0"
                              >
                                {srv.technicianId ? 'Update' : 'Dispatch'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          {managerTab === 'roster' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600" />
                    Registered Staff Directory & Personnel Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Service Manager control over active Service Technicians and Parking Yard Attendants across facility zones.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegisterStaffModal(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Register New Staff Member</span>
                </button>
              </div>

              {/* Service Manager Verification Control Box */}
              {(() => {
                const unverifiedUsers = users.filter((u) => u.isVerified === false);
                if (unverifiedUsers.length === 0) return null;
                return (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-500/20 text-amber-700 rounded-lg font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">
                            Pending Account Verifications ({unverifiedUsers.length})
                          </h4>
                          <p className="text-xs text-slate-500">
                            Service Manager manual verification control for unverified user accounts.
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-3xs font-mono font-bold rounded-full border border-amber-200">
                        Action Required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {unverifiedUsers.map((u) => (
                        <div
                          key={u.id}
                          className="bg-white border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">{u.name}</div>
                            <div className="text-3xs font-mono text-slate-500">{u.email}</div>
                            <span className="text-4xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                              {u.role}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${u.id}/verify`, { method: 'PUT' });
                                if (res.ok && onRefreshAll) {
                                  onRefreshAll();
                                }
                              } catch {}
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-3xs rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify Account</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg font-bold text-xs">👨‍🔧</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Registered Service Technicians ({users.filter((u) => u.role === UserRole.SERVICE_TECHNICIAN).length})</h4>
                      <p className="text-3xs text-slate-500">Workshop mechanics assigned to vehicle lift repairs and inspection duty queues.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {users
                    .filter((u) => u.role === UserRole.SERVICE_TECHNICIAN)
                    .map((tech) => {
                      const techJobs = services.filter((s) => s.technicianId === tech.id);
                      const activeJob = techJobs.find((s) => s.status !== ServiceStatus.COMPLETED);
                      const activeVeh = activeJob ? vehicles.find((v) => v.id === activeJob.vehicleId) : null;

                      return (
                        <div
                          key={tech.id}
                          className="bg-slate-50/60 border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-sky-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                👨‍🔧
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900">{tech.name}</h4>
                                <p className="text-3xs font-mono text-slate-500">{tech.email}</p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-3xs font-mono font-bold ${
                                activeJob
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {activeJob ? 'BUSY ON LIFT' : 'AVAILABLE'}
                            </span>
                          </div>

                          <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-3xs text-slate-500 font-mono">
                              <span>ACTIVE ASSIGNMENT</span>
                              <span className="font-bold text-slate-700">{techJobs.length} Jobs Total</span>
                            </div>

                            {activeJob ? (
                              <div className="space-y-1">
                                <span className="font-extrabold text-slate-900 block text-xs">{activeJob.serviceType}</span>
                                <span className="text-3xs font-mono font-bold text-sky-700 block">
                                  {activeVeh ? `${activeVeh.make} ${activeVeh.model} (${activeVeh.registrationNumber})` : 'Vehicle'}
                                </span>
                                {activeJob.assignmentStatus && (
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded inline-block ${
                                    activeJob.assignmentStatus === 'Accepted'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : activeJob.assignmentStatus === 'Rejected'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}>
                                    Duty Status: {activeJob.assignmentStatus}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-400 text-3xs italic">No active repair task assigned right now.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Section 2: Registered Parking Yard Attendants */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs">🅿️</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">Registered Parking Yard Attendants ({users.filter((u) => u.role === UserRole.PARKING_ATTENDANT).length})</h4>
                      <p className="text-3xs text-slate-500">Attendants managing yard entry checks, gate authorizations, and pickup slot clearances.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {users
                    .filter((u) => u.role === UserRole.PARKING_ATTENDANT)
                    .map((attendant) => (
                      <div
                        key={attendant.id}
                        className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                              🅿️
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900">{attendant.name}</h4>
                              <p className="text-3xs font-mono text-slate-500">{attendant.email}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            ON SHIFT
                          </span>
                        </div>

                        <div className="bg-white rounded-xl p-3 border border-indigo-100 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-3xs text-slate-500 font-mono">
                            <span>YARD ZONE</span>
                            <span className="font-bold text-indigo-800">Main Ground Yard</span>
                          </div>
                          <p className="text-3xs text-slate-600">
                            Authorized for entry gate scanning, ANPR validation, and pickup bay handoffs.
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GATE STREAM */}
          {managerTab === 'gate_stream' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                    Live Gate Entry & Exit Authorizations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time attendant logs recorded when vehicles enter or leave the facility
                  </p>
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={handleClearNotifications}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
                  >
                    Clear Stream
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">No recent gate notifications.</p>
                  <p className="text-3xs text-slate-400">
                    Gate checks performed by attendants will automatically reflect here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition ${
                        notif.type === 'ENTRY'
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : notif.type === 'EXIT'
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                          : 'bg-sky-50/80 border-sky-200 text-sky-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg font-bold text-xs text-white ${
                            notif.type === 'ENTRY'
                              ? 'bg-emerald-600'
                              : notif.type === 'EXIT'
                              ? 'bg-indigo-600'
                              : 'bg-sky-600'
                          }`}
                        >
                          {notif.type === 'ENTRY' ? 'IN' : notif.type === 'EXIT' ? 'OUT' : 'SRV'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-xs">{notif.title}</h4>
                            <span className="text-3xs font-mono font-bold bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              {notif.type}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 font-medium">{notif.message}</p>
                          <p className="text-3xs font-mono text-slate-500 mt-1">
                            {new Date(notif.timestamp).toLocaleTimeString()} • {new Date(notif.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className="text-3xs font-mono font-bold px-2 py-0.5 bg-white rounded border border-slate-200 text-slate-600 shrink-0">
                        Authorized
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS LEDGER */}
          {managerTab === 'payments' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <span className="text-3xs font-mono uppercase text-emerald-700 font-bold block">Total Revenue Collected</span>
                  <span className="text-xl font-black text-emerald-950 font-mono">
                    UGX {payments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                  </span>
                  <span className="text-3xs text-emerald-600 block mt-0.5">Across services & parking</span>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl">
                  <span className="text-3xs font-mono uppercase text-sky-700 font-bold block">Garage Services Invoiced</span>
                  <span className="text-xl font-black text-sky-950 font-mono">
                    UGX {services.reduce((acc, s) => acc + (s.cost || 0), 0).toLocaleString()}
                  </span>
                  <span className="text-3xs text-sky-600 block mt-0.5">{services.length} Service Invoices</span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                  <span className="text-3xs font-mono uppercase text-indigo-700 font-bold block">Total Transactions</span>
                  <span className="text-xl font-black text-indigo-950 font-mono">{payments.length} Payments</span>
                  <span className="text-3xs text-indigo-600 block mt-0.5">Mobile Money & Visa</span>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left text-slate-600 border-collapse">
                  <thead className="text-3xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 font-mono">
                    <tr>
                      <th className="px-3.5 py-2.5">Transaction ID</th>
                      <th className="px-3.5 py-2.5">Customer ID</th>
                      <th className="px-3.5 py-2.5">Method</th>
                      <th className="px-3.5 py-2.5">Amount (UGX)</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{pay.id.toUpperCase()}</td>
                        <td className="px-3.5 py-3 font-mono text-slate-700">{pay.userId}</td>
                        <td className="px-3.5 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-3xs font-mono font-bold border border-slate-200">
                            {pay.paymentMethod || 'Mobile Money'}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono font-bold text-emerald-700">
                          UGX {pay.amount.toLocaleString()}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="px-2 py-0.5 font-bold font-mono text-3xs bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">
                            {(pay.status || 'SUCCESS').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-3xs text-slate-500">
                          {new Date(pay.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: INVENTORY */}
          {managerTab === 'inventory' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Spare Parts & Workshop Inventory</h3>
                  <p className="text-xs text-slate-500">Live stock levels available for mechanic service jobs</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {inventory.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-3 space-y-1.5 bg-slate-50/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{item.partName}</h4>
                        <span className="text-3xs font-mono text-slate-500">{item.partNumber}</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-700">
                        UGX {item.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 font-mono">
                      <span className="text-slate-500">In Stock:</span>
                      <span className={`font-bold ${item.quantity < 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {item.quantity} units
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: PAYROLL & PAYMENTS */}
          {managerTab === 'payroll' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notification Banner */}
              {payrollSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{payrollSuccessMsg}</span>
                  </div>
                  <button onClick={() => setPayrollSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
                    ✕
                  </button>
                </div>
              )}

              {/* Top Operations Header Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 border border-emerald-200">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        Staff Service Payment Management
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Direct service-based payouts calculated automatically from completed vehicle jobs to registered staff numbers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncCompletedServices}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Live Services</span>
                  </button>

                  <button
                    onClick={handlePayAllPending}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Disburse All Pending</span>
                  </button>

                  {/* Toggle Cycle View */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setPayrollActiveTab('current')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        payrollActiveTab === 'current' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      July Payouts
                    </button>
                    <button
                      onClick={() => setPayrollActiveTab('history')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        payrollActiveTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Payment History
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Summary Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-xs border border-slate-700">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                    Total Completed Service Amount
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">
                    UGX {payrollList.reduce((acc, r) => acc + r.totalServiceAmount, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium block mt-1">
                    {payrollList.reduce((acc, r) => acc + r.completedServices.length, 0)} Completed Jobs
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
                    Pending Disbursals
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono mt-0.5 block">
                    UGX {payrollList.filter((r) => r.status === 'Pending').reduce((acc, r) => acc + r.totalServiceAmount, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium block mt-1">
                    {payrollList.filter((r) => r.status === 'Pending').length} Pending Mobile Payouts
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block">
                    Disbursed Payouts
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
                    UGX {payrollList.filter((r) => r.status === 'Paid').reduce((acc, r) => acc + r.totalServiceAmount, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium block mt-1">
                    {payrollList.filter((r) => r.status === 'Paid').length} Transferred via MoMo/Bank
                  </span>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-indigo-800 font-bold block">
                    Total Staff Tracked
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-950 font-mono mt-0.5 block">
                    {payrollList.length} Staff Members
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium block mt-1">
                    Technicians & Attendants
                  </span>
                </div>
              </div>

              {payrollActiveTab === 'current' ? (
                <div className="space-y-4">
                  {/* Search and Filters Toolbar */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search staff name, phone, service..."
                        value={payrollSearchQuery}
                        onChange={(e) => setPayrollSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      <select
                        value={payrollFilterRole}
                        onChange={(e) => setPayrollFilterRole(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="all">All Staff Roles</option>
                        <option value={UserRole.SERVICE_TECHNICIAN}>Service Technicians</option>
                        <option value={UserRole.PARKING_ATTENDANT}>Parking Attendants</option>
                      </select>

                      <select
                        value={payrollFilterChannel}
                        onChange={(e) => setPayrollFilterChannel(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="all">All Payment Channels</option>
                        <option value="MTN Mobile Money">MTN Mobile Money</option>
                        <option value="Airtel Money">Airtel Money</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>

                      <select
                        value={payrollFilterStatus}
                        onChange={(e) => setPayrollFilterStatus(e.target.value as any)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  {/* Compact Redesigned Staff Payment Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payrollList
                      .filter((rec) => {
                        const q = payrollSearchQuery.toLowerCase();
                        const matchesSearch =
                          rec.employeeName.toLowerCase().includes(q) ||
                          rec.phone.includes(q) ||
                          rec.completedServices.some((s) => s.serviceType.toLowerCase().includes(q));
                        const matchesRole = payrollFilterRole === 'all' || rec.role === payrollFilterRole;
                        const matchesChannel = payrollFilterChannel === 'all' || rec.paymentChannel === payrollFilterChannel;
                        const matchesStatus = payrollFilterStatus === 'all' || rec.status === payrollFilterStatus;
                        return matchesSearch && matchesRole && matchesChannel && matchesStatus;
                      })
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                        >
                          {/* Card Top Header */}
                          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-200">
                                {rec.employeeName.split(' ').map((n) => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                                  {rec.employeeName}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                    {rec.role}
                                  </span>
                                  <span className="text-[10px] text-amber-600 font-mono font-bold">
                                    ⭐ {rec.performanceRating}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                rec.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {rec.status === 'Paid' ? 'Paid ✓' : 'Pending'}
                            </span>
                          </div>

                          {/* Contact & Registered Phone / Payment Channel */}
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600 text-[11px]">
                              <span className="flex items-center gap-1 font-medium text-slate-500">
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                Phone:
                              </span>
                              <span className="font-mono font-bold text-slate-900">{rec.phone}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center gap-1 font-medium text-slate-500">
                                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                                Channel:
                              </span>
                              <span
                                className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                  rec.paymentChannel === 'MTN Mobile Money'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : rec.paymentChannel === 'Airtel Money'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                                }`}
                              >
                                {rec.paymentChannel}
                              </span>
                            </div>
                          </div>

                          {/* Completed Services Rendered List */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
                              <span>Completed Services</span>
                              <span>{rec.completedServices.length} Jobs</span>
                            </div>
                            <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-100 max-h-28 overflow-y-auto">
                              {rec.completedServices.map((srv, idx) => (
                                <div key={idx} className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0">
                                  <span className="text-slate-700 font-medium truncate max-w-[150px]" title={srv.serviceType}>
                                    • {srv.serviceType}
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 shrink-0">
                                    UGX {srv.cost.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Total Service Amount Callout Box */}
                          <div className="bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Payment</span>
                              <span className="text-[10px] text-emerald-600 font-medium">Sum of completed services</span>
                            </div>
                            <span className="text-sm font-black font-mono text-emerald-950">
                              UGX {rec.totalServiceAmount.toLocaleString()}
                            </span>
                          </div>

                          {/* Card Action Footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                            {rec.status === 'Pending' ? (
                              <button
                                onClick={() => handlePayStaffMember(rec.id)}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Pay via MoMo ({rec.phone})</span>
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg truncate">
                                  Paid ✓ {rec.paymentRef}
                                </span>
                                <button
                                  onClick={() => setSelectedPayslip(rec)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <FileText className="w-3 h-3" /> Voucher
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* Archive Payroll View */
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Processed Service Payments Archive</h3>
                    <p className="text-xs text-slate-500">Historical service payout logs and direct mobile money disburals</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { period: 'June 2026', total: 4850000, staffCount: 5, date: '2026-06-30', ref: 'MOMO-BATCH-2026-06' },
                      { period: 'May 2026', total: 4420000, staffCount: 5, date: '2026-05-31', ref: 'MOMO-BATCH-2026-05' },
                      { period: 'April 2026', total: 4100000, staffCount: 4, date: '2026-04-30', ref: 'MOMO-BATCH-2026-04' },
                    ].map((hist, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 block">{hist.period}</span>
                            <span className="text-[10px] font-mono text-slate-500">{hist.ref}</span>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                            Completed ✓
                          </span>
                        </div>

                        <div className="text-xs space-y-1 font-mono">
                          <div className="flex justify-between text-slate-600">
                            <span>Total Disbursed:</span>
                            <span className="font-bold text-slate-900">UGX {hist.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Staff Members Paid:</span>
                            <span className="text-slate-900">{hist.staffCount} Staff</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Execution Date:</span>
                            <span className="text-slate-900">{hist.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SERVICE PAYMENT ADVICE / VOUCHER MODAL */}
          {selectedPayslip && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-100 animate-scaleUp max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black">
                      UG
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                        UG Park Mobility & Services
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500">Service Performance Payment Voucher</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Voucher Details */}
                <div className="space-y-4 text-xs font-mono">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Staff Name:</span>
                      <span className="font-bold text-slate-900">{selectedPayslip.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Staff Role:</span>
                      <span className="text-slate-900 font-bold">{selectedPayslip.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registered Phone:</span>
                      <span className="text-slate-900 font-bold">{selectedPayslip.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payout Channel:</span>
                      <span className="text-emerald-700 font-bold">{selectedPayslip.paymentChannel}</span>
                    </div>
                  </div>

                  {/* Completed Services Table */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Completed Services Breakdown</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-2">Completed Service</th>
                            <th className="p-2 text-right">Service Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedPayslip.completedServices.map((srv, idx) => (
                            <tr key={idx}>
                              <td className="p-2 text-slate-700 font-medium">{srv.serviceType}</td>
                              <td className="p-2 text-right font-bold text-slate-900 font-mono">
                                UGX {srv.cost.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Total Payment Callout */}
                  <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">Total Payout Disbursed</span>
                      <span className="text-[10px] text-emerald-600">Sum of completed services</span>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-950">
                      UGX {selectedPayslip.totalServiceAmount.toLocaleString()}
                    </span>
                  </div>

                  {selectedPayslip.paymentRef && (
                    <div className="text-center text-[10px] text-slate-500 font-mono">
                      Transaction Ref: <span className="font-bold text-slate-900">{selectedPayslip.paymentRef}</span> • Paid on {selectedPayslip.paidAt}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      alert(`Payment voucher for ${selectedPayslip.employeeName} downloaded.`);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Export Voucher
                  </button>
                  <button
                    onClick={() => setSelectedPayslip(null)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CREATE JOB CARD MODAL */}
          {showNewJobModal && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-100 animate-scaleUp">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-sky-600" />
                    <h3 className="font-extrabold text-base text-slate-900">Create New Job Card</h3>
                  </div>
                  <button
                    onClick={() => setShowNewJobModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateJobCard} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Select Vehicle</label>
                    <select
                      value={newJobVehicleId}
                      onChange={(e) => setNewJobVehicleId(e.target.value)}
                      required
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} - {v.make} {v.model} ({v.color})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Service Type</label>
                    <select
                      value={newJobServiceType}
                      onChange={(e) => setNewJobServiceType(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Full Engine & Oil Service">Full Engine & Oil Service</option>
                      <option value="Brake System Overhaul">Brake System Overhaul</option>
                      <option value="Wheel Alignment & Balancing">Wheel Alignment & Balancing</option>
                      <option value="AC System Recharge & Repair">AC System Recharge & Repair</option>
                      <option value="Transmission Fluid Flush">Transmission Fluid Flush</option>
                      <option value="Executive Car Wash & Detailing">Executive Car Wash & Detailing</option>
                      <option value="General Mechanical Inspection">General Mechanical Inspection</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Assign Mechanic (Optional)</label>
                    <select
                      value={newJobTechId}
                      onChange={(e) => setNewJobTechId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">-- Unassigned (Assign Later) --</option>
                      {users
                        .filter((u) => u.role === UserRole.SERVICE_TECHNICIAN)
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            👨‍🔧 {tech.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Estimated Cost (UGX)</label>
                    <input
                      type="number"
                      value={newJobCost}
                      onChange={(e) => setNewJobCost(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Diagnostic / Customer Notes</label>
                    <textarea
                      value={newJobNotes}
                      onChange={(e) => setNewJobNotes(e.target.value)}
                      placeholder="e.g. Engine noise when accelerating above 60km/h..."
                      rows={3}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewJobModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer transition active:scale-95"
                    >
                      Create Job Card
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
            </div>
          )}
          </div>
        </div>
      </div>
    )}

      {/* ==============================================================
          ROLE: SYSTEM ADMINISTRATOR VIEW
          ============================================================== */}
      {false && (() => {
        // Dynamically compile and sort all events/activities in the system chronologically
        const aggregatedActivities = (() => {
          interface SystemActivity {
            id: string;
            category: 'parking' | 'service' | 'payment';
            title: string;
            description: string;
            timestamp: string;
            status: string;
            user?: string;
            badgeColor: string;
          }

          const list: SystemActivity[] = [];

          // Add reservation events
          reservations.forEach((res) => {
            const veh = vehicles.find((v) => v.id === res.vehicleId);
            const userObj = users.find((u) => u.id === res.userId);
            const vehStr = veh ? `${veh.make} ${veh.model} (${veh.registrationNumber})` : 'Unknown Vehicle';
            const custStr = userObj ? userObj.name : 'Unknown Customer';

            // Original Reservation
            list.push({
              id: `act-res-book-${res.id}`,
              category: 'parking',
              title: 'Parking Spot Reserved',
              description: `Customer ${custStr} reserved parking spot ${res.parkingId} for vehicle ${vehStr}.`,
              timestamp: res.startTime,
              status: res.status,
              user: custStr,
              badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            });

            // Check-in
            if (res.checkedInAt) {
              list.push({
                id: `act-res-in-${res.id}`,
                category: 'parking',
                title: 'Parking Check-In Verified',
                description: `Vehicle ${vehStr} checked in to spot ${res.parkingId} by Attendant.`,
                timestamp: res.checkedInAt,
                status: 'Checked In',
                user: custStr,
                badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              });
            }

            // Check-out
            if (res.checkedOutAt) {
              list.push({
                id: `act-res-out-${res.id}`,
                category: 'parking',
                title: 'Parking Check-Out Verified',
                description: `Vehicle ${vehStr} checked out of spot ${res.parkingId} and released spot.`,
                timestamp: res.checkedOutAt,
                status: 'Checked Out',
                user: custStr,
                badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
              });
            }
          });

          // Add service events
          services.forEach((srv) => {
            const veh = vehicles.find((v) => v.id === srv.vehicleId);
            const cust = users.find((u) => u.id === srv.customerId);
            const tech = users.find((u) => u.id === srv.technicianId);
            const vehStr = veh ? `${veh.make} ${veh.model} (${veh.registrationNumber})` : 'Unknown Vehicle';
            const custStr = cust ? cust.name : 'Unknown Customer';
            const techStr = tech ? tech.name : 'Unassigned';

            // Service Booking
            list.push({
              id: `act-srv-book-${srv.id}`,
              category: 'service',
              title: 'Vehicle Service Scheduled',
              description: `Customer ${custStr} scheduled ${srv.serviceType} for ${vehStr}. Assigned Mechanic: ${techStr}.`,
              timestamp: srv.bookingDate,
              status: srv.status,
              user: custStr,
              badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
            });

            // Service Completion
            if (srv.completionDate) {
              list.push({
                id: `act-srv-comp-${srv.id}`,
                category: 'service',
                title: 'Repair Work Completed',
                description: `Work order successfully finalized for ${vehStr}. Service invoice total: UGX ${srv.cost.toLocaleString()}.`,
                timestamp: srv.completionDate,
                status: 'Completed',
                user: custStr,
                badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              });
            }
          });

          // Add payment events
          payments.forEach((pay) => {
            const cust = users.find((u) => u.id === pay.userId);
            const custStr = cust ? cust.name : 'Unknown Customer';

            list.push({
              id: `act-pay-${pay.id}`,
              category: 'payment',
              title: `Payment Cleared (${pay.paymentMethod})`,
              description: `Completed payment of UGX ${pay.amount.toLocaleString()} for account. Reference: ${pay.transactionId}`,
              timestamp: pay.date,
              status: pay.status,
              user: custStr,
              badgeColor: pay.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
            });
          });

          // Sort chronologically
          return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        })();

        // Filtering logic based on search queries
        const filteredActivities = aggregatedActivities.filter((act) => {
          if (!adminSearchQuery) return true;
          const query = adminSearchQuery.toLowerCase();
          return (
            act.title.toLowerCase().includes(query) ||
            act.description.toLowerCase().includes(query) ||
            (act.user && act.user.toLowerCase().includes(query)) ||
            act.status.toLowerCase().includes(query)
          );
        });

        const filteredServices = services.filter((srv) => {
          const veh = vehicles.find((v) => v.id === srv.vehicleId);
          const cust = users.find((u) => u.id === srv.customerId);
          const tech = users.find((u) => u.id === srv.technicianId);
          const query = adminSearchQuery.toLowerCase();
          return (
            srv.serviceType.toLowerCase().includes(query) ||
            srv.status.toLowerCase().includes(query) ||
            srv.id.toLowerCase().includes(query) ||
            (veh && (veh.registrationNumber.toLowerCase().includes(query) || veh.make.toLowerCase().includes(query) || veh.model.toLowerCase().includes(query))) ||
            (cust && (cust.name.toLowerCase().includes(query) || cust.email.toLowerCase().includes(query))) ||
            (tech && tech.name.toLowerCase().includes(query))
          );
        });

        const filteredReservations = reservations.filter((res) => {
          const veh = vehicles.find((v) => v.id === res.vehicleId);
          const cust = users.find((u) => u.id === res.userId);
          const query = adminSearchQuery.toLowerCase();
          return (
            res.id.toLowerCase().includes(query) ||
            res.parkingId.toLowerCase().includes(query) ||
            res.status.toLowerCase().includes(query) ||
            (veh && (veh.registrationNumber.toLowerCase().includes(query) || veh.make.toLowerCase().includes(query))) ||
            (cust && cust.name.toLowerCase().includes(query))
          );
        });

        const filteredPayments = payments.filter((pay) => {
          const cust = users.find((u) => u.id === pay.userId);
          const query = adminSearchQuery.toLowerCase();
          return (
            pay.id.toLowerCase().includes(query) ||
            pay.transactionId.toLowerCase().includes(query) ||
            pay.paymentMethod.toLowerCase().includes(query) ||
            pay.status.toLowerCase().includes(query) ||
            (cust && cust.name.toLowerCase().includes(query))
          );
        });

        const filteredUsers = users.filter((u) => {
          const query = adminSearchQuery.toLowerCase();
          return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.phone.includes(query) || u.role.toLowerCase().includes(query);
        });

        const filteredVehicles = vehicles.filter((v) => {
          const cust = users.find((u) => u.id === v.userId);
          const query = adminSearchQuery.toLowerCase();
          return (
            v.registrationNumber.toLowerCase().includes(query) ||
            v.make.toLowerCase().includes(query) ||
            v.model.toLowerCase().includes(query) ||
            v.color.toLowerCase().includes(query) ||
            (cust && cust.name.toLowerCase().includes(query))
          );
        });

        const filteredInventory = inventory.filter((item) => {
          const query = adminSearchQuery.toLowerCase();
          return item.partName.toLowerCase().includes(query);
        });

        const handleAdminCancelBooking = async (resId: string) => {
          if (!window.confirm('Are you sure you want to cancel this booking? This will restore parking availability.')) return;
          try {
            const res = await fetch(`/api/parking/reservations/${resId}/cancel`, {
              method: 'POST',
            });
            if (res.ok) {
              onRefreshAll();
            }
          } catch (err) {
            console.error(err);
          }
        };

        const totalCompletedRevenue = payments
          .filter((p) => p.status === 'Success')
          .reduce((sum, p) => sum + p.amount, 0);

        return (
          <div className="space-y-4">
            {/* Dashboard Statistics Summary Panel */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-[18px] shadow-xs p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-0 md:divide-x divide-slate-800">
                
                {/* Metric 1 */}
                <div className="p-2.5 sm:p-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      SYSTEM OCCUPANCY
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight leading-none mt-0.5 block">
                      {parkingSpaces.filter((s) => s.status === ParkingSpaceStatus.OCCUPIED).length} / {parkingSpaces.length}
                    </span>
                    <span className="text-3xs text-emerald-400 font-medium block mt-1">
                      Active Slots in Garage A
                    </span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-2.5 sm:p-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      TOTAL REVENUE
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight leading-none mt-0.5 block">
                      UGX {totalCompletedRevenue.toLocaleString()}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium block mt-1">
                      Dynamic Financial Ledger
                    </span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-2.5 sm:p-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-amber-400 block">
                      PENDING JOBS
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight leading-none mt-0.5 block">
                      {services.filter((s) => s.status !== ServiceStatus.COMPLETED).length}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium block mt-1">
                      Routine & Repair Phases
                    </span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-2.5 sm:p-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-rose-400 block">
                      WAREHOUSE ALERTS
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono tracking-tight leading-none mt-0.5 block">
                      {inventory.filter((i) => i.quantity < i.minRequired).length}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium block mt-1">
                      Below Safety Threshold
                    </span>
                  </div>
                </div>

                {/* Metric 5 */}
                <div className="p-2.5 sm:p-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono font-bold uppercase tracking-wider text-purple-400 block">
                      ACTIVE FLEET
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono tracking-tight leading-none mt-0.5 block">
                      {vehicles.length}
                    </span>
                    <span className="text-3xs text-slate-400 font-medium block mt-1">
                      Registered Vehicles
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Navigation Tabs & Search Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-[18px] p-2.5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
                <button
                  onClick={() => { setAdminActiveTab('activities'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'activities'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  System Activities ({aggregatedActivities.length})
                </button>

                <button
                  onClick={() => { setAdminActiveTab('services'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'services'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Workshop Services ({services.length})
                </button>

                <button
                  onClick={() => { setAdminActiveTab('parking'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'parking'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Parking Bookings ({reservations.length})
                </button>

                <button
                  onClick={() => { setAdminActiveTab('payments'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'payments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Financial Ledger ({payments.length})
                </button>

                <button
                  onClick={() => { setAdminActiveTab('vehicles'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'vehicles'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  Users & Fleet ({vehicles.length})
                </button>

                <button
                  onClick={() => { setAdminActiveTab('inventory'); setAdminSearchQuery(''); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    adminActiveTab === 'inventory'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  Parts Inventory ({inventory.length})
                </button>
              </div>

              {/* Glassmorphic Search Area */}
              <div className="relative w-full lg:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  placeholder={`Search in ${adminActiveTab}...`}
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Workflow & Data Content Panel */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-[18px] p-5 sm:p-6 shadow-xl text-slate-100 space-y-4">

              {/* Dynamic Tab Body Render */}

              {/* 1. Activities Tab */}
              {adminActiveTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Live Audited System Operations Activity Log
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono border border-slate-700">
                      Showing {filteredActivities.length} logs
                    </span>
                  </div>

                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                      No matching activities logged in the current search context.
                    </div>
                  ) : (
                    <div className="flow-root max-h-[480px] overflow-y-auto pr-2 space-y-3">
                      <ul className="-mb-8">
                        {filteredActivities.map((act, actIdx) => {
                          const isLast = actIdx === filteredActivities.length - 1;
                          return (
                            <li key={act.id}>
                              <div className="relative pb-5">
                                {!isLast ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center ring-8 ring-slate-900">
                                      {act.category === 'parking' && <Calendar className="w-4 h-4 text-indigo-400" />}
                                      {act.category === 'service' && <Wrench className="w-4 h-4 text-amber-400" />}
                                      {act.category === 'payment' && <CreditCard className="w-4 h-4 text-emerald-400" />}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-xs font-semibold text-white">
                                          {act.title}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <span className={`px-2 py-0.5 font-bold font-mono text-[9px] border rounded ${act.badgeColor}`}>
                                          {act.status.toUpperCase()}
                                        </span>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                                          {new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Services Tab */}
              {adminActiveTab === 'services' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      All Registered Vehicle Services Ledger
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono border border-slate-700">
                      {filteredServices.length} active/past records
                    </span>
                  </div>

                  {filteredServices.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No vehicle services match your search query.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300 border-collapse">
                        <thead className="text-3xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">ID</th>
                            <th className="px-3 py-2">Vehicle details</th>
                            <th className="px-3 py-2">Customer owner</th>
                            <th className="px-3 py-2">Service task</th>
                            <th className="px-3 py-2">Technician assigned</th>
                            <th className="px-3 py-2">Job stage</th>
                            <th className="px-3 py-2 font-mono">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredServices.map((srv) => {
                            const veh = vehicles.find((v) => v.id === srv.vehicleId);
                            const cust = users.find((u) => u.id === srv.customerId);
                            const tech = users.find((u) => u.id === srv.technicianId);

                            return (
                              <tr key={srv.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-3 font-mono font-bold text-white">{srv.id.toUpperCase()}</td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold text-slate-100">{veh?.make} {veh?.model}</div>
                                  <div className="font-mono text-3xs text-slate-400">{veh?.registrationNumber}</div>
                                </td>
                                <td className="px-3 py-3 text-slate-300">
                                  <div className="font-medium">{cust?.name || 'Unknown'}</div>
                                  <div className="text-4xs font-mono text-slate-400">{cust?.phone}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <span className="font-medium text-slate-200">{srv.serviceType}</span>
                                </td>
                                <td className="px-3 py-3">
                                  {tech ? (
                                    <span className="font-semibold text-sky-400">{tech.name}</span>
                                  ) : (
                                    <span className="text-amber-400 font-semibold italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 font-bold font-mono text-3xs border rounded ${
                                    srv.status === ServiceStatus.COMPLETED
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}>
                                    {srv.status.toUpperCase()}
                                  </span>
                                  <div className="text-4xs text-slate-400 mt-1 max-w-[200px] truncate" title={srv.diagnosticNotes}>
                                    {srv.diagnosticNotes}
                                  </div>
                                </td>
                                <td className="px-3 py-3 font-mono font-bold text-white">
                                  UGX {srv.cost.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Parking Tab */}
              {adminActiveTab === 'parking' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      Parking Reservations Audit Register
                    </h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono border border-slate-700">
                      {filteredReservations.length} records
                    </span>
                  </div>

                  {filteredReservations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No parking reservations match your search query.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300 border-collapse">
                        <thead className="text-3xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">Reservation ID</th>
                            <th className="px-3 py-2">Spot</th>
                            <th className="px-3 py-2">Vehicle Details</th>
                            <th className="px-3 py-2">Customer owner</th>
                            <th className="px-3 py-2">Booking schedule</th>
                            <th className="px-3 py-2">Check In/Out details</th>
                            <th className="px-3 py-2">Billing Amount</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReservations.map((res) => {
                            const veh = vehicles.find((v) => v.id === res.vehicleId);
                            const cust = users.find((u) => u.id === res.userId);

                            return (
                              <tr key={res.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-3">
                                  <div className="font-mono font-bold text-white">{res.id.toUpperCase()}</div>
                                  <div className="text-4xs text-slate-400 font-mono select-all truncate w-24">{res.qrCode}</div>
                                </td>
                                <td className="px-3 py-3 font-mono font-bold text-indigo-400">
                                  {res.parkingId.toUpperCase()}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold text-slate-100">{veh?.make} {veh?.model}</div>
                                  <div className="font-mono text-3xs text-slate-400">{veh?.registrationNumber}</div>
                                </td>
                                <td className="px-3 py-3 text-slate-300 font-medium">
                                  {cust?.name || 'Unknown'}
                                </td>
                                <td className="px-3 py-3 font-mono text-3xs text-slate-300">
                                  <div>In: {new Date(res.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  <div>Out: {new Date(res.endTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="px-3 py-3 font-mono text-3xs">
                                  {res.checkedInAt ? (
                                    <div className="text-emerald-400 font-semibold">✓ Checked In: {new Date(res.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  ) : (
                                    <div className="text-slate-500">Not checked in</div>
                                  )}
                                  {res.checkedOutAt ? (
                                    <div className="text-slate-400">✓ Checked Out: {new Date(res.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                  ) : (
                                    res.checkedInAt && <div className="text-indigo-400 font-bold animate-pulse">● Currently Parked</div>
                                  )}
                                </td>
                                <td className="px-3 py-3 font-mono font-semibold text-slate-100">
                                  UGX {res.amount.toLocaleString()}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {res.status === ReservationStatus.PENDING ? (
                                    <button
                                      onClick={() => handleAdminCancelBooking(res.id)}
                                      className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-[10px] font-bold rounded cursor-pointer transition"
                                    >
                                      Cancel Booking
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-bold font-mono uppercase text-slate-500">{res.status}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Payments Tab */}
              {adminActiveTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Financial Revenue Audit Ledger
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        Grand total: UGX {totalCompletedRevenue.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full font-mono border border-slate-700">
                        {filteredPayments.length} transactions
                      </span>
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No payments match your search query.</p>
                  ) : (
                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300 border-collapse">
                        <thead className="text-3xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">Invoice/Payment ID</th>
                            <th className="px-3 py-2">Transaction ID</th>
                            <th className="px-3 py-2">Customer owner</th>
                            <th className="px-3 py-2">Channel</th>
                            <th className="px-3 py-2">Transaction date</th>
                            <th className="px-3 py-2">Amount Paid</th>
                            <th className="px-3 py-2 text-right">Settlement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayments.map((pay) => {
                            const cust = users.find((u) => u.id === pay.userId);

                            return (
                              <tr key={pay.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-3 font-mono font-bold text-white">{pay.id.toUpperCase()}</td>
                                <td className="px-3 py-3 font-mono font-semibold text-slate-400">{pay.transactionId}</td>
                                <td className="px-3 py-3 font-medium text-slate-200">{cust?.name || 'Unknown customer'}</td>
                                <td className="px-3 py-3">
                                  <span className="px-2 py-0.5 font-bold font-mono text-3xs bg-slate-800 text-slate-200 border border-slate-700 rounded">
                                    {pay.paymentMethod}
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-mono text-3xs text-slate-400">
                                  {new Date(pay.date).toLocaleDateString()} at {new Date(pay.date).toLocaleTimeString()}
                                </td>
                                <td className="px-3 py-3 font-mono font-bold text-white">UGX {pay.amount.toLocaleString()}</td>
                                <td className="px-3 py-3 text-right">
                                  <span className={`px-2 py-0.5 rounded font-mono text-3xs font-bold border ${
                                    pay.status === 'Success'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  }`}>
                                    {pay.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Users & Vehicles Fleet Tab */}
              {adminActiveTab === 'vehicles' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Users Registry */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        Staff & Registered Customers Index
                      </h3>
                      <span className="text-4xs font-mono font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded">
                        {filteredUsers.length} users
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300 border-collapse">
                        <thead className="text-3xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Role assigned</th>
                            <th className="px-3 py-2">Verification Status</th>
                            <th className="px-3 py-2">Contacts</th>
                            <th className="px-3 py-2 text-right">Manager Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => {
                            const isVerified = u.isVerified !== false;
                            return (
                              <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-3">
                                  <div className="font-bold text-white">{u.name}</div>
                                  <div className="text-4xs font-mono text-slate-500">{u.id}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`px-2 py-0.5 rounded font-mono text-3xs font-bold border ${
                                    u.role === UserRole.SERVICE_MANAGER ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                                    u.role === UserRole.SERVICE_TECHNICIAN ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                    u.role === UserRole.PARKING_ATTENDANT ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                    'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}>
                                    {u.role.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-mono text-3xs">
                                  {isVerified ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                                      <Mail className="w-3 h-3 animate-pulse" />
                                      Pending Verification
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 font-mono text-3xs text-slate-400">
                                  <div>{u.email}</div>
                                  <div>{u.phone}</div>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {!isVerified ? (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(`/api/users/${u.id}/verify`, { method: 'PUT' });
                                          if (res.ok) {
                                            if (onRefreshAll) onRefreshAll();
                                          }
                                        } catch {}
                                      }}
                                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-3xs rounded-lg transition cursor-pointer inline-flex items-center gap-1 shadow-sm"
                                      title="Systems Manager verify account"
                                    >
                                      <ShieldCheck className="w-3 h-3" />
                                      Verify Account
                                    </button>
                                  ) : (
                                    <span className="text-3xs text-slate-500 font-mono">Account Verified</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Registered Vehicles */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-indigo-400" />
                        Registered Customer Vehicle Fleet
                      </h3>
                      <span className="text-4xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {filteredVehicles.length} vehicles
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300 border-collapse">
                        <thead className="text-3xs text-slate-400 uppercase bg-slate-950 border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">Plate / VIN</th>
                            <th className="px-3 py-2">Manufacturer specs</th>
                            <th className="px-3 py-2">Mileage</th>
                            <th className="px-3 py-2 text-right">Owner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredVehicles.map((v) => {
                            const owner = users.find((u) => u.id === v.userId);
                            return (
                              <tr key={v.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-3 font-mono font-bold text-white">
                                  {v.registrationNumber}
                                  <div className="text-4xs text-slate-500 font-mono tracking-tight">{v.vin || 'N/A'}</div>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="font-semibold text-slate-200">{v.make} {v.model}</div>
                                  <div className="text-3xs text-slate-400">{v.year} • {v.color}</div>
                                </td>
                                <td className="px-3 py-3 font-mono text-slate-300">
                                  {v.mileage.toLocaleString()} km
                                </td>
                                <td className="px-3 py-3 text-right font-medium text-slate-200">
                                  {owner?.name || 'Walk-in'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Inventory Tab */}
              {adminActiveTab === 'inventory' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Spare Parts List */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Spare Parts Stock & Threshold alerts</h3>
                      <span className="text-4xs font-mono font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded">
                        {filteredInventory.filter((i) => i.quantity < i.minRequired).length} below safe thresholds
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-3xs border-b border-slate-800 font-mono">
                          <tr>
                            <th className="px-3 py-2">Part Name</th>
                            <th className="px-3 py-2">Stock Level</th>
                            <th className="px-3 py-2">Min Required</th>
                            <th className="px-3 py-2">Unit Price</th>
                            <th className="px-3 py-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((item) => {
                            const isLow = item.quantity < item.minRequired;
                            return (
                              <tr key={item.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition">
                                <td className="px-3 py-2.5 font-medium text-slate-200">{item.partName}</td>
                                <td className="px-3 py-2.5 font-bold font-mono text-white">{item.quantity} units</td>
                                <td className="px-3 py-2.5 font-mono text-slate-400">{item.minRequired}</td>
                                <td className="px-3 py-2.5 font-mono text-slate-300">UGX {item.price.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-right">
                                  {isLow ? (
                                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-4xs font-bold uppercase rounded flex items-center justify-end gap-1 w-max ml-auto border border-rose-500/30">
                                      <AlertTriangle className="w-2.5 h-2.5" /> REORDER REQUIRED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-4xs font-bold uppercase rounded w-max ml-auto block border border-emerald-500/30 text-center">
                                      STABLE
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Restock Warehouse Controls */}
                  <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 self-start">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Package className="w-4 h-4 text-indigo-400" />
                        Restock Warehouse
                      </h3>
                      <p className="text-3xs text-slate-400 mt-1">Replenish part levels immediately following safety threshold alarms</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-4xs font-bold text-slate-400 uppercase mb-1">Select Part</label>
                        <select
                          value={restockItem}
                          onChange={(e) => setRestockItem(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-800 rounded bg-slate-900 text-slate-200 font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Select stock target --</option>
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.partName} (Current: {item.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-4xs font-bold text-slate-400 uppercase mb-1">Stock Amount to Add</label>
                        <input
                          type="number"
                          min={5}
                          value={restockQty}
                          onChange={(e) => setRestockQty(parseInt(e.target.value) || 10)}
                          className="w-full text-xs p-2 border border-slate-800 rounded bg-slate-900 text-slate-200 font-medium focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        onClick={handleRestock}
                        disabled={!restockItem}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        Confirm Restock Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ==============================================================
          TECHNICIAN MULTI-ROLE HANDOFF MODAL
          ============================================================== */}
      {showHandoffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Complete Service & Hand Off Vehicle</h3>
                  <p className="text-3xs text-emerald-200/90">Notify Parking Attendant, Manager & Customer simultaneously</p>
                </div>
              </div>
              <button
                onClick={() => setShowHandoffModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmHandoff} className="p-5 space-y-4">
              
              {handoffSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{handoffSuccessMsg}</span>
                </div>
              )}

              {/* Designated Delivery Bay / Slot */}
              <div className="space-y-1">
                <label className="block text-2xs font-extrabold text-slate-700 uppercase font-mono">
                  Designated Yard Pickup Bay / Slot
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={assignedDeliveryBay}
                    onChange={(e) => setAssignedDeliveryBay(e.target.value)}
                    placeholder="e.g. Floor G, Slot A12 (Ready Pickup Bay)"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <p className="text-4xs text-slate-500">
                  Parking Attendant will be directed to this exact bay to verify vehicle placement.
                </p>
              </div>

              {/* Completion Notes */}
              <div className="space-y-1">
                <label className="block text-2xs font-extrabold text-slate-700 uppercase font-mono">
                  Technician Diagnostic & Work Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  placeholder="Detail work performed, oil type used, brake checks completed..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Multi-Role Notification Checkboxes */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-3xs font-extrabold font-mono uppercase text-slate-500 block border-b border-slate-200 pb-1">
                  Multi-Role Notification Handshake
                </span>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyAttendant}
                    onChange={(e) => setNotifyAttendant(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>🅿️ Alert Parking Attendant (for slot verification & gate clearance)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyManager}
                    onChange={(e) => setNotifyManager(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>👨‍💼 Alert Service Manager (for job card sign-off & billing)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>👤 Alert Vehicle Owner / Customer (pickup notification)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHandoffModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingHandoff}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmittingHandoff ? 'Processing Handoff...' : 'Confirm Completion & Send Alerts'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          REGISTER NEW STAFF MEMBER MODAL (Service Manager)
          ============================================================== */}
      {showRegisterStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl font-bold">
                  <UserPlus className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Register Staff Member</h3>
                  <p className="text-3xs text-slate-500 font-mono">Service Manager Portal • Personnel Onboarding</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterStaffModal(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {staffRegSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{staffRegSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1 font-mono">Select Staff Role</label>
                <select
                  value={staffRegRole}
                  onChange={(e) => setStaffRegRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-medium"
                >
                  <option value={UserRole.SERVICE_TECHNICIAN}>👨‍🔧 Service Technician / Workshop Mechanic</option>
                  <option value={UserRole.PARKING_ATTENDANT}>🅿️ Parking Yard Attendant</option>
                  <option value={UserRole.SERVICE_MANAGER}>👨‍💼 Service Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1 font-mono">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffRegName}
                  onChange={(e) => setStaffRegName(e.target.value)}
                  placeholder="e.g. Samuel Mukasa"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1 font-mono">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={staffRegEmail}
                  onChange={(e) => setStaffRegEmail(e.target.value)}
                  placeholder="e.g. samuel.m@ugpark.co.ug"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase mb-1 font-mono">Phone Number</label>
                <input
                  type="tel"
                  value={staffRegPhone}
                  onChange={(e) => setStaffRegPhone(e.target.value)}
                  placeholder="e.g. +256 772 123456"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterStaffModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaffReg}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                >
                  {isSubmittingStaffReg ? 'Registering...' : 'Complete Staff Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
