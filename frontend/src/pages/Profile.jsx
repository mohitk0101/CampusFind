import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

const ALL_CATEGORIES = [
  { name: 'Wallet',            icon: '👛' },
  { name: 'ID Card',           icon: '🪪' },
  { name: 'Electronics',       icon: '📱' },
  { name: 'Calculator',        icon: '🧮' },
  { name: 'Laptop Charger',    icon: '🔌' },
  { name: 'Books',             icon: '📚' },
  { name: 'Earbuds',           icon: '🎧' },
  { name: 'Keys',              icon: '🔑' },
  { name: 'Water Bottle',      icon: '🧴' },
  { name: 'Bag',               icon: '🎒' },
  { name: 'Watch',             icon: '⌚' },
  { name: 'Clothes',           icon: '👕' },
  { name: 'Sports Equipment',  icon: '⚽' },
  { name: 'Bicycle',           icon: '🚲' },
  { name: 'Documents',         icon: '📄' },
  { name: 'Others',            icon: '📦' },
];

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // -- Profile fields --
  const [user, setUser] = useState(CF.getUser());
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [mobile, setMobile] = useState('');
  const [year, setYear] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // -- Password fields --
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // -- Notification category preferences --
  const [interestedCategories, setInterestedCategories] = useState(
    ALL_CATEGORIES.map(c => c.name) // default all ON
  );
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  useEffect(() => {
    if (!CF.isLoggedIn()) { navigate('/auth'); return; }

    const loadProfile = async () => {
      try {
        const data = await CF.apiGet('/auth/me');
        const u = data.user;
        setUser(u);
        setName(u.name || '');
        setDepartment(u.department || '');
        setMobile(u.mobile || '');
        setYear(u.year || '');
        setProfilePicture(u.profilePicture || '');
        if (u.interestedCategories && u.interestedCategories.length > 0) {
          setInterestedCategories(u.interestedCategories);
        }
      } catch (e) { console.error(e); }
    };
    loadProfile();
  }, []);

  const handleProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const b64 = await CF.fileToBase64(file);
      setProfilePicture(b64);
    } catch (err) { alert(err.message); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Full name is required.');
    setIsSavingProfile(true);
    try {
      const data = await CF.apiPut('/auth/profile', { name, department, mobile, year, profilePicture });
      CF.setAuth(CF.getToken(), data.user);
      setUser(data.user);
      alert('Profile updated successfully!');
    } catch (err) { alert(err.message); }
    setIsSavingProfile(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return alert('All fields are required.');
    if (newPassword.length < 6) return alert('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return alert('Passwords do not match.');
    setIsSavingPass(true);
    try {
      await CF.apiPut('/auth/change-password', { currentPassword, newPassword, confirmPassword });
      alert('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { alert(err.message); }
    setIsSavingPass(false);
  };

  const toggleCategory = (name) => {
    setInterestedCategories(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleSaveNotifs = async (e) => {
    e.preventDefault();
    setIsSavingNotifs(true);
    try {
      const data = await CF.apiPut('/auth/profile', { interestedCategories });
      CF.setAuth(CF.getToken(), data.user);
      alert('Notification categories saved!');
    } catch (err) { alert(err.message); }
    setIsSavingNotifs(false);
  };

  const tabs = [
    { key: 'profile',       label: '👤 Edit Profile' },
    { key: 'notifications', label: '🔔 Notifications' },
    { key: 'password',      label: '🔑 Change Password' },
  ];

  const tabStyle = (key) => ({
    padding: '12px 4px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    color: activeTab === key ? 'var(--primary-light)' : 'var(--text-muted)',
    borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
    marginBottom: '-1px',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title="My Profile" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="page-body" style={{ maxWidth: '760px' }}>

          {/* Profile header card */}
          <div className="profile-header-card" style={{ marginBottom: '24px' }}>
            <div
              className="profile-avatar-lg"
              onClick={() => document.getElementById('profile-pic-input').click()}
              title="Click to change photo"
            >
              {profilePicture
                ? <img src={profilePicture} alt="avatar" />
                : <span>{CF.getInitials(name)}</span>
              }
            </div>
            <input type="file" id="profile-pic-input" accept="image/*" style={{ display: 'none' }} onChange={handleProfileImage} />
            <div className="profile-info">
              <div className="profile-name">{user?.name || 'Loading...'}</div>
              <div className="profile-meta">
                <span>{user?.email}</span>
                <span>Roll: {user?.rollNumber}</span>
                {user?.department && <span>{user.department}</span>}
                {user?.year && <span>Year {user.year}</span>}
              </div>
              <div className="verified-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginTop: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                Verified Student
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '24px', overflowX: 'auto' }}>
            {tabs.map(t => (
              <div key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </div>
            ))}
          </div>

          {/* --- Edit Profile Tab --- */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="card">
              <div className="card-body">
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your full name"
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
                      value={user?.rollNumber || ''}
                      disabled
                      style={{ opacity: 0.55, cursor: 'not-allowed' }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Roll number cannot be changed.</p>
                  </div>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Department / Branch</label>
                    <select className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)}>
                      <option value="">Select Department</option>
                      {['Computer Engineering','Electronics & Communication','Electrical Engineering','Mechanical Engineering','Civil Engineering','Chemical Engineering','Information Technology','Production & Industrial','Biotechnology','Mathematics','Physics','Chemistry','Humanities','Management Studies'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select className="form-control" value={year} onChange={(e) => setYear(e.target.value)}>
                      <option value="">Select Year</option>
                      {['1','2','3','4','5'].map(y => (
                        <option key={y} value={y}>{y}{y==='1'?'st':y==='2'?'nd':y==='3'?'rd':'th'} Year</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number (optional)</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +91 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{ maxWidth: '280px' }}
                  />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                  {isSavingProfile ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* --- Notification Categories Tab --- */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifs} className="card">
              <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <div className="card-title" style={{ fontWeight: 700, fontSize: '15px' }}>🔔 Item Category Notifications</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  You will receive notifications when a new post is approved in your selected categories. All posts are still visible on the dashboard.
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setInterestedCategories(ALL_CATEGORIES.map(c => c.name))}
                  >
                    ✅ Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setInterestedCategories([])}
                  >
                    ☐ Deselect All
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {ALL_CATEGORIES.map((cat, i) => {
                  const isOn = interestedCategories.includes(cat.name);
                  return (
                    <div
                      key={cat.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 4px',
                        borderBottom: i < ALL_CATEGORIES.length - 2 ? '1px solid var(--border)' : 'none',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{cat.icon}</span>
                        <span style={{ fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)' }}>{cat.name}</span>
                      </div>
                      {/* Toggle switch */}
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggleCategory(cat.name)}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                        />
                        <span style={{
                          position: 'absolute', inset: 0,
                          background: isOn ? 'var(--primary)' : 'var(--bg-elevated)',
                          border: `1px solid ${isOn ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '9999px',
                          transition: 'background 0.2s ease',
                        }}>
                          <span style={{
                            width: '18px', height: '18px',
                            background: 'white',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: isOn ? '22px' : '2px',
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                          }} />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 24px', background: 'rgba(99,102,241,0.06)', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 {interestedCategories.length === 0
                  ? 'No categories selected — you will not receive new post notifications.'
                  : `You will be notified for ${interestedCategories.length} of ${ALL_CATEGORIES.length} categories.`
                }
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingNotifs}>
                  {isSavingNotifs ? '⏳ Saving...' : '🔔 Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* --- Change Password Tab --- */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="card">
              <div className="card-body">
                {[
                  { label: 'Current Password', val: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
                  { label: 'New Password',     val: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(p => !p),     placeholder: 'At least 6 characters' },
                  { label: 'Confirm New Password', val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(p => !p), placeholder: 'Repeat your new password' },
                ].map((f) => (
                  <div className="form-group" key={f.label}>
                    <label className="form-label">{f.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={f.show ? 'text' : 'password'}
                        className="form-control"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        placeholder={f.placeholder || ''}
                        style={{ paddingRight: '40px' }}
                        required
                      />
                      <span
                        onClick={f.toggle}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', userSelect: 'none', fontSize: '16px' }}
                      >
                        {f.show ? '🙈' : '👁️'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingPass}>
                  {isSavingPass ? '⏳ Saving...' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </>
  );
}
