import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CF } from '../utils/api';
import { useAppContext } from '../context/AppContext';

export default function Topbar({ title, onToggleSidebar, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const fetchNotifs = async () => {
    if (!CF.isLoggedIn()) return;
    try {
      const data = await CF.apiGet('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await CF.apiPut('/notifications/read-all', {});
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      await CF.apiPut(`/notifications/${notif._id}/read`, {});
      setIsOpen(false);
      fetchNotifs();
      if (notif.type === 'message') {
        navigate(`/chat?post=${notif.post}&user=${notif.sender}`);
      } else {
        navigate(`/post-detail?id=${notif.post}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await CF.apiDelete(`/notifications/${id}`);
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchInput = (e) => {
    setSearchVal(e.target.value);
    if (onSearchChange) onSearchChange(e.target.value);
  };

  return (
    <>
      <div className="topbar">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>☰</button>
        <div className="topbar-title">{title}</div>
        
        {onSearchChange !== undefined && (
          <div className="topbar-search">
            <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search lost & found items..." 
              value={searchVal}
              onChange={handleSearchInput}
              autoComplete="off"
            />
          </div>
        )}

        <div className="topbar-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {CF.isLoggedIn() && (
            <>
              <button 
                className="icon-btn theme-toggle-btn" 
                onClick={toggleTheme} 
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '6px' }}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>

              <button 
                className="icon-btn" 
                onClick={() => setIsOpen(!isOpen)} 
                title="Notifications"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '6px', position: 'relative' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="notif-panel active">
          <div className="notif-header">
            <span className="font-bold">Notifications</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>Mark all read</button>
              <button className="icon-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n._id} 
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotifClick(n)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="notif-title" style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.4' }}>{n.message}</div>
                    <div className="notif-time">{CF.timeAgo(n.createdAt)}</div>
                  </div>
                  <button 
                    className="notif-delete-btn"
                    onClick={(e) => handleDeleteNotif(e, n._id)}
                    title="Delete notification"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
