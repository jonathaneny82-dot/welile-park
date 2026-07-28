import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Check, 
  Mail, 
  ArrowLeft,
  ShieldCheck,
  Wrench,
  Car,
  ParkingSquare,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';

interface LoginPageProps {
  currentUser: User | null;
  users: User[];
  onLogin: (user: User) => void;
  onCancel?: () => void;
}

type PortalType = 'customer' | 'staff' | 'technician' | 'attendant' | 'service_manager' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin }) => {
  // Navigation screen state: 'portal_selection' or 'login'
  const [currentScreen, setCurrentScreen] = useState<'portal_selection' | 'login'>('portal_selection');
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('customer');
  const [staffRoleIdentity, setStaffRoleIdentity] = useState<UserRole>(UserRole.SERVICE_TECHNICIAN);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Login Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot Password Field
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Helper to map PortalType & staff identity to UserRole
  const getRoleForPortal = (portal: PortalType): UserRole => {
    switch (portal) {
      case 'customer':
        return UserRole.CUSTOMER;
      case 'staff':
        return staffRoleIdentity;
      case 'technician':
        return UserRole.SERVICE_TECHNICIAN;
      case 'attendant':
        return UserRole.PARKING_ATTENDANT;
      case 'service_manager':
        return UserRole.SERVICE_MANAGER;
      case 'admin':
        return UserRole.ADMINISTRATOR;
      default:
        return UserRole.CUSTOMER;
    }
  };

  // Sync default user email when portal selected or staff role identity changes
  useEffect(() => {
    const meta = getPortalMeta(selectedPortal);
    setEmail(meta.defaultUserEmail);
    setPassword('••••••••');
    setAuthNotice(null);
    setShowPassword(false);
    setResetSuccess(false);
  }, [selectedPortal, staffRoleIdentity, authMode]);

  // Helper to get Portal Configuration details
  const getPortalMeta = (portal: PortalType) => {
    switch (portal) {
      case 'customer':
        return {
          title: 'Customer',
          portalName: 'Customer Portal',
          roleName: 'Customer',
          icon: Car,
          emoji: '🚗',
          colorTheme: 'purple',
          accentBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40',
          subtitle: 'Book parking & services',
          defaultUserEmail: 'jonathaneny82@gmail.com',
          defaultUserName: 'Jonathan',
        };
      case 'staff':
        if (staffRoleIdentity === UserRole.SERVICE_TECHNICIAN) {
          return {
            title: 'Staff Portal (Technician)',
            portalName: 'Unified Staff Portal',
            roleName: 'Service Technician',
            icon: Wrench,
            emoji: '👨‍🔧',
            colorTheme: 'orange',
            accentBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
            btnBg: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40',
            subtitle: 'Single staff portal for operations',
            defaultUserEmail: 'sarah.n@icpvsms.com',
            defaultUserName: 'Sarah Nakato',
          };
        } else if (staffRoleIdentity === UserRole.PARKING_ATTENDANT) {
          return {
            title: 'Staff Portal (Parking Attendant)',
            portalName: 'Unified Staff Portal',
            roleName: 'Parking Attendant',
            icon: ParkingSquare,
            emoji: '🅿️',
            colorTheme: 'blue',
            accentBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
            btnBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40',
            subtitle: 'Single staff portal for operations',
            defaultUserEmail: 'alex.m@icpvsms.com',
            defaultUserName: 'Alex Mukasa',
          };
        } else {
          return {
            title: 'Staff Portal (Service Manager)',
            portalName: 'Unified Staff Portal',
            roleName: 'Service Manager',
            icon: ShieldCheck,
            emoji: '🔧',
            colorTheme: 'amber',
            accentBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
            btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40',
            subtitle: 'Single staff portal for operations',
            defaultUserEmail: 'denis.o@icpvsms.com',
            defaultUserName: 'Denis Okello',
          };
        }
      case 'technician':
        return {
          title: 'Service Technician',
          portalName: 'Service Technician Portal',
          roleName: 'Service Technician',
          icon: Wrench,
          emoji: '👨‍🔧',
          colorTheme: 'orange',
          accentBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          btnBg: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40',
          subtitle: 'Assigned duties & service execution',
          defaultUserEmail: 'sarah.n@icpvsms.com',
          defaultUserName: 'Sarah Nakato',
        };
      case 'attendant':
        return {
          title: 'Parking Attendant',
          portalName: 'Parking Attendant Portal',
          roleName: 'Parking Attendant',
          icon: ParkingSquare,
          emoji: '🅿️',
          colorTheme: 'blue',
          accentBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          btnBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40',
          subtitle: 'Manage yard & scan tickets',
          defaultUserEmail: 'alex.m@icpvsms.com',
          defaultUserName: 'Alex Mukasa',
        };
      case 'service_manager':
        return {
          title: 'Service Manager',
          portalName: 'Service Manager Portal',
          roleName: 'Service Manager',
          icon: Wrench,
          emoji: '🔧',
          colorTheme: 'amber',
          accentBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40',
          subtitle: 'Oversee workshop repairs & staff roster',
          defaultUserEmail: 'denis.o@icpvsms.com',
          defaultUserName: 'Denis Okello',
        };
      case 'admin':
        return {
          title: 'Systems Manager',
          portalName: 'Systems Manager Portal',
          roleName: 'Systems Manager',
          icon: ShieldCheck,
          emoji: '🛡️',
          colorTheme: 'purple',
          accentBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40',
          subtitle: 'Admin controls & analytics',
          defaultUserEmail: 'grace.admin@icpvsms.com',
          defaultUserName: 'Grace Namubiru',
        };
    }
  };

  const handleSelectPortalCard = (portal: PortalType) => {
    setSelectedPortal(portal);
    setAuthMode('login');
    setCurrentScreen('login');
  };

  // Smart User Lookup
  const findUserMatch = (searchQuery: string, userList: User[]): User | undefined => {
    if (!searchQuery) return undefined;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return undefined;

    return userList.find((u) => 
      u.email.toLowerCase() === q || 
      u.name.toLowerCase() === q || 
      u.id.toLowerCase() === q ||
      u.email.toLowerCase().split('@')[0] === q
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthNotice(null);

    const targetRole = getRoleForPortal(selectedPortal);
    const meta = getPortalMeta(selectedPortal);
    const inputVal = (email.trim() || meta.defaultUserEmail).toLowerCase();

    // 1. Search local users list
    let matchedUser = findUserMatch(inputVal, users);

    if (matchedUser) {
      onLogin(matchedUser);
      setIsLoading(false);
      return;
    }

    // 2. Call backend login API
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputVal,
          role: targetRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onLogin(data.user);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      // Fallback below
    }

    // 3. Fallback User Creation
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inputVal.includes('@') ? inputVal.split('@')[0].replace(/\./g, ' ') : meta.defaultUserName,
      email: inputVal.includes('@') ? inputVal : meta.defaultUserEmail,
      phone: '+256 700 000000',
      role: targetRole,
      createdAt: new Date().toISOString(),
      isAuthorizedStaff: targetRole !== UserRole.CUSTOMER,
      authorizationStatus: targetRole !== UserRole.CUSTOMER ? 'Authorized' : 'Customer',
    };

    onLogin(newUser);
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthNotice(null);

    const targetRole = getRoleForPortal(selectedPortal);

    const createdUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim() || 'New User',
      email: regEmail.trim() || `user_${Date.now()}@ugpark.com`,
      phone: '+256 700 000000',
      role: targetRole,
      createdAt: new Date().toISOString(),
      isAuthorizedStaff: targetRole !== UserRole.CUSTOMER,
      authorizationStatus: targetRole !== UserRole.CUSTOMER ? 'Authorized' : 'Customer',
    };

    onLogin(createdUser);
    setIsLoading(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setResetSuccess(true);
    }, 600);
  };

  const meta = getPortalMeta(selectedPortal);
  const PortalIcon = meta.icon;

  const portalsList: { id: PortalType; title: string; subtitle: string; icon: React.FC<{ className?: string }>; emoji: string }[] = [
    {
      id: 'customer',
      title: 'Customer Portal',
      subtitle: 'Book parking & car servicing',
      icon: Car,
      emoji: '🚗',
    },
    {
      id: 'staff',
      title: 'Staff Operations Portal',
      subtitle: 'Single portal for Technicians, Attendants & Managers',
      icon: ShieldCheck,
      emoji: '🛠️',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      
      {/* Soft Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto z-10 my-auto">

        {/* ================= SCREEN 1: PORTAL SELECTION ================= */}
        {currentScreen === 'portal_selection' && (
          <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            
            {/* Logo & App Title Only */}
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20 ring-4 ring-purple-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  welile PARK
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Select your portal to sign in
                </p>
              </div>
            </div>

            {/* Clean Standard Portal Cards Grid */}
            <div className="grid grid-cols-1 gap-3 sm:gap-3.5 pt-2">
              {portalsList.map((p) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPortalCard(p.id)}
                    className="w-full p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-between gap-4 group cursor-pointer text-left shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-300 group-hover:text-emerald-400 flex items-center justify-center transition-colors shrink-0 border border-slate-700/60">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {p.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-slate-800/60 group-hover:bg-emerald-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center transition-all shrink-0">
                      →
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Discreet Systems Admin Login Access */}
            <div className="pt-2 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectPortalCard('admin')}
                className="text-3xs text-slate-500 hover:text-slate-300 font-mono transition cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-slate-800"
                title="Systems Administrator Login"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Systems Administrator Portal Access</span>
              </button>
              <p className="text-[10px] text-slate-600 font-mono">
                UG PARK • Smart Mobility Management System
              </p>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: LOGIN ================= */}
        {currentScreen === 'login' && (
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Top Navigation & Selected Portal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('portal_selection')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${meta.accentBg}`}>
                  <PortalIcon className="w-3.5 h-3.5" />
                  <span>{meta.title}</span>
                </span>
              </div>
            </div>

            {/* Portal Title Indicator */}
            <div className="text-center pt-1">
              <h2 className="text-xl font-black text-white">
                {authMode === 'login' && `Sign In as ${meta.title}`}
                {authMode === 'register' && `Create ${meta.title} Account`}
                {authMode === 'forgot_password' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {authMode === 'login' && 'Enter your account credentials to proceed'}
                {authMode === 'register' && 'Fill in your details to get started'}
                {authMode === 'forgot_password' && 'Enter your email to receive a recovery link'}
              </p>
            </div>

            {/* FORM VIEW 1: SIGN IN */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Unified Staff Identity Selector (Technician, Parking Attendant, Service Manager) */}
                {selectedPortal === 'staff' && (
                  <div className="space-y-2 bg-slate-850 p-3 rounded-2xl border border-slate-700/80">
                    <label className="text-xs font-bold text-slate-300 block flex items-center justify-between">
                      <span>Identify Staff Profile on Log In:</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold">Single Staff Portal</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStaffRoleIdentity(UserRole.SERVICE_TECHNICIAN)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                          staffRoleIdentity === UserRole.SERVICE_TECHNICIAN
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/60 ring-2 ring-orange-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <Wrench className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] text-center leading-tight">Technician</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffRoleIdentity(UserRole.PARKING_ATTENDANT)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                          staffRoleIdentity === UserRole.PARKING_ATTENDANT
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 ring-2 ring-blue-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <ParkingSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] text-center leading-tight">Attendant</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStaffRoleIdentity(UserRole.SERVICE_MANAGER)}
                        className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer ${
                          staffRoleIdentity === UserRole.SERVICE_MANAGER
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] text-center leading-tight">Manager</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Email Address</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={meta.defaultUserEmail}
                      className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white transition cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition cursor-pointer ${
                        rememberMe ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-800'
                      }`}
                    >
                      {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                    <span className="text-slate-300 text-xs font-medium">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot_password')}
                    className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center mt-2 ${meta.btnBg}`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Signing In...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Create Account Link */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-400">Don&apos;t have an account? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </div>

              </form>
            )}

            {/* FORM VIEW 2: CREATE ACCOUNT */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Full Name</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Sarah Nakato"
                      className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Email Address</label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Create Password</label>
                  <div className="relative flex items-center">
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center mt-2 ${meta.btnBg}`}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {/* FORM VIEW 3: FORGOT PASSWORD */}
            {authMode === 'forgot_password' && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {resetSuccess ? (
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h3 className="text-sm font-bold text-white">Recovery Link Sent</h3>
                    <p className="text-xs text-slate-300">
                      We sent a password reset link to <strong className="text-emerald-400">{resetEmail || email}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 block">Registered Email</label>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        required
                        value={resetEmail || email}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="your.email@domain.com"
                        className="w-full bg-slate-800/90 focus:bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition pr-10"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                    </div>
                  </div>
                )}

                {!resetSuccess && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition duration-200 cursor-pointer"
                  >
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                  </button>
                )}

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setResetSuccess(false);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
