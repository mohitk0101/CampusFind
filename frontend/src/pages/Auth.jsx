import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) return alert('Please enter both email and password.');
    setIsLoading(true);
    try {
      const data = await CF.apiPost('/auth/login', { email, password });
      CF.setAuth(data.token, data.user);
      setIsLoading(false);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      alert(err.message);
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    if (!name || !rollNumber || !email || !password || !confirmPassword) {
      return alert('All fields are required.');
    }
    if (password.length < 6) return alert('Password must be at least 6 characters.');
    if (password !== confirmPassword) return alert('Passwords do not match.');
    setIsLoading(true);
    try {
      await CF.apiPost('/auth/register', { name, rollNumber, email, password, confirmPassword });
      setTab('check-email');
      setIsLoading(false);
    } catch (err) {
      alert(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob auth-blob-1" />
        <div className="auth-blob auth-blob-2" />
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">🔍</div>
          <h1 className="auth-title">CampusFind</h1>
          <p className="auth-subtitle">NIT Kurukshetra Lost & Found Platform</p>
        </div>

        <div className="auth-card">
          {tab !== 'check-email' && (
            <div className="auth-tabs">
              <div 
                className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => setTab('login')}
              >
                Sign In
              </div>
              <div 
                className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => setTab('signup')}
              >
                Sign Up
              </div>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">College Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="124102101@nitkkr.ac.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showLoginPass ? 'text' : 'password'} 
                    className="form-control" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <span 
                    onClick={() => setShowLoginPass(!showLoginPass)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none', fontSize: '16px' }}
                  >
                    {showLoginPass ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={isLoading}>
                {isLoading ? '⏳ Signing In...' : '🔐 Sign In'}
              </button>
              <div className="auth-divider">or</div>
              <p className="text-center text-sm text-muted">
                Don't have an account?{' '}
                <span className="auth-link" onClick={() => setTab('signup')}>Sign Up</span>
              </p>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSignup}>
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Rahul Sharma" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="124102101" 
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">College Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="124102101@nitkkr.ac.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="form-hint">Must be your official @nitkkr.ac.in email</div>
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showSignupPass ? 'text' : 'password'} 
                    className="form-control" 
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <span 
                    onClick={() => setShowSignupPass(!showSignupPass)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none', fontSize: '16px' }}
                  >
                    {showSignupPass ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showSignupConfirm ? 'text' : 'password'} 
                    className="form-control" 
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <span 
                    onClick={() => setShowSignupConfirm(!showSignupConfirm)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none', fontSize: '16px' }}
                  >
                    {showSignupConfirm ? '🙈' : '👁️'}
                  </span>
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={isLoading}>
                {isLoading ? '⏳ Creating Account...' : '🚀 Create Account'}
              </button>
              <div className="auth-divider">or</div>
              <p className="text-center text-sm text-muted">
                Already have an account?{' '}
                <span className="auth-link" onClick={() => setTab('login')}>Sign In</span>
              </p>
            </form>
          )}

          {tab === 'check-email' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📧</div>
              <div className="auth-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Check Your Email</div>
              <p className="text-muted text-sm" style={{ marginBottom: '20px' }}>
                We have sent a verification link to your official college email. Please check your inbox (and spam folder) and verify your account to log in.
              </p>
              <div style={{ marginTop: '12px' }}>
                <span className="auth-link" onClick={() => setTab('login')} style={{ cursor: 'pointer' }}>← Back to Sign In</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
