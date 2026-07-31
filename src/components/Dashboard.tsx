import React, { useState, useEffect } from 'react';
import { UserRole, User, Vehicle, ParkingSpace, ParkingReservation, VehicleService, InventoryItem, Payment } from '../types';
import { CustomerPortal } from './CustomerPortal';
import { StaffPortal } from './StaffPortal';
import { AttendantDashboard } from './AttendantDashboard';
import luxuryCarBg from '../assets/images/luxury_car_bg_1784885753477.jpg';
import { 
  Sparkles, 
  Home, 
  Globe, 
  Bot, 
  Workflow, 
  FolderKanban, 
  Package, 
  Settings, 
  ChevronDown, 
  Search, 
  Plus, 
  Folder, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Wrench, 
  ShieldCheck, 
  Maximize2, 
  Bell, 
  RefreshCw, 
  LogIn, 
  LogOut,
  UserCheck, 
  Car, 
  CreditCard,
  Building2,
  Clock,
  Layers,
  Activity,
  Lock,
  ShieldAlert,
  Users,
  Menu,
  X,
  BarChart3,
  DollarSign,
  TrendingUp,
  PieChart,
  User as UserIcon,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react';

interface DashboardProps {
  currentUser: User | null;
  users: User[];
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenLogin: () => void;
  onSignOut: () => void;
  vehicles: Vehicle[];
  parkingSpaces: ParkingSpace[];
  reservations: ParkingReservation[];
  services: VehicleService[];
  inventory: InventoryItem[];
  payments: Payment[];
  onRefreshAll: () => void;
  notifications: any[];
  onClearNotifications: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  users,
  currentRole,
  onRoleChange,
  onOpenLogin,
  onSignOut,
  vehicles,
  parkingSpaces,
  reservations,
  services,
  inventory,
  payments,
  onRefreshAll,
  notifications,
  onClearNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'permissions' | 'executions'>('workflows');
  const [activeNav, setActiveNav] = useState<'home' | 'workflows' | 'permissions' | 'activities' | 'reports' | 'revenue' | 'settings'>('home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab, activeNav]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'notifications' | 'help' | 'settings' | null>(null);

  // Staff Authorization Management State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('+256 ');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>(UserRole.PARKING_ATTENDANT);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffNotice, setStaffNotice] = useState<string | null>(null);

  const handleAuthorizeUser = async (userId: string, targetRole: UserRole, isAuthorized: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}/authorize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          isAuthorizedStaff: isAuthorized,
          authorizationStatus: isAuthorized ? 'Authorized' : (targetRole === UserRole.CUSTOMER ? 'Customer' : 'Pending Approval'),
        }),
      });
      if (res.ok) {
        setStaffNotice(`Updated user access permissions successfully.`);
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error updating user authorization:', err);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    setIsSubmittingStaff(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          phone: newStaffPhone,
          role: newStaffRole,
        }),
      });
      if (res.ok) {
        setStaffNotice(`Authorized new employee ${newStaffName} as ${newStaffRole}.`);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPhone('+256 ');
        setShowAddStaffModal(false);
        onRefreshAll();
      }
    } catch (err) {
      console.error('Error adding staff member:', err);
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // Calculate live metric totals
  const totalExecutions = reservations.length + services.length + payments.length;
  const availableSpaces = parkingSpaces.filter(p => p.status === 'Available').length;
  const totalSpaces = parkingSpaces.length || 24;
  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  const roles = [
    { role: UserRole.CUSTOMER, label: 'Customer' },
    { role: UserRole.PARKING_ATTENDANT, label: 'Parking Attendant' },
    { role: UserRole.SERVICE_TECHNICIAN, label: 'Service Technician' },
    { role: UserRole.SERVICE_MANAGER, label: 'Service Manager' },
  ];

  if (currentRole === UserRole.PARKING_ATTENDANT) {
    return (
      <AttendantDashboard
        currentUser={currentUser}
        users={users}
        vehicles={vehicles}
        parkingSpaces={parkingSpaces}
        reservations={reservations}
        onRefreshAll={onRefreshAll}
        onSignOut={onSignOut}
      />
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed p-3 sm:p-5 md:p-6 font-sans text-slate-800 flex flex-col gap-3 sm:gap-4 select-none relative w-full"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.88)), url(${luxuryCarBg})`,
      }}
    >
      
      {/* ================= TOP HEADER BAR ================= */}
      <header className="w-full bg-slate-900/90 backdrop-blur-md rounded-[20px] px-3.5 sm:px-5 py-3 border border-slate-700/60 shadow-lg flex items-center justify-between gap-3 text-white z-20">
        <div className="flex items-center gap-3">
          {/* App Brand Title & Accent Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-purple-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-none flex items-center gap-1.5">
                WELILE CAR HUB
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">SMART MOBILITY</span>
              </h1>
              <p className="text-[10px] text-purple-300 font-mono font-semibold">Mobility Command Center</p>
            </div>
          </div>
        </div>

        {/* Top Header Right Actions (User Profile & Session Controls) */}
        <div className="flex items-center gap-2">
          {/* Refresh Telemetry */}
          <button
            onClick={onRefreshAll}
            title="Sync Telemetry Data"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/50 hidden sm:flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Sync</span>
          </button>

          {/* User Profile Chip / Role Switcher Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden xs:block sm:block">
                <span className="text-xs font-bold text-slate-100 block truncate max-w-[120px]">
                  {currentUser?.name || 'Authorized User'}
                </span>
                <span className="text-[9px] font-mono text-purple-300 block font-semibold">
                  {currentRole}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Account & Profile Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute top-full right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-slate-700 z-50 min-w-[240px] text-slate-100">
                {/* User Header Block */}
                <div className="px-3 py-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 mb-2">
                  <p className="text-xs font-black text-white truncate">{currentUser?.name || 'Authorized User'}</p>
                  <p className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5">{currentRole}</p>
                </div>

                <div className="border-t border-slate-800 my-1.5"></div>

                {/* Profile Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => { setShowRoleMenu(false); setActiveModal('profile'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => { setShowRoleMenu(false); setActiveModal('notifications'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-purple-400" />
                      <span>Notifications</span>
                    </div>
                    {notifications.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setShowRoleMenu(false); setActiveModal('help'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>Help & Support</span>
                  </button>

                  <button
                    onClick={() => { setShowRoleMenu(false); setActiveModal('settings'); }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 my-1.5"></div>

                {/* Sign Out */}
                <button
                  onClick={() => { setShowRoleMenu(false); onSignOut(); }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN DASHBOARD CONTENT WORKSPACE (FULL SCREEN WIDTH) ================= */}
      <main className="flex-1 bg-white/90 backdrop-blur-md rounded-[20px] md:rounded-[24px] p-3.5 md:p-5 border border-white shadow-xl flex flex-col min-h-[700px] overflow-hidden">
        
        {/* Mac-style titlebar dots + layout icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400/90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400/90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400/90 inline-block"></span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onRefreshAll}
              title="Refresh Telemetry"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              title="Maximize View"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>



        {/* Relevant Tabs Header - Hidden for Customer role */}
        {currentRole !== UserRole.CUSTOMER && (
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
              
              {/* Direct relevant tabs: Workflows, Permissions, Executions (Admin Only) */}
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('workflows')}
                  className={`text-sm font-bold pb-2 transition cursor-pointer relative ${
                    activeTab === 'workflows' 
                      ? 'text-slate-900 border-b-2 border-slate-900' 
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Portal Workflows
                </button>
              </div>

              {/* Workspace Filter Search */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter workflows..."
                  className="w-full bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
              </div>

            </div>
          </div>
        )}

        {/* Live Notification Bar if any */}
        {notifications.length > 0 && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 mb-6 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span className="font-semibold">{notifications[0].text}</span>
            </div>
            <button
              onClick={onClearNotifications}
              className="text-2xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Workspace Container */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'workflows' && (
            <div>
              {currentRole === UserRole.CUSTOMER ? (
                <CustomerPortal
                  userId={currentUser?.id || 'usr-1'}
                  currentUser={currentUser}
                  onRefreshAll={onRefreshAll}
                  vehicles={vehicles}
                  parkingSpaces={parkingSpaces}
                  reservations={reservations}
                  services={services}
                  payments={payments}
                />
              ) : (
                <StaffPortal
                  currentRole={currentRole}
                  currentUser={currentUser}
                  onRefreshAll={onRefreshAll}
                  users={users}
                  vehicles={vehicles}
                  parkingSpaces={parkingSpaces}
                  reservations={reservations}
                  services={services}
                  inventory={inventory}
                  payments={payments}
                  onSignOut={onSignOut}
                />
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    User Role Permissions & Access Control
                  </h3>
                  <p className="text-xs text-slate-500">Active account session privileges and user directory access in UG- Park Smart Mobility Portal.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onSignOut}
                    className="px-3.5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Session Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Active User Session</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-2xs font-bold rounded-md font-mono">
                      {currentRole}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold font-mono text-slate-900">{currentUser?.email || 'user@ugpark.co.ug'}</p>
                    <p className="text-2xs text-slate-400 font-mono">Phone: {currentUser?.phone || 'N/A'} • User ID: {currentUser?.id}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500 text-2xs">Session Status: <strong className="text-emerald-600">Active</strong></span>
                    <button
                      onClick={onSignOut}
                      className="text-2xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Role Mode Matrix Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Role Status</span>
                    <span className="text-4xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" /> Authenticated
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {roles.map((r) => {
                      const isAllowed = r.role === currentUser?.role;
                      return (
                        <button
                          key={r.role}
                          disabled={!isAllowed}
                          onClick={() => {
                            if (isAllowed) {
                              onRoleChange(r.role);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            !isAllowed
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 text-slate-400'
                              : currentRole === r.role 
                              ? 'bg-slate-900 text-white cursor-pointer' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
                          }`}
                        >
                          <span>{r.label}</span>
                          {currentRole === r.role && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* System Accounts Access Control Section */}
              {currentUser?.role === UserRole.SERVICE_MANAGER ? (
                /* SERVICE MANAGER: Staff Authorization & Accounts Index */
                <div className="bg-white border border-indigo-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Service Manager - Staff Authorization & Accounts Management
                      </h4>
                      <p className="text-2xs text-slate-500">
                        Authorize employee login accounts for Attendants, Technicians, Managers, or modify user roles.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddStaffModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Authorize New Staff Member
                      </button>
                      <span className="text-2xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-xl">
                        {users.length} Total Registered
                      </span>
                    </div>
                  </div>

                  {staffNotice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
                      <span>{staffNotice}</span>
                      <button onClick={() => setStaffNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold text-xs">Dismiss</button>
                    </div>
                  )}

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left text-slate-600 border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-mono text-3xs uppercase border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5">User ID</th>
                          <th className="px-3 py-2.5">Full Name</th>
                          <th className="px-3 py-2.5">Email / Contacts</th>
                          <th className="px-3 py-2.5">Role Permission</th>
                          <th className="px-3 py-2.5">Staff Auth Status</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const isStaff = u.role !== UserRole.CUSTOMER;
                          const isAuthorized = u.isAuthorizedStaff || u.authorizationStatus === 'Authorized';

                          return (
                            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                              <td className="px-3 py-3 font-mono font-bold text-slate-900 text-2xs">{u.id}</td>
                              <td className="px-3 py-3 font-extrabold text-slate-900">
                                {u.name}
                              </td>
                              <td className="px-3 py-3 font-mono text-2xs text-slate-600">
                                <div>{u.email}</div>
                                <div className="text-3xs text-slate-400">{u.phone || '+256 700 000000'}</div>
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={u.role}
                                  onChange={(e) => {
                                    const newR = e.target.value as UserRole;
                                    const authorizeStaff = newR !== UserRole.CUSTOMER;
                                    handleAuthorizeUser(u.id, newR, authorizeStaff);
                                  }}
                                  className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-2 py-1 outline-none font-medium cursor-pointer"
                                >
                                  <option value={UserRole.CUSTOMER}>Customer</option>
                                  <option value={UserRole.PARKING_ATTENDANT}>Parking Attendant</option>
                                  <option value={UserRole.SERVICE_TECHNICIAN}>Service Technician</option>
                                  <option value={UserRole.SERVICE_MANAGER}>Service Manager</option>
                                </select>
                              </td>
                              <td className="px-3 py-3 font-mono text-3xs">
                                {isAuthorized ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <UserCheck className="w-3 h-3" /> Authorized Employee
                                  </span>
                                ) : u.authorizationStatus === 'Pending Approval' ? (
                                  <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 w-max">
                                    <Clock className="w-3 h-3" /> Pending Approval
                                  </span>
                                ) : (
                                  <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-max inline-block">
                                    Customer Account
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-right font-mono text-3xs">
                                {!isAuthorized ? (
                                  <button
                                    onClick={() => {
                                      const defaultStaffRole = u.role !== UserRole.CUSTOMER ? u.role : UserRole.PARKING_ATTENDANT;
                                      handleAuthorizeUser(u.id, defaultStaffRole, true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-3xs transition cursor-pointer"
                                  >
                                    Enable Staff Access
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAuthorizeUser(u.id, UserRole.CUSTOMER, false)}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg font-bold text-3xs transition cursor-pointer"
                                  >
                                    Revoke Staff Access
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal to Add & Authorize Staff Member */}
                  {showAddStaffModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                            Authorize New Staff Member
                          </h3>
                          <button
                            onClick={() => setShowAddStaffModal(false)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                          >
                            ✕
                          </button>
                        </div>

                        <form onSubmit={handleAddStaffSubmit} className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Full Employee Name</label>
                            <input
                              type="text"
                              required
                              value={newStaffName}
                              onChange={(e) => setNewStaffName(e.target.value)}
                              placeholder="e.g., Peter Ssebaggala"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Employee Email Address</label>
                            <input
                              type="email"
                              required
                              value={newStaffEmail}
                              onChange={(e) => setNewStaffEmail(e.target.value)}
                              placeholder="peter.s@welilecarhub.com"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Phone Contact</label>
                            <input
                              type="text"
                              value={newStaffPhone}
                              onChange={(e) => setNewStaffPhone(e.target.value)}
                              placeholder="+256 700 000000"
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">Authorize Staff Role</label>
                            <select
                              value={newStaffRole}
                              onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-semibold"
                            >
                              <option value={UserRole.PARKING_ATTENDANT}>Parking Attendant</option>
                              <option value={UserRole.SERVICE_TECHNICIAN}>Service Technician</option>
                              <option value={UserRole.SERVICE_MANAGER}>Service Manager</option>
                            </select>
                          </div>

                          <div className="pt-3 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddStaffModal(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingStaff}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
                            >
                              {isSubmittingStaff ? 'Authorizing...' : 'Authorize Staff Member'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'executions' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Live Operations & Telemetry Logs</h3>
                  <p className="text-xs text-slate-500">Real-time parking space telemetry and mechanic workflow logs.</p>
                </div>
                <button
                  onClick={onRefreshAll}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
              </div>

              <div className="space-y-2">
                {reservations.map((res) => (
                  <div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        QR
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Parking Booking #{res.id}</p>
                        <p className="text-2xs text-slate-500 font-mono">Spot ID: {res.parkingId} • {res.startTime} to {res.endTime}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-2xs font-bold bg-emerald-100 text-emerald-800">
                      {res.status}
                    </span>
                  </div>
                ))}

                {services.map((srv) => (
                  <div key={srv.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{srv.serviceType}</p>
                        <p className="text-2xs text-slate-500 font-mono">Cost: UGX {srv.cost.toLocaleString()} • Date: {srv.bookingDate}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-2xs font-bold bg-amber-100 text-amber-800">
                      {srv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>

      {/* ================= MODALS FOR PROFILE MENU ================= */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl font-bold">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">User Profile</h3>
                  <p className="text-3xs text-slate-500 font-mono">Role-Based Identity Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Full Name</span>
                  <span className="font-extrabold text-slate-900">{currentUser?.name || 'Authorized User'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Registered Role</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono rounded-full">
                    {currentRole}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="font-mono text-slate-700">{currentUser?.email || 'user@ugpark.co.ug'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Phone Number</span>
                  <span className="font-mono text-slate-700">{currentUser?.phone || '+256 700 000000'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Authorization Status</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authorized Access
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl font-bold">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">System Notifications</h3>
                  <p className="text-3xs text-slate-500 font-mono">Workplace & Service Alerts</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                  No new unread notifications.
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                    <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <p className="font-semibold text-slate-800">{n.text}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{n.time || 'Just now'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setActiveModal(null)}
                className="ml-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl font-bold">
                  <HelpCircle className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Help & Support</h3>
                  <p className="text-3xs text-slate-500 font-mono">Kampala Customer & Staff Helpline</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-100 space-y-2">
                <div className="flex items-center gap-3 text-sky-900">
                  <Phone className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <p className="font-bold">Customer & Service Toll-Free Hotline</p>
                    <p className="text-xs font-mono font-black">+256 800 100 200</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sky-900 pt-1 border-t border-sky-200/50">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold">24/7 Mobile Van & Emergency Towing</p>
                    <p className="text-xs font-mono font-black">+256 700 999 888</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sky-900 pt-1 border-t border-sky-200/50">
                  <Mail className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="font-bold">Support Email</p>
                    <p className="text-xs font-mono">support@welilecarhub.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Close Support
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Account Settings</h3>
                  <p className="text-3xs text-slate-500 font-mono">Preferences & Security</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">SMS Notifications</p>
                  <p className="text-3xs text-slate-500">Receive entry/exit & repair updates on mobile</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-600" />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Email Alerts</p>
                  <p className="text-3xs text-slate-500">Service receipts & booking confirmations</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-600" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

