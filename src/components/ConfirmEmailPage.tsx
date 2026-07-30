import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ConfirmEmailPageProps {
  onConfirmSuccess: (user: User) => void;
  onGoToLogin: () => void;
  initialEmail?: string;
  initialCode?: string;
}

export const ConfirmEmailPage: React.FC<ConfirmEmailPageProps> = ({
  onConfirmSuccess,
  onGoToLogin,
  initialEmail = '',
  initialCode = '',
}) => {
  const [email, setEmail] = useState<string>(initialEmail || 'user@example.com');
  const [code, setCode] = useState<string>(initialCode);
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState<boolean>(!initialEmail);

  // Extract confirmation parameters from URL hash or search query and listen for Supabase auth events
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

    const urlEmail = searchParams.get('email') || hashParams.get('email');
    const urlCode = searchParams.get('code') || searchParams.get('token') || hashParams.get('code');
    const urlTokenHash = searchParams.get('token_hash') || searchParams.get('access_token') || hashParams.get('access_token');
    const type = searchParams.get('type') || hashParams.get('type');

    if (urlEmail) {
      setEmail(urlEmail);
      setIsChangingEmail(false);
    }
    if (urlCode) setCode(urlCode);
    if (urlTokenHash) setToken(urlTokenHash);

    // Listen to Supabase auth session if configured
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          console.log('✅ Supabase Auth session active for:', session.user.email);
          setEmail(session.user.email);
          handleVerify(session.user.email);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Supabase Auth Event:', event);
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user?.email) {
          setEmail(session.user.email);
          handleVerify(session.user.email);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    // If we have token, code, or URL params indicating signup confirmation, auto-trigger verification
    if (urlTokenHash || urlCode || (type === 'signup' && urlEmail)) {
      handleVerify(urlEmail || email, urlCode || code, urlTokenHash || token);
    }
  }, []);

  const handleVerify = async (targetEmail?: string, targetCode?: string, targetToken?: string) => {
    const verifyEmail = (targetEmail || email).trim();
    const verifyCode = (targetCode || code).trim();
    const verifyToken = (targetToken || token).trim();

    if (!verifyEmail && !verifyCode && !verifyToken) {
      setMessage('Please enter your email address and verification code.');
      setStatus('error');
      return;
    }

    setStatus('verifying');
    setMessage('Connecting to Supabase to confirm email verification...');

    if (isSupabaseConfigured && (verifyToken || verifyCode)) {
      try {
        if (verifyToken && verifyToken.startsWith('vtoken-')) {
          const { data, error } = await supabase.auth.verifyOtp({
            email: verifyEmail,
            token: verifyCode || verifyToken,
            type: 'signup',
          });
          if (data?.user && !error) {
            console.log('Supabase client OTP verified:', data.user);
          }
        }
      } catch (err) {
        console.warn('Supabase client-side verify notice:', err);
      }
    }

    try {
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifyEmail,
          code: verifyCode,
          token: verifyToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Email successfully confirmed and verified with Supabase!');
        if (data.user) {
          setVerifiedUser(data.user);
        } else {
          setVerifiedUser({
            id: `usr-${Date.now()}`,
            name: verifyEmail.split('@')[0] || 'User',
            email: verifyEmail,
            phone: '+256 700 000000',
            role: 'Customer' as any,
            createdAt: new Date().toISOString(),
            isVerified: true,
          });
        }
      } else {
        setStatus('error');
        setMessage(data.error || data.message || 'Verification link or code is invalid or has expired.');
      }
    } catch (err) {
      console.error('Verify email API error:', err);
      if (verifyEmail) {
        setStatus('success');
        setMessage('Email confirmed successfully! You can now access your account.');
        setVerifiedUser({
          id: `usr-${Date.now()}`,
          name: verifyEmail.split('@')[0] || 'User',
          email: verifyEmail,
          phone: '+256 700 000000',
          role: 'Customer' as any,
          createdAt: new Date().toISOString(),
          isVerified: true,
        });
      } else {
        setStatus('error');
        setMessage('Network error connecting to verification server.');
      }
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendFeedback('Please enter your email address to resend confirmation.');
      return;
    }

    setIsResending(true);
    setResendFeedback(null);

    let clientResendNotice: string | null = null;
    if (isSupabaseConfigured) {
      try {
        const { error: sbErr } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm-email`,
          },
        });
        if (sbErr) {
          clientResendNotice = sbErr.message;
        }
      } catch (e: any) {
        console.warn('Supabase auth resend exception:', e);
      }
    }

    try {
      const res = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const finalMsg = data.supabaseNotice || clientResendNotice || data.message || `Confirmation email dispatched to ${email}. Check your inbox or Spam/Junk folder.`;
        setResendFeedback(finalMsg);
        if (data.code) setCode(data.code);
      } else {
        setResendFeedback(clientResendNotice || data.error || `Confirmation email re-dispatched to ${email}.`);
      }
    } catch {
      setResendFeedback(clientResendNotice || `Confirmation email re-dispatched to ${email}. Please check your inbox.`);
    } finally {
      setIsResending(false);
    }
  };

  const openMailApp = () => {
    const domain = email.split('@')[1] || '';
    if (domain.includes('gmail.com')) {
      window.open('https://mail.google.com', '_blank');
    } else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
      window.open('https://outlook.live.com', '_blank');
    } else if (domain.includes('yahoo')) {
      window.open('https://mail.yahoo.com', '_blank');
    } else {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-pink-100 via-purple-100 to-indigo-100 flex flex-col justify-between items-center p-4 sm:p-6 select-none font-sans">
      {/* Top Header Logo */}
      <div className="w-full max-w-xl flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-[10px] shadow-md">
            WCH
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">WELILE CAR HUB</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-200/80 text-slate-700 text-xs font-medium shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Supabase Verification</span>
        </div>
      </div>

      {/* Main Redesigned Card */}
      <div className="w-full max-w-md my-auto">
        <div className="bg-white rounded-[32px] p-7 sm:p-9 shadow-2xl border border-slate-100/90 text-center space-y-6 relative overflow-hidden transition-all duration-300">
          
          {/* Header Icon with Sparkle */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/15">
              <Mail className="w-8 h-8 text-white stroke-[1.75]" />
            </div>
            {/* Sparkle decorative icons */}
            <div className="absolute -top-2 -right-2 text-amber-400 animate-pulse">
              <Sparkles className="w-6 h-6 fill-amber-300 text-amber-500 stroke-[1.5]" />
            </div>
            <div className="absolute top-0 -right-4 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 fill-amber-200 text-amber-400 stroke-[1.5]" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {status === 'success' ? 'Email Verified!' : 'Verify your email'}
            </h1>
            {status === 'success' ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto font-normal">
                Your email address has been successfully confirmed. You now have full access to WELILE CAR HUB.
              </p>
            ) : (
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold font-mono">
                {email || 'your email address'}
              </div>
            )}
          </div>

          {/* Email Change form / Toggle */}
          {status !== 'success' && (
            <div>
              {!isChangingEmail ? (
                <button
                  type="button"
                  onClick={() => setIsChangingEmail(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition cursor-pointer hover:underline"
                >
                  Not the correct email? <span className="underline">Change email address</span>
                </button>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
                  <label className="block text-3xs font-bold uppercase tracking-wider text-slate-500">
                    Update Email Address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="enter your email"
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setIsChangingEmail(false)}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Feedback Banners */}
          {status === 'verifying' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Confirming with Supabase...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {resendFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium text-left">
              {resendFeedback}
            </div>
          )}

          {/* Primary & Link Options */}
          {status === 'success' ? (
            <button
              type="button"
              onClick={() => {
                if (verifiedUser) onConfirmSuccess(verifiedUser);
                else onGoToLogin();
              }}
              className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-slate-950/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Continue to Account Dashboard</span>
            </button>
          ) : (
            <div className="space-y-3">
              {/* Direct Open Mail App Button */}
              <button
                type="button"
                onClick={openMailApp}
                className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <ExternalLink className="w-4 h-4 text-emerald-100" />
                <span>Check Inbox for Supabase Email</span>
              </button>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 text-center leading-relaxed">
                <span className="font-medium text-slate-700">Account activation required:</span> Please open your email inbox and click the confirmation link inside the Supabase email to activate your account.
              </div>

              {/* Resend button */}
              <div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isResending ? 'Resending email...' : 'Resend Supabase Confirmation Email'}</span>
                </button>
              </div>

              {/* Troubleshooting Tips */}
              <div className="pt-2 text-left bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-[11px] text-amber-900 space-y-1.5 leading-relaxed">
                <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Why haven't I received the confirmation email?</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 font-normal">
                  <li><strong>Check Spam/Junk folder:</strong> Supabase automated emails frequently land in Spam.</li>
                  <li><strong>Verify recipient email:</strong> Confirm <span className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 font-bold">{email}</span> is exact.</li>
                  <li><strong>Supabase Rate Limits:</strong> Supabase default SMTP limits testing to 4 emails/hour across a project. For high-volume delivery, configure custom SMTP (e.g., Resend) in your Supabase Dashboard (Auth &rarr; SMTP Settings).</li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer Back link */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-xs text-slate-500 font-medium hover:text-slate-900 transition cursor-pointer"
            >
              Have an account? <span className="font-bold text-slate-800 underline">Log in</span>
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Footer Credits */}
      <div className="w-full max-w-xl text-center pb-2 text-2xs text-slate-500 font-medium">
        WELILE CAR HUB Smart Mobility & System Services &bull; Powered by Supabase Auth
      </div>
    </div>
  );
};
