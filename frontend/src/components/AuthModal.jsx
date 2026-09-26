import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Mail, ShieldAlert, Key, ArrowRight, UserPlus, LogIn, Send, CheckCircle2, RefreshCw } from 'lucide-react';
import { api, setToken } from '../api';

const GOOGLE_CLIENT_ID = "868795125315-jaksiq9388cpgcbivmbmud5q9ibaq0ps.apps.googleusercontent.com";

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Only 2 modes: 'login' (Email + Password only) | 'register' (Email + Password + OTP verification)
  const [mode, setMode] = useState('login');

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // Register OTP sub-state: 'input' | 'otp_sent'
  const [regStep, setRegStep] = useState('input');
  const [otpCountdown, setOtpCountdown] = useState(300); // 5 mins in seconds
  const [devOtpHint, setDevOtpHint] = useState('');
  const [otpNotice, setOtpNotice] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleBtnRef = useRef(null);

  // Initialize official Google Identity Services button
  useEffect(() => {
    if (!isOpen) return;

    function initGoogle() {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: 380,
            text: "continue_with",
            shape: "rectangular"
          });
        } catch (err) {
          console.error("Google button render error:", err);
        }
      }
    }

    const t = setTimeout(initGoogle, 200);
    return () => clearTimeout(t);
  }, [isOpen, mode]);

  // Handle Google token callback
  async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.loginWithGoogle({ credential: response.credential });
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      onAuthSuccess({ email: data.email, id: data.user_id });
      onClose();
    } catch (err) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  // 5-minute countdown timer for registration OTP
  useEffect(() => {
    let timer = null;
    if (regStep === 'otp_sent' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [regStep, otpCountdown]);

  if (!isOpen) return null;

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setOtpNotice('');
    setDevOtpHint('');
    setRegStep('input');
    setOtp('');
    setOtpCountdown(300);
  }

  // 1. Regular Login: Email + Password only (NO OTP REQUIRED)
  async function handleLoginSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide your email and password.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email.trim(), password);
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      onAuthSuccess({ email: data.email, id: data.user_id });
      onClose();
    } catch (err) {
      setError(err.message || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  }

  // 2. Register: Step 1 - Send 5-min OTP to Gmail
  async function handleSendRegistrationOTP(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter a valid Gmail / email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.requestOTP(email.trim());
      setRegStep('otp_sent');
      setOtpCountdown(300);
      setOtpNotice(res.message);
      if (res.dev_otp) {
        setDevOtpHint(res.dev_otp);
      }
    } catch (err) {
      setError(err.message || "Failed to dispatch verification OTP.");
    } finally {
      setLoading(false);
    }
  }

  // 3. Register: Step 2 - Verify OTP & Create Account
  async function handleCompleteRegistration(e) {
    e.preventDefault();
    if (otpCountdown === 0) {
      setError("OTP has expired (5 minute window). Please request a new code.");
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await api.register(email.trim(), password, otp.trim());
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      onAuthSuccess({ email: data.email, id: data.user_id });
      onClose();
    } catch (err) {
      setError(err.message || "Registration failed. Invalid code or email exists.");
    } finally {
      setLoading(false);
    }
  }

  // 4. Quick Demo Investigator Account
  async function handleQuickDemo() {
    setError('');
    setLoading(true);
    const demoEmail = "investigator.demo@cybercell.gov.in";
    const demoPwd = "DemoPassword2026!";
    try {
      const data = await api.login(demoEmail, demoPwd);
      setToken(data.access_token);
      localStorage.setItem('user_email', data.email);
      onAuthSuccess({ email: data.email, id: data.user_id });
      onClose();
    } catch {
      // If demo user wasn't registered yet in database, register directly via fallback
      try {
        const fallbackData = await api.loginWithGoogle({ email: demoEmail });
        setToken(fallbackData.access_token);
        localStorage.setItem('user_email', fallbackData.email);
        onAuthSuccess({ email: fallbackData.email, id: fallbackData.user_id });
        onClose();
      } catch (err) {
        setError("Demo login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="modal-backdrop fade-in" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '30px 28px' }}
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            margin: '0 auto 10px',
            borderRadius: '12px',
            background: 'var(--green-50)',
            border: '1px solid var(--green-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Lock size={20} color="var(--green-800)" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
            {mode === 'login' ? 'Investigator Sign In' : 'Create Forensic Account'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {mode === 'login' 
              ? 'Enter your credentials to access your cases' 
              : 'Verify your Gmail address with a 5-minute one-time code'}
          </p>
        </div>

        {/* Mode Switcher: Login vs Register */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-subtle)',
          padding: '3px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          gap: '2px'
        }}>
          <button
            type="button"
            className="step-tab"
            onClick={() => switchMode('login')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '7px 4px',
              fontSize: '12px',
              background: mode === 'login' ? 'var(--surface)' : 'transparent',
              color: mode === 'login' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
              fontWeight: mode === 'login' ? 700 : 500
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="step-tab"
            onClick={() => switchMode('register')}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '7px 4px',
              fontSize: '12px',
              background: mode === 'register' ? 'var(--surface)' : 'transparent',
              color: mode === 'register' ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
              fontWeight: mode === 'register' ? 700 : 500
            }}
          >
            Register with Gmail
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="alert-danger" style={{ marginBottom: '14px', fontSize: '12px' }}>
            <ShieldAlert size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Official Google Sign-In Button */}
        <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div ref={googleBtnRef} style={{ width: '100%', minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '8px 0 14px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>Or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* ─── MODE 1: LOGIN (EMAIL + PASSWORD ONLY, NO OTP) ─── */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investigator@cybercell.gov.in"
                  className="input"
                  style={{ paddingLeft: '36px' }}
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              </div>
            </div>

            <div>
              <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: '36px' }}
                />
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '10px', justifyContent: 'center' }}
            >
              <LogIn size={15} />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* ─── MODE 2: REGISTER (CONFIRM GMAIL WITH OTP) ─── */}
        {mode === 'register' && (
          <div>
            {regStep === 'input' ? (
              <form onSubmit={handleSendRegistrationOTP} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                    Gmail / Official Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investigator@gmail.com"
                      className="input"
                      style={{ paddingLeft: '36px' }}
                    />
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  </div>
                </div>

                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                    Create Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="input"
                      style={{ paddingLeft: '36px' }}
                    />
                    <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px', padding: '10px', justifyContent: 'center' }}
                >
                  <Send size={15} />
                  <span>{loading ? 'Sending Code...' : 'Send Confirmation Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {otpNotice && (
                  <div className="alert-success" style={{ fontSize: '12px' }}>
                    <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    <span>{otpNotice}</span>
                  </div>
                )}

                {devOtpHint && (
                  <div style={{
                    background: 'var(--surface-sunken)',
                    border: '1px dashed var(--green-600)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpHint)}
                      className="badge badge-green"
                      style={{ cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    >
                      {devOtpHint} (Auto-Fill)
                    </button>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <label className="label">Enter 6-Digit Code</label>
                    <span className="mono" style={{ fontSize: '11px', color: otpCountdown > 60 ? 'var(--green-700)' : 'var(--pink-600)' }}>
                      ⏱️ Expires in {formatSeconds(otpCountdown)}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="input input-mono"
                    style={{
                      textAlign: 'center',
                      fontSize: '20px',
                      letterSpacing: '8px',
                      fontWeight: 700
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCountdown === 0}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px', padding: '10px', justifyContent: 'center' }}
                >
                  <UserPlus size={15} />
                  <span>{loading ? 'Creating Account...' : 'Confirm OTP & Register'}</span>
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setRegStep('input'); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    Edit details
                  </button>
                  <button
                    type="button"
                    onClick={handleSendRegistrationOTP}
                    style={{ background: 'none', border: 'none', color: 'var(--green-700)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} />
                    <span>Resend OTP</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 1-Click Demo Access */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '18px 0 12px',
          color: 'var(--text-muted)',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>Quick Evaluation</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <button
          type="button"
          onClick={handleQuickDemo}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '8px', justifyContent: 'center', fontSize: '12px' }}
        >
          <span>1-Click Demo Investigator Account</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}


