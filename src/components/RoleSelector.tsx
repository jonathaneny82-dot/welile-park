import React from 'react';
import { UserRole, VehicleService, User as UserType } from '../types';
import { User, Shield, Wrench, QrCode, ClipboardList, Settings, LogIn, UserCheck, ShieldCheck } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  currentUser?: UserType | null;
  onRoleChange: (role: UserRole) => void;
  onOpenLogin?: () => void;
  services?: VehicleService[];
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  currentRole, 
  currentUser,
  onRoleChange, 
  onOpenLogin,
  services = [] 
}) => {
  // Identify vehicle services scheduled or active within 48 hours
  const servicesWithin48Hours = services.filter((srv) => {
    if (srv.status === 'Completed') return false;
    const bookingTime = new Date(srv.bookingDate).getTime();
    const now = new Date().getTime();
    const diffMs = bookingTime - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    // within 48 hours range: -48 to +48 hours (covers recently past due active jobs and upcoming bookings)
    return diffHours >= -48 && diffHours <= 48;
  });

  const servicesWithin48HoursCount = servicesWithin48Hours.length;

  const rolesInfo = [
    {
      role: UserRole.CUSTOMER,
      label: 'Customer Portal',
      icon: User,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      activeColor: 'bg-purple-600 text-white border-purple-600 shadow-sm',
      desc: 'Reserve parking spots, book mechanic services, trace live repair status, and consult the AI Mechanic.',
    },
    {
      role: UserRole.PARKING_ATTENDANT,
      label: 'Parking Attendant',
      icon: QrCode,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      activeColor: 'bg-indigo-600 text-white border-indigo-600 shadow-sm',
      desc: 'Verify digital parking tickets, scan QR entry codes, and log vehicle check-in/check-out events.',
    },
    {
      role: UserRole.SERVICE_TECHNICIAN,
      label: 'Service Technician',
      icon: Wrench,
      color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
      activeColor: 'bg-orange-600 text-white border-orange-600 shadow-sm',
      desc: 'View assigned maintenance jobs, update vehicle repair milestones, and request spare parts.',
    },
    {
      role: UserRole.SERVICE_MANAGER,
      label: 'Service Manager',
      icon: ClipboardList,
      color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
      activeColor: 'bg-sky-600 text-white border-sky-600 shadow-sm',
      desc: 'Assign mechanics to booked jobs, approve service diagnostics, and oversee workshop capacity.',
    },
    {
      role: UserRole.ADMINISTRATOR,
      label: 'System Admin',
      icon: Shield,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
      activeColor: 'bg-slate-800 text-white border-slate-800 shadow-sm',
      desc: 'Access financial charts, track overall spot occupancy, manage pricing models, and trigger AI parts predictions.',
    },
  ];

  return (
    <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Prominent Logged-In User Identifier Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-2.5 px-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm ring-2 ring-blue-400/40 shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"></span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
                  Logged In As
                </span>
                <span className="text-xs font-black text-white">{currentUser?.name || 'Authorized Session'}</span>
                
                {/* Dynamic Role Badge Identifier */}
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase tracking-wider border ${
                  currentRole === UserRole.CUSTOMER 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : currentRole === UserRole.PARKING_ATTENDANT
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : currentRole === UserRole.SERVICE_TECHNICIAN
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : currentRole === UserRole.SERVICE_MANAGER
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {currentRole}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="text-slate-400 text-xs font-mono">{currentUser?.email || 'user@ugpark.co.ug'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">WELILE CAR HUB</h1>
              <p className="text-xs text-gray-500 font-mono">Integrated Parking & Vehicle Service</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {rolesInfo.map((item) => {
              const Icon = item.icon;
              const isActive = currentRole === item.role;
              const isAllowed = currentUser?.role === UserRole.ADMINISTRATOR || item.role === currentUser?.role;
              const isServiceRole = item.role === UserRole.SERVICE_TECHNICIAN || item.role === UserRole.SERVICE_MANAGER;
              const hasAlert = isServiceRole && servicesWithin48HoursCount > 0;

              return (
                <button
                  key={item.role}
                  disabled={!isAllowed}
                  onClick={() => {
                    if (isAllowed) {
                      onRoleChange(item.role);
                    }
                  }}
                  title={!isAllowed ? `Role locked. Logged in as registered ${currentUser?.role}` : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 relative ${
                    !isAllowed 
                      ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' 
                      : isActive ? item.activeColor : item.color
                  } ${isAllowed ? 'cursor-pointer' : ''}`}
                  id={`role-btn-${item.role.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" />
                    {hasAlert && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  {item.label}
                  {hasAlert && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded-full font-mono tracking-tight shadow-sm scale-90">
                      {servicesWithin48HoursCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 max-w-3xl leading-relaxed">
          <span className="font-semibold text-gray-700">Active Mode:</span> {rolesInfo.find(r => r.role === currentRole)?.desc}
        </div>

        {/* Expanded Scheduled Maintenance Alert Panel */}
        {servicesWithin48HoursCount > 0 && (
          <div className="mt-2.5 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-800 animate-fadeIn">
            <span className="relative flex h-2.5 w-2.5 mt-1 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider text-[9px] font-mono bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md mr-1.5">Scheduled Maintenance Warning</span>
              There are <span className="font-extrabold">{servicesWithin48HoursCount} scheduled maintenance appointments</span> occurring within 48 hours. Please verify workshop schedules and allocate mechanics!
              <div className="mt-1.5 flex flex-wrap gap-2">
                {servicesWithin48Hours.map((srv) => (
                  <span key={srv.id} className="text-[10px] font-bold bg-white/80 border border-red-200/50 px-2.5 py-0.5 rounded-md text-red-900 font-mono shadow-3xs">
                    {srv.serviceType} • {new Date(srv.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(srv.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
