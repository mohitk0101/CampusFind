import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CF } from '../utils/api';
import { useAppContext } from '../context/AppContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser } = useAppContext();
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      if (!CF.isLoggedIn() || !CF.getUser()) return;
      try {
        const data = await CF.apiGet('/messages/conversations');
        const total = (data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMsg(total);
      } catch (e) {
        // silent — don't spam console on auth errors
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logoutUser();
      navigate('/auth');
    }
  };

  const navTo = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  if (!CF.isLoggedIn()) return null;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">CampusFind</div>
            <div className="brand-sub">NIT Kurukshetra</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          <div className={`nav-item ${isActive('/') ? 'active' : ''}`} onClick={() => navTo('/')}>
            Dashboard
          </div>
          <div className={`nav-item ${isActive('/create-post') ? 'active' : ''}`} onClick={() => navTo('/create-post')}>
            Report Item
          </div>
          <div className={`nav-item ${isActive('/chat') ? 'active' : ''}`} onClick={() => navTo('/chat')}>
            Messages
            {unreadMsg > 0 && (
              <span className="nav-badge nav-msg-badge">{unreadMsg > 9 ? '9+' : unreadMsg}</span>
            )}
          </div>

          <div className="nav-section-label">My Account</div>
          <div className={`nav-item ${isActive('/profile') ? 'active' : ''}`} onClick={() => navTo('/profile')}>
            Profile
          </div>
          <div className={`nav-item ${isActive('/my-items') ? 'active' : ''}`} onClick={() => navTo('/my-items')}>
            My Items
          </div>

          {user && user.role === 'admin' && (
            <div className={`nav-item ${isActive('/admin') ? 'active' : ''}`} onClick={() => navTo('/admin')}>
              Admin Panel
            </div>
          )}

          <div className="nav-item" onClick={handleLogout}>
            Logout
          </div>
        </nav>
        
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user" style={{ display: 'flex', cursor: 'pointer' }} onClick={() => navTo('/profile')}>
              <div className="sidebar-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} />
                ) : (
                  CF.getInitials(user.name)
                )}
              </div>
              <div className="sidebar-user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role === 'admin' ? 'Admin' : `@${user.rollNumber}`}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
