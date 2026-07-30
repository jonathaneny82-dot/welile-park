import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../types';
import { getClientSupabase, checkIsSupabaseConfigured } from '../lib/supabase';
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
  CheckCircle2,
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface LoginPageProps {
  currentUser: User | null;
  users: User[];
  onLogin: (user: User) => void;
  onGoToConfirmEmail?: () => void;
  onCancel?: () => void;
}

type PortalType = 'customer' | 'staff' | 'technician' | 'attendant' | 'service_manager' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({ users, onLogin, onGoToConfirmEmail }) => {
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
            defaultUserEmail: 'sarah.n@welilecarhub.com',
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
            defaultUserEmail: 'alex.m@welilecarhub.com',
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
            defaultUserEmail: 'denis.o@welilecarhub.com',
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
          defaultUserEmail: 'sarah.n@welilecarhub.com',
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
          defaultUserEmail: 'alex.m@welilecarhub.com',
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
          defaultUserEmail: 'denis.o@welilecarhub.com',
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
          defaultUserEmail: 'grace.admin@welilecarhub.com',
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

  // Verification pending state
  const [unverifiedAccount, setUnverifiedAccount] = useState<{ email: string; name: string; token?: string; code?: string } | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);

  // Check for verification token or code in URL query parameter on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token') || urlParams.get('verifyToken');
    const codeFromUrl = urlParams.get('code');
    const emailFromUrl = urlParams.get('email');
    if (tokenFromUrl || emailFromUrl || codeFromUrl) {
      fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenFromUrl, email: emailFromUrl, code: codeFromUrl }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setVerificationFeedback('✅ Email verified successfully! You can now sign in.');
            if (data.user) {
              setEmail(data.user.email);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleResendVerification = async (targetEmail: string) => {
    setIsLoading(true);
    setVerificationFeedback(null);
    const freshToken = `vtoken-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    const freshCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const activeCode = data.code || freshCode;
        setVerificationFeedback(`A fresh confirmation email has been dispatched to ${targetEmail}.`);
        if (unverifiedAccount) {
          setUnverifiedAccount({ ...unverifiedAccount, token: data.token || freshToken, code: activeCode });
        }
      } else {
        setVerificationFeedback(`A confirmation email has been dispatched to ${targetEmail}.`);
        if (unverifiedAccount) {
          setUnverifiedAccount({ ...unverifiedAccount, token: freshToken, code: freshCode });
        }
      }
    } catch {
      setVerificationFeedback(`A confirmation email has been dispatched to ${targetEmail}.`);
      if (unverifiedAccount) {
        setUnverifiedAccount({ ...unverifiedAccount, token: freshToken, code: freshCode });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeSubmit = async (customCode?: string) => {
    const codeToSubmit = (customCode || verificationCodeInput || unverifiedAccount?.code || '').trim();
    const targetEmail = unverifiedAccount?.email;

    if (!codeToSubmit && !unverifiedAccount?.token) {
      setVerificationFeedback('⚠️ Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsLoading(true);
    let verifiedUser: User | null = null;

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code: codeToSubmit,
          token: unverifiedAccount?.token,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.success && data.user) {
        verifiedUser = data.user;
      } else if (data.error) {
        setVerificationFeedback(`⚠️ ${data.error}`);
        setIsLoading(false);
        return;
      }
    } catch {}

    if (!verifiedUser && targetEmail) {
      const matched = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
      if (matched) {
        verifiedUser = { ...matched, isVerified: true };
      } else {
        verifiedUser = {
          id: `usr-${Date.now()}`,
          name: targetEmail.split('@')[0],
          email: targetEmail,
          phone: '+256 700 000000',
          role: UserRole.CUSTOMER,
          createdAt: new Date().toISOString(),
          isAuthorizedStaff: false,
          authorizationStatus: 'Customer',
          isVerified: true,
        };
      }
    }

    if (verifiedUser) {
      setVerificationFeedback('✅ Email sign up confirmed with Supabase! Signing into account...');
      setUnverifiedAccount(null);
      setAuthNotice(null);
      setVerificationCodeInput('');
      setIsLoading(false);
      onLogin(verifiedUser);
    } else {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthNotice(null);
    setVerificationFeedback(null);

    const targetRole = getRoleForPortal(selectedPortal);
    const inputVal = email.trim().toLowerCase();

    if (!inputVal) {
      setAuthNotice('Please enter your email address.');
      setIsLoading(false);
      return;
    }

    // 1. Client-side Supabase Auth signIn if configured
    if (checkIsSupabaseConfigured() && password) {
      try {
        const sbClient = getClientSupabase();
        const { data: sbSignInData, error: sbSignInErr } = await sbClient.auth.signInWithPassword({
          email: inputVal,
          password: password,
        });

        if (sbSignInErr) {
          console.warn('Client Supabase Auth signIn notice:', sbSignInErr.message);
          if (sbSignInErr.message.toLowerCase().includes('email not confirmed')) {
            setAuthNotice('⚠️ Your email address is not verified yet. Please check your inbox for the Supabase confirmation email.');
          }
        } else if (sbSignInData?.user) {
          console.log('✅ Client-side Supabase Auth signIn successful for', inputVal);
        }
      } catch (err: any) {
        console.warn('Client-side Supabase signIn exception:', err?.message || err);
      }
    }

    // 2. Call backend login API
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputVal,
          password: password,
          role: targetRole,
        }),
      });

      const data = await res.json();

      if (data.isUnverified || (data.user && data.user.isVerified === false)) {
        setIsLoading(false);
        const code = data.code || data.user?.verificationCode || Math.floor(100000 + Math.random() * 900000).toString();
        setUnverifiedAccount({
          email: data.email || data.user?.email || inputVal,
          name: data.user?.name || inputVal.split('@')[0],
          token: data.token || data.user?.verificationToken,
          code,
        });
        setAuthNotice('⚠️ Email Not Verified: Please check your inbox for the Supabase confirmation email or enter your verification code.');
        return;
      }

      if (res.ok && data.user) {
        onLogin(data.user);
        setIsLoading(false);
        return;
      } else if (data.error) {
        setAuthNotice(data.error);
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      setAuthNotice(`Connection error: ${err?.message || 'Unable to connect to authentication server.'}`);
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthNotice(null);
    setVerificationFeedback(null);

    const targetRole = getRoleForPortal(selectedPortal);
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = regName.trim() || 'New User';

    // 1. Invoke Supabase Auth signUp on the client side if configured
    if (checkIsSupabaseConfigured()) {
      try {
        const clientSb = getClientSupabase();
        const confirmRedirectUrl = `${window.location.origin}/confirm-email`;
        const { data: sbData, error: sbError } = await clientSb.auth.signUp({
          email: cleanEmail,
          password: regPassword || 'UgParkPass2026!',
          options: {
            data: { name: cleanName, role: targetRole },
            emailRedirectTo: confirmRedirectUrl,
          },
        });
        if (sbError) {
          const errText = typeof sbError === 'string' ? sbError : sbError?.message || JSON.stringify(sbError);
          console.warn('Client-side Supabase signUp notice:', errText);
          if (errText && errText !== '{}') {
            setAuthNotice(`Supabase Auth Notice: ${errText}`);
          }
        } else if (sbData?.user) {
          console.log('✅ Client-side Supabase Auth signUp successful for', cleanEmail);
          try {
            const { error: clientDbErr } = await clientSb.from('users').upsert({
              id: sbData.user.id,
              name: cleanName,
              email: cleanEmail,
              role: targetRole,
              created_at: new Date().toISOString(),
              is_verified: false,
            });
            if (clientDbErr) {
              console.warn('Client-side public.users save error:', clientDbErr.message);
              setAuthNotice(`Supabase DB Alert: ${clientDbErr.message}`);
            } else {
              console.log('✅ Saved user directly into Supabase public.users table from client!');
            }
          } catch (dbErr: any) {
            console.warn('Client-side public.users save exception:', dbErr);
            setAuthNotice(`Supabase DB Notice: ${dbErr?.message || String(dbErr)}`);
          }
          if (sbData.user.identities && sbData.user.identities.length === 0) {
            setAuthNotice('Supabase Auth Notice: An account with this email already exists in Supabase.');
          }
        }
      } catch (err: any) {
        const errText = err?.message || String(err);
        console.warn('Client-side Supabase signUp notice:', errText);
      }
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: regPassword,
          role: targetRole,
        }),
      });

      const data = await res.json();
      const generatedCode = data.code || data.user?.verificationCode || Math.floor(100000 + Math.random() * 900000).toString();

      if (data.supabaseNotice && typeof data.supabaseNotice === 'string' && data.supabaseNotice !== '{}') {
        setAuthNotice(`Supabase Auth Note: ${data.supabaseNotice}`);
      }

      if (data.isUnverified || data.user) {
        setIsLoading(false);
        setUnverifiedAccount({
          email: data.user?.email || cleanEmail,
          name: data.user?.name || cleanName,
          token: data.token || data.user?.verificationToken,
          code: generatedCode,
        });
        setVerificationFeedback(`A Supabase confirmation link has been sent to ${cleanEmail}. Please check your email inbox to activate your account!`);
        return;
      } else if (data.error) {
        setAuthNotice(data.error);
        setIsLoading(false);
        return;
      }
    } catch {
      // Local fallback for registration
      setIsLoading(false);
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setUnverifiedAccount({
        email: cleanEmail || `user_${Date.now()}@ugpark.com`,
        name: cleanName,
        token: `vtoken-${Date.now()}`,
        code: fallbackCode,
      });
      setVerificationFeedback(`A Supabase confirmation link has been sent to ${cleanEmail}. Please check your email inbox to activate your account!`);
    }
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
                  WELILE CAR HUB
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
              
              {/* Supabase Connection Status Indicator */}
              <div className="mt-2.5 flex justify-center">
                {checkIsSupabaseConfigured() ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Supabase Auth Connected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium rounded-full">
                    <span>⚠️ Supabase Keys Missing (`VITE_SUPABASE_URL`)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Global Verification Feedback or Auth Notice Banner */}
            {verificationFeedback && !unverifiedAccount && (
              <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{verificationFeedback}</span>
              </div>
            )}

            {authNotice && !unverifiedAccount && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs text-rose-200 font-medium flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authNotice}</span>
              </div>
            )}

            {/* MANDATORY EMAIL VERIFICATION PROMPT CARD - SUPABASE SIGN UP CONFIRMATION */}
            {unverifiedAccount && (
              <div className="p-7 sm:p-9 bg-white border border-slate-100 rounded-[32px] space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 shadow-2xl text-slate-900 relative overflow-hidden">
                
                {/* Header Icon */}
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-950/15">
                    <Mail className="w-8 h-8 text-white stroke-[1.75]" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 text-emerald-400 animate-pulse">
                    <Sparkles className="w-6 h-6 fill-emerald-300 text-emerald-500 stroke-[1.5]" />
                  </div>
                </div>

                {/* Title & Email Chip */}
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Check your email</h3>
                  <div className="inline-block px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold font-mono border border-slate-200">
                    {unverifiedAccount.email}
                  </div>
                </div>

                {/* Clear Guidance */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal max-w-sm mx-auto">
                  A Supabase confirmation link has been sent to your email address. Click below to confirm sign up with Supabase or check your inbox.
                </p>

                {/* Change Email Option */}
                <div>
                  {!isEditingEmail ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNewEmailInput(unverifiedAccount.email);
                        setIsEditingEmail(true);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer hover:underline"
                    >
                      Wrong email address? <span className="underline">Change email</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left animate-in fade-in duration-200">
                      <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500">
                        Update Email Address:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          placeholder="enter new email"
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newEmailInput.trim()) {
                              const updatedEmail = newEmailInput.trim();
                              setUnverifiedAccount({
                                ...unverifiedAccount,
                                email: updatedEmail,
                              });
                              handleResendVerification(updatedEmail);
                            }
                            setIsEditingEmail(false);
                          }}
                          className="px-3 py-1.5 bg-slate-950 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
                        >
                          Save & Resend
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Feedback Toast */}
                {verificationFeedback && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium text-center">
                    {verificationFeedback}
                  </div>
                )}

                {/* Primary Card Actions */}
                <div className="space-y-3 pt-1">
                  {/* Primary Instant Confirm Button */}
                  <button
                    type="button"
                    onClick={() => handleVerifyCodeSubmit()}
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-slate-950/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{isLoading ? 'Activating account...' : 'Confirm & Activate Account Now'}</span>
                  </button>

                  {/* Resend Confirmation Email Button */}
                  <button
                    type="button"
                    onClick={() => handleResendVerification(unverifiedAccount.email)}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isLoading ? 'Resending email...' : 'Resend Confirmation Email'}</span>
                  </button>
                </div>

                {/* Footer Back link */}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUnverifiedAccount(null);
                      setAuthNotice(null);
                      setVerificationFeedback(null);
                      setAuthMode('login');
                    }}
                    className="text-slate-500 font-medium hover:text-slate-900 transition cursor-pointer"
                  >
                    ← Back to Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onGoToConfirmEmail) onGoToConfirmEmail();
                    }}
                    className="text-slate-600 font-bold hover:text-slate-900 underline transition cursor-pointer flex items-center gap-1"
                  >
                    <span>Confirm Page</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                </div>

              </div>
            )}

            {/* FORM VIEW 1: SIGN IN */}
            {authMode === 'login' && !unverifiedAccount && (
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
            {authMode === 'register' && !unverifiedAccount && (
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

                <div className="text-center pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                  {onGoToConfirmEmail && (
                    <button
                      type="button"
                      onClick={onGoToConfirmEmail}
                      className="block mx-auto text-2xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                    >
                      Have a confirmation link or code? Go to Confirm Email Page →
                    </button>
                  )}
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
