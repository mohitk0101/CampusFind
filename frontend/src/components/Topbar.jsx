import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { CF } from '../utils/api';
import { useAppContext } from '../context/AppContext';

const Icon = ({ name, size = 19 }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    report: <><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"/>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 10h18c0-2-3-3-3-10"/><path d="M10 22h4"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    chevron: <path d="m7 10 5 5 5-5"/>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5m4-5v5"/></>,
  };
  return <svg {...common}>{paths[name] || paths.home}</svg>;
};

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme, user, logoutUser } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deletingNotificationIds, setDeletingNotificationIds] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchNotifs = async () => {
    if (!CF.isLoggedIn()) return;
    try {
      const data = await CF.apiGet('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* Session restoration handles auth errors. */ }
  };

  useEffect(() => {
    fetchNotifs();
    if (!CF.isLoggedIn()) return undefined;
    const timer = setInterval(fetchNotifs, 20000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  const nav = [
    { to: '/', label: 'Dashboard', icon: 'home' },
    { to: '/create-post', label: 'Report Item', icon: 'report' },
    { to: '/chat', label: 'Messages', icon: 'message' },
    { to: '/my-items', label: 'My Items', icon: 'bookmark' },
  ];

  const handleNotifClick = async (n) => {
    try { await CF.apiPut(`/notifications/${n._id}/read`, {}); } catch { /* no-op */ }
    setNotificationsOpen(false);
    fetchNotifs();
    navigate(n.type === 'message' ? `/chat?post=${n.post}&user=${n.sender}` : `/post-detail?id=${n.post}`);
  };

  const handleMarkAllRead = async () => {
    try { await CF.apiPut('/notifications/read-all', {}); await fetchNotifs(); } catch { /* no-op */ }
  };

  const handleDeleteNotification = async (event, notification) => {
    event.stopPropagation();
    if (deletingNotificationIds.includes(notification._id)) return;

    setDeletingNotificationIds(ids => [...ids, notification._id]);
    try {
      await CF.apiDelete(`/notifications/${notification._id}`);
      setNotifications(current => current.filter(item => item._id !== notification._id));
      if (!notification.isRead) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
    } catch {
      // Keep the notification visible if the server could not delete it.
    } finally {
      setDeletingNotificationIds(ids => ids.filter(id => id !== notification._id));
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logoutUser();
    navigate('/');
  };

  return <>
    <header className="cf-topbar">
      <button className="cf-brand" onClick={() => navigate('/')} aria-label="CampusFind dashboard">
        <span className="cf-brand-mark"><Icon name="search" size={24}/></span>
        <span className="cf-brand-copy"><strong>Campus<span>Find</span></strong><small>NIT KURUKSHETRA</small></span>
      </button>
      <nav className="cf-top-links" aria-label="Main navigation">
        {nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `cf-top-link ${isActive ? 'active' : ''}`}>
          <Icon name={item.icon} size={18}/><span>{item.label}</span>
        </NavLink>)}
        {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `cf-top-link ${isActive ? 'active' : ''}`}><Icon name="shield" size={18}/><span>Admin</span></NavLink>}
      </nav>
      <div className="cf-top-actions">
        <button className="cf-icon-button" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme"><Icon name={isDark ? 'sun' : 'moon'}/></button>
        {user && <div className="cf-notif-wrap">
          <button className="cf-icon-button cf-notification-button" onClick={() => setNotificationsOpen(v => !v)} title="Notifications" aria-label="Notifications"><Icon name="bell"/>{unreadCount > 0 && <span className="cf-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>
          {notificationsOpen && <div className="cf-notif-popover"><div className="cf-notif-head"><strong>Notifications</strong><button onClick={handleMarkAllRead}>Mark all read</button></div><div className="cf-notif-list">{notifications.length ? notifications.map(n => <div key={n._id} className={`cf-notif-row-wrap ${!n.isRead ? 'unread' : ''}`}><button className="cf-notif-row" onClick={() => handleNotifClick(n)}><span>{n.message}</span><small>{CF.timeAgo(n.createdAt)}</small></button><button type="button" className="cf-notif-delete" title="Delete notification" aria-label={`Delete notification: ${n.message}`} disabled={deletingNotificationIds.includes(n._id)} onClick={event => handleDeleteNotification(event, n)}><Icon name="trash" size={15}/></button></div>) : <p className="cf-empty-notif">You're all caught up.</p>}</div></div>}
        </div>}
        {user ? <div className="cf-profile-wrap">
          <button className="cf-avatar-button" onClick={() => setMenuOpen(v => !v)} aria-label="Open profile menu" aria-expanded={menuOpen}>{user.profilePicture ? <img src={user.profilePicture} alt=""/> : CF.getInitials(user.name)}</button>
          <button className="cf-menu-chevron" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle account menu"><Icon name="chevron" size={15}/></button>
          {menuOpen && <div className="cf-profile-menu"><div className="cf-menu-user"><strong>{user.name || 'Campus member'}</strong><small>{user.email || 'CampusFind account'}</small></div><button onClick={() => { setMenuOpen(false); navigate('/profile'); }}><Icon name="user" size={16}/> Profile & security</button>{user.role === 'admin' && <button onClick={() => { setMenuOpen(false); navigate('/admin'); }}><Icon name="shield" size={16}/> Admin panel</button>}<button className="logout-menu-item" onClick={handleLogout}>Log out</button></div>}
        </div> : <button className="cf-signin" onClick={() => navigate('/auth')}>Sign In</button>}
      </div>
    </header>
    {user && <nav className="cf-mobile-nav" aria-label="Mobile navigation">{nav.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `cf-mobile-link ${isActive ? 'active' : ''}`}><Icon name={item.icon} size={19}/><span>{item.label === 'Dashboard' ? 'Dashboard' : item.label === 'Report Item' ? 'Report' : item.label}</span></NavLink>)}</nav>}
  </>;
}
