import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CF } from '../utils/api';

export default function Topbar({ title, onToggleSidebar, onSearchChange }) {
  const navigate = useNavigate();
  const location = useLocation();
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
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search lost & found items..." 
              value={searchVal}
              onChange={handleSearchInput}
              autoComplete="off"
            />
          </div>
        )}

        <div className="topbar-actions" style={{ marginLeft: onSearchChange === undefined ? 'auto' : '0' }}>
          {CF.isLoggedIn() && (
            <button className="icon-btn" onClick={() => setIsOpen(!isOpen)} title="Notifications">
              🔔
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
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
                  >
                    🗑️
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
