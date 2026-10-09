import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../Components/Button';
import '../styles/login.css';

/**
 * Login & Authentication Component
 * Converted from login.html, featuring controlled form inputs, React state for auth tabs,
 * client-side validations, password strength meter, quick persona access, and toast alerts.
 */
export default function Login() {
  // ── 1. Tab & View State ──
  // Tabs: 'login' | 'register' | 'forgot' | 'forgot-success'
  const [currentTab, setCurrentTab] = useState('login');
  const [cardShake, setCardShake] = useState(false);

  // ── 2. Toast State ──
  const [toast, setToast] = useState({ show: false, icon: '✅', msg: '' });

  const showToast = (icon, msg) => {
    setToast({ show: true, icon, msg });
    setTimeout(() => {
      setToast({ show: false, icon: '✅', msg: '' });
    }, 3000);
  };

  const triggerShake = () => {
    setCardShake(true);
    setTimeout(() => setCardShake(false), 450);
  };

  // ── 3. Login Form State & Validation ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  const validateLogin = () => {
    const errors = {};
    const trimmedInput = loginEmail.trim();

    if (!trimmedInput) {
      errors.email = 'Email or username is required.';
    } else if (trimmedInput.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!loginPassword) {
      errors.password = 'Password is required.';
    } else if (loginPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!loginRole) {
      errors.role = 'Please select a role to sign in as.';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!validateLogin()) {
      triggerShake();
      showToast('⚠️', 'Please correct the highlighted errors.');
      return;
    }

    setLoginLoading(true);

    // Simulate login response
    setTimeout(() => {
      setLoginLoading(false);
      showToast('✅', `Signed in successfully as ${loginRole.toUpperCase()}!`);
    }, 1000);
  };

  // ── 4. Quick Persona Login Handler ──
  const personas = [
    { name: 'RAJAT JAIN (ADMIN)', username: 'rajat', role: 'admin', icon: '🛡️', pass: 'Rajat@123' },
    { name: 'KARMANYA (MOD)', username: 'karmanya', role: 'moderator', icon: '🔍', pass: 'Karmanya@123' },
    { name: 'ANANT (CM)', username: 'anant', role: 'community_manager', icon: '📅', pass: 'Demo@123' },
    { name: 'ORGANIZER (ORG)', username: 'org01', role: 'organizer', icon: '🏆', pass: 'Demo@123' },
    { name: 'AWADHESH (USER)', username: 'awadhesh', role: 'user', icon: '🎮', pass: 'Demo@123' },
    { name: 'SANIDHYA (OWNER)', username: 'sanidhya', role: 'owner', icon: '👑', pass: 'Demo@123' },
  ];

  const handleQuickLogin = (p) => {
    setCurrentTab('login');
    setLoginEmail(p.username);
    setLoginPassword(p.pass);
    setLoginRole(p.role);
    setLoginErrors({});
    showToast('⚡', `Loaded credentials for ${p.name}`);
  };

  // ── 5. Register Form State & Validation ──
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('user');
  const [regTerms, setRegTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { level: '', label: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*]/.test(pass)) score++;

    const levels = ['', 'weak', 'fair', 'good', 'strong'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { level: levels[score] || 'weak', label: labels[score] || 'Weak' };
  };

  const strength = getPasswordStrength(regPassword);

  const validateRegister = () => {
    const errors = {};
    if (!regFullName.trim()) errors.fullName = 'Full Name is required.';
    if (!regEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!regHandle.trim()) {
      errors.handle = 'Username handle is required.';
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(regHandle.trim())) {
      errors.handle = 'Handle must be 3-20 characters (letters, numbers, underscores).';
    }

    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (regPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (regPassword !== regConfirm) {
      errors.confirm = 'Passwords do not match.';
    }

    if (!regRole) {
      errors.role = 'Please select an account type.';
    }

    if (!regTerms) {
      errors.terms = 'You must accept the Terms of Service to proceed.';
    }

    setRegErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!validateRegister()) {
      triggerShake();
      showToast('⚠️', 'Please complete all required registration fields.');
      return;
    }

    setRegLoading(true);
    setTimeout(() => {
      setRegLoading(false);
      showToast('🎉', 'Account created successfully! Switching to login...');
      setTimeout(() => {
        setCurrentTab('login');
        setLoginEmail(regHandle);
        setLoginPassword(regPassword);
      }, 1000);
    }, 1200);
  };

  // ── 6. Forgot Password State ──
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      triggerShake();
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setCurrentTab('forgot-success');
    }, 900);
  };

  return (
    <div className="login-page-container" style={{ minHeight: '100vh', width: '100%', position: 'relative', overflowX: 'hidden', overflowY: 'auto' }}>
      {/* Back to Home Link */}
      <Link
        to="/landing"
        style={{
          position: 'absolute',
          top: '32px',
          left: '40px',
          color: 'var(--text-muted, #888)',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: "'Syne', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 50,
          transition: 'color 0.2s ease',
        }}
        title="Return to Landing Page"
      >
        <span style={{ fontSize: '18px' }}>←</span> Back to Home
      </Link>

      {/* Ambient Glow */}
      <div className="ambient-glow"></div>

      {/* Main Login Wrapper */}
      <div className="login-wrapper">
        <div className={`login-card ${cardShake ? 'shake' : ''}`} id="loginCard">
          {/* Logo */}
          <div className="login-logo">
            <div className="logo-hex">G</div>
            <span className="logo-text">Gameunity</span>
          </div>

          {/* Subtitle */}
          {currentTab === 'login' && (
            <p className="login-subtitle">Welcome back! Sign in to your account.</p>
          )}
          {currentTab === 'register' && (
            <p className="login-subtitle">Create a free account to get started.</p>
          )}

          {/* Tab Switcher (Visible on login / register tabs) */}
          {(currentTab === 'login' || currentTab === 'register') && (
            <div className="auth-tabs" id="authTabs">
              <button
                type="button"
                className={`auth-tab ${currentTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('login');
                  setLoginErrors({});
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`auth-tab ${currentTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentTab('register');
                  setRegErrors({});
                }}
              >
                Register
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════
             LOGIN FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'login' && (
            <form className="auth-form" onSubmit={handleLoginSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email or Username
                </label>
                <input
                  className={`form-input ${loginErrors.email ? 'error' : ''}`}
                  type="text"
                  id="login-email"
                  placeholder="Enter your email or username"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  autoComplete="username"
                  required
                />
                {loginErrors.email && (
                  <span className="form-error visible">{loginErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${loginErrors.password ? 'error' : ''}`}
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {loginErrors.password && (
                  <span className="form-error visible">{loginErrors.password}</span>
                )}
              </div>

              <div className="form-row">
                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentTab('forgot');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Role Selector */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-role">
                  Sign in as
                </label>
                <select
                  className={`form-input form-select ${loginErrors.role ? 'error' : ''}`}
                  id="login-role"
                  value={loginRole}
                  onChange={(e) => {
                    setLoginRole(e.target.value);
                    if (loginErrors.role) setLoginErrors((prev) => ({ ...prev, role: '' }));
                  }}
                  required
                >
                  <option value="">Select your role</option>
                  <option value="admin">🛡️ System Admin</option>
                  <option value="owner">👑 Platform Owner</option>
                  <option value="community_manager">📅 Community Manager</option>
                  <option value="organizer">🏆 Organizer</option>
                  <option value="moderator">🔍 Moderator</option>
                  <option value="user">🎮 User</option>
                </select>
                {loginErrors.role && (
                  <span className="form-error visible">{loginErrors.role}</span>
                )}
              </div>

              <Button
                type="submit"
                className={`btn-submit ${loginLoading ? 'loading' : ''}`}
                id="login-btn"
                disabled={loginLoading}
              >
                <span className="btn-text">Sign in</span>
                {loginLoading && <span className="btn-spinner"></span>}
              </Button>

              {/* Quick Persona Access */}
              <div className="demo-personas">
                <span className="demo-label">Quick access:</span>
                {personas.map((p) => (
                  <button
                    key={p.username}
                    type="button"
                    className="demo-pill"
                    onClick={() => handleQuickLogin(p)}
                  >
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>

              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={() => showToast('🌐', 'Google Authentication simulated for demo')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.252-.164-1.842H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════
             REGISTER FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegisterSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-fullname">
                  Full Name
                </label>
                <input
                  className={`form-input ${regErrors.fullName ? 'error' : ''}`}
                  type="text"
                  id="reg-fullname"
                  placeholder="Enter your full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
                {regErrors.fullName && (
                  <span className="form-error visible">{regErrors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  className={`form-input ${regErrors.email ? 'error' : ''}`}
                  type="email"
                  id="reg-email"
                  placeholder="Enter your email address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                {regErrors.email && (
                  <span className="form-error visible">{regErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-handle">
                  Username / Handle
                </label>
                <input
                  className={`form-input ${regErrors.handle ? 'error' : ''}`}
                  type="text"
                  id="reg-handle"
                  placeholder="Choose a unique handle"
                  value={regHandle}
                  onChange={(e) => setRegHandle(e.target.value)}
                  required
                />
                {regErrors.handle && (
                  <span className="form-error visible">{regErrors.handle}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">
                  Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${regErrors.password ? 'error' : ''}`}
                    type={showRegPassword ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Create a strong password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {regErrors.password && (
                  <span className="form-error visible">{regErrors.password}</span>
                )}

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="password-strength" id="password-strength">
                    <div className="strength-bar">
                      <div className={`strength-fill ${strength.level}`}></div>
                    </div>
                    <span className="strength-text">{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">
                  Confirm Password
                </label>
                <div className="input-password-wrap">
                  <input
                    className={`form-input ${regErrors.confirm ? 'error' : ''}`}
                    type={showRegConfirm ? 'text' : 'password'}
                    id="reg-confirm"
                    placeholder="Confirm your password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegConfirm((prev) => !prev)}
                    aria-label="Toggle password visibility"
                  >
                    {showRegConfirm ? '👁️' : '🙈'}
                  </button>
                </div>
                {regErrors.confirm && (
                  <span className="form-error visible">{regErrors.confirm}</span>
                )}
              </div>

              {/* Account Type */}
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">
                  Account Type
                </label>
                <select
                  className="form-input form-select"
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  required
                >
                  <option value="user">🎮 User</option>
                  <option value="moderator">🔍 Moderator</option>
                  <option value="organizer">🏆 Organizer</option>
                </select>
              </div>

              <label className="checkbox-wrap terms-check">
                <input
                  type="checkbox"
                  id="reg-terms"
                  checked={regTerms}
                  onChange={(e) => setRegTerms(e.target.checked)}
                  required
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">
                  I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
                </span>
              </label>
              {regErrors.terms && (
                <span className="form-error visible" style={{ marginBottom: '12px', display: 'block' }}>
                  {regErrors.terms}
                </span>
              )}

              <Button
                type="submit"
                className={`btn-submit ${regLoading ? 'loading' : ''}`}
                id="register-btn"
                disabled={regLoading}
              >
                <span className="btn-text">Create Account</span>
                {regLoading && <span className="btn-spinner"></span>}
              </Button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn-google"
                onClick={() => showToast('🌐', 'Google registration simulated for demo')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.252-.164-1.842H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.614z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.462.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════
             FORGOT PASSWORD FORM
          ═══════════════════════════════════════ */}
          {currentTab === 'forgot' && (
            <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="forgot-icon-wrap">
                <div className="forgot-icon">🔒</div>
              </div>
              <h2 className="forgot-title">Forgot Password</h2>
              <p className="forgot-desc">Enter your email address and we'll send you a link to reset your password.</p>

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">
                  Email Address
                </label>
                <input
                  className={`form-input ${forgotError ? 'error' : ''}`}
                  type="email"
                  id="forgot-email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    if (forgotError) setForgotError('');
                  }}
                  required
                />
                {forgotError && <span className="form-error visible">{forgotError}</span>}
              </div>

              <Button
                type="submit"
                className={`btn-submit ${forgotLoading ? 'loading' : ''}`}
                id="forgot-btn"
                disabled={forgotLoading}
              >
                <span className="btn-text">Send Reset Link</span>
                {forgotLoading && <span className="btn-spinner"></span>}
              </Button>

              <a
                href="#back-to-login"
                className="back-to-login"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('login');
                }}
              >
                ← Back to login
              </a>
            </form>
          )}

          {/* ═══════════════════════════════════════
             FORGOT PASSWORD SUCCESS STATE
          ═══════════════════════════════════════ */}
          {currentTab === 'forgot-success' && (
            <div className="auth-form" id="form-forgot-success">
              <div className="success-icon-wrap">
                <div className="success-icon">✉️</div>
              </div>
              <h2 className="forgot-title">Check Your Email</h2>
              <p className="forgot-desc">
                We've sent a password reset link to <strong>{forgotEmail}</strong>. Please check your inbox and follow
                the instructions.
              </p>
              <a
                href="#back-to-login"
                className="back-to-login"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('login');
                }}
              >
                ← Back to login
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''}`} id="toast">
        <span id="toastIcon">{toast.icon}</span>
        <span id="toastMsg">{toast.msg}</span>
      </div>
    </div>
  );
}

