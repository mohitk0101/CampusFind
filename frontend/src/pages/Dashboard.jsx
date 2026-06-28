import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import PostCard from '../components/PostCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(CF.isLoggedIn());
  const [user, setUser] = useState(CF.getUser());
  
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('');
  const [filterSort, setFilterSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Landing page state variables
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [activeNav, setActiveNav] = useState('home');

  const fetchStats = async () => {
    try {
      const data = await CF.apiGet('/posts/dashboard-stats');
      setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const buildQueryString = (pageNo = 1) => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterCategory) params.set('category', filterCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (filterSort) params.set('sort', filterSort);
    if (filterDateRange) {
      const now = new Date();
      let dateFrom;
      if (filterDateRange === 'today') dateFrom = new Date(now.setHours(0,0,0,0));
      else if (filterDateRange === 'week') dateFrom = new Date(now - 7*86400000);
      else if (filterDateRange === 'month') dateFrom = new Date(now - 30*86400000);
      if (dateFrom) params.set('dateFrom', dateFrom.toISOString());
    }
    params.set('page', pageNo);
    params.set('limit', 12);
    return params.toString();
  };

  const fetchPosts = async (append = false) => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const pageNo = append ? currentPage + 1 : 1;
      const data = await CF.apiGet(`/posts?${buildQueryString(pageNo)}`);
      setTotalPages(data.pages);
      setTotalPosts(data.total);
      if (append) {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setCurrentPage(pageNo);
      } else {
        setPosts(data.posts || []);
        setCurrentPage(1);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoggedIn(CF.isLoggedIn());
    setUser(CF.getUser());
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchPosts(false);
    } else {
      fetchStats();
    }
  }, [isLoggedIn, filterType, filterCategory, filterDateRange, filterSort, searchQuery]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      return alert('Please fill in Name, Email, and Message fields.');
    }
    setIsSendingContact(true);
    setTimeout(() => {
      alert(`Thank you, ${contactName}! Your message has been sent successfully.`);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setIsSendingContact(false);
    }, 1000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveNav(id);
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val.trim());
  };

  const handleLoadMore = () => {
    fetchPosts(true);
  };

  const getFirstName = () => {
    if (!user || !user.name) return '';
    return user.name.split(' ')[0];
  };

  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        {/* Navigation Header */}
        <header className="landing-nav">
          <div className="landing-logo" onClick={() => scrollToSection('home')}>
            CampusFind
          </div>
          <nav className="landing-nav-links">
            <span className={`landing-nav-link ${activeNav === 'home' ? 'active' : ''}`} onClick={() => scrollToSection('home')}>Home</span>
            <span className={`landing-nav-link ${activeNav === 'how-it-works' ? 'active' : ''}`} onClick={() => scrollToSection('how-it-works')}>How It Works</span>
            <span className={`landing-nav-link ${activeNav === 'about-us' ? 'active' : ''}`} onClick={() => scrollToSection('about-us')}>About Us</span>
            <span className={`landing-nav-link ${activeNav === 'contact-us' ? 'active' : ''}`} onClick={() => scrollToSection('contact-us')}>Contact</span>
            <button className="landing-nav-btn" onClick={() => navigate('/auth')}>Sign In</button>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="landing-section" id="home" style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh', justifyContent: 'center', alignItems: 'center' }}>
          <div className="landing-hero-card">
            <div className="landing-hero-badge">🎓 Exclusive for NIT Kurukshetra Students</div>
            <h1 className="landing-hero-title">Find What You Lost.<br /><span>Return What You Found.</span></h1>
            <p className="landing-hero-desc">CampusFind is a secure platform where NITKKR students can report lost items, post found belongings, and connect safely to recover them.</p>
            <div className="landing-hero-cta">
              <button onClick={() => navigate('/auth?tab=signup')} className="btn btn-primary btn-lg" style={{ cursor: 'pointer' }}>🚀 Get Started</button>
              <button onClick={() => navigate('/auth')} className="btn btn-ghost btn-lg" style={{ cursor: 'pointer', marginLeft: '12px' }}>🔐 Sign In</button>
            </div>
          </div>

          <div className="stats-grid" style={{ width: '100%', maxWidth: '960px', marginTop: '20px' }}>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔐</div>
              <div className="font-bold text-sm" style={{ color: '#ffffff', marginBottom: '4px' }}>Verified Students Only</div>
              <div className="text-xs text-muted">Secure platform for NITKKR students</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛡️</div>
              <div className="font-bold text-sm" style={{ color: '#ffffff', marginBottom: '4px' }}>Admin Approved Posts</div>
              <div className="text-xs text-muted">All posts are reviewed by admin</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
              <div className="font-bold text-sm" style={{ color: '#ffffff', marginBottom: '4px' }}>Secure Messaging</div>
              <div className="text-xs text-muted">Connect safely with fellow students</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
              <div className="font-bold text-sm" style={{ color: '#ffffff', marginBottom: '4px' }}>Smart Notifications</div>
              <div className="text-xs text-muted">Get instant updates on your posts</div>
            </div>
          </div>

          <div className="landing-stats-row" style={{ width: '100%', maxWidth: '960px' }}>
            <div className="landing-stat-item">
              <div className="landing-stat-num">{stats ? stats.totalLost : 120}+</div>
              <div className="landing-stat-label">Lost Items</div>
            </div>
            <div className="landing-stat-item">
              <div className="landing-stat-num">{stats ? stats.totalFound : 95}+</div>
              <div className="landing-stat-label">Found Items</div>
            </div>
            <div className="landing-stat-item">
              <div className="landing-stat-num">{stats ? stats.totalResolved : 80}+</div>
              <div className="landing-stat-label">Successful Returns</div>
            </div>
            <div className="landing-stat-item">
              <div className="landing-stat-num">500+</div>
              <div className="landing-stat-label">Happy Students</div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="landing-section" id="how-it-works">
          <h2 className="landing-title">How It Works</h2>
          <p className="landing-subtitle">A simple 5-step process to help you recover lost items.</p>

          <div className="landing-steps-grid">
            <div className="landing-step-card">
              <div className="landing-step-num">1</div>
              <div className="landing-step-icon">👤</div>
              <h4 className="landing-step-title">Sign In</h4>
              <p className="landing-step-desc">Sign in using your NITKKR email to get started.</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-num">2</div>
              <div className="landing-step-icon">📝</div>
              <h4 className="landing-step-title">Create a Post</h4>
              <p className="landing-step-desc">Create a Lost or Found post with item details.</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-num">3</div>
              <div className="landing-step-icon">🛡️</div>
              <h4 className="landing-step-title">Admin Review</h4>
              <p className="landing-step-desc">Admin reviews and approves the post for authenticity.</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-num">4</div>
              <div className="landing-step-icon">🔍</div>
              <h4 className="landing-step-title">Find & Connect</h4>
              <p className="landing-step-desc">Students browse posts and find matching items.</p>
            </div>
            <div className="landing-step-card">
              <div className="landing-step-num">5</div>
              <div className="landing-step-icon">🤝</div>
              <h4 className="landing-step-title">Return & Recover</h4>
              <p className="landing-step-desc">Connect securely, return the item, spread happiness!</p>
            </div>
          </div>

          <div className="landing-safety-banner">
            <div className="landing-safety-icon">🔒</div>
            <div className="landing-safety-text">Your safety is our priority. All users are verified, all posts are reviewed, and all conversations are secure.</div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="landing-section" id="about-us">
          <h2 className="landing-title">About Us</h2>
          <p className="landing-subtitle">Built exclusively to assist students of NIT Kurukshetra.</p>

          <div className="landing-about-container">
            <div>
              <p className="landing-about-text">
                CampusFind is a secure Lost & Found platform built exclusively for NIT Kurukshetra students. It helps students report lost belongings, share found items, and connect safely to recover their valuables. Our goal is to make the process of finding and returning lost items simple, reliable, and trustworthy within our campus community.
              </p>
              <div className="landing-about-values">
                <div className="landing-about-value-item">
                  <div className="landing-about-value-icon">🛡️</div>
                  <div>
                    <h5 className="landing-about-value-title">Safe & Secure</h5>
                    <p className="landing-about-value-desc">Only verified NITKKR students can access the platform.</p>
                  </div>
                </div>
                <div className="landing-about-value-item">
                  <div className="landing-about-value-icon">🤝</div>
                  <div>
                    <h5 className="landing-about-value-title">Trusted Community</h5>
                    <p className="landing-about-value-desc">Admin-approved posts to ensure authenticity.</p>
                  </div>
                </div>
                <div className="landing-about-value-item">
                  <div className="landing-about-value-icon">⚡</div>
                  <div>
                    <h5 className="landing-about-value-title">Quick & Efficient</h5>
                    <p className="landing-about-value-desc">Designed to help students recover items faster.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-about-img">
              <img src="/nitkkr_admin.png" alt="NIT Kurukshetra Administration Building" />
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="landing-section" id="contact-us">
          <h2 className="landing-title">Contact Us</h2>
          <p className="landing-subtitle">We're here to help! Reach out to us for any queries or support.</p>

          <div className="landing-contact-container">
            <div className="landing-contact-info-card">
              <h4>Get in Touch</h4>
              <div className="landing-contact-items">
                <div className="landing-contact-item">
                  <div className="landing-contact-icon">📧</div>
                  <div>
                    <div className="landing-contact-label">Email</div>
                    <div className="landing-contact-value"><a href="mailto:mkmkbhojawas@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>mkmkbhojawas@gmail.com</a></div>
                  </div>
                </div>
                <div className="landing-contact-item">
                  <div className="landing-contact-icon">📍</div>
                  <div>
                    <div className="landing-contact-label">Location</div>
                    <div className="landing-contact-value">NIT Kurukshetra, Haryana, India</div>
                  </div>
                </div>
                <div className="landing-contact-item">
                  <div className="landing-contact-icon">🕒</div>
                  <div>
                    <div className="landing-contact-label">Support Hours</div>
                    <div className="landing-contact-value">9:00 AM - 6:00 PM (Mon - Sat)</div>
                  </div>
                </div>
              </div>

              <div className="landing-socials">
                <div className="landing-socials-label">Follow Us</div>
                <div className="landing-social-icons">
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '16px' }}>🐱</span>
                  </a>
                  <a href="https://linkedin.com/in/mohit_k0101" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>in</span>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '16px' }}>📸</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="landing-contact-form-card">
              <form onSubmit={handleContactSubmit}>
                <div className="landing-contact-form-grid" style={{ marginBottom: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Your Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                      placeholder="John Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Your Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                      placeholder="john@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Subject</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    placeholder="Feedback or Query..."
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Your Message</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    style={{ padding: '12px', fontSize: '13px' }}
                    placeholder="Type your message here..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={isSendingContact}>
                  {isSendingContact ? '⏳ Sending...' : '✈️ Send Message'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <span className="landing-footer-text">© 2025 CampusFind. All rights reserved.</span>
          <div className="landing-footer-links">
            <span className="landing-footer-link">Privacy Policy</span>
            <span className="landing-footer-link">Terms & Conditions</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar 
          title="Dashboard" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onSearchChange={handleSearchChange}
        />
        
        <div className="page-body">
          <div id="dashboard-section">
              {user && (
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                  Welcome back, {getFirstName()}! 👋
                </h2>
              )}

              {stats && (
                <div className="stats-grid mb-6" id="quick-stats" style={{ marginBottom: '24px' }}>
                  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '20px 24px' }}>
                    <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(99,102,241,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>💼</div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.2 }}>{stats.totalLost}</div>
                      <div className="stat-label">Lost Items</div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>↑ {stats.lostThisWeek} this week</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '20px 24px' }}>
                    <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(20,184,166,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>🛍️</div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.2 }}>{stats.totalFound}</div>
                      <div className="stat-label">Found Items</div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>↑ {stats.foundThisWeek} this week</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '20px 24px' }}>
                    <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(16,185,129,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>🎉</div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.2 }}>{stats.totalResolved || 0}</div>
                      <div className="stat-label">Resolved Items</div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>↑ {stats.resolvedThisWeek || 0} this week</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '20px 24px' }}>
                    <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(59,130,246,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>📄</div>
                    <div>
                      <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.2 }}>{stats.totalPosts}</div>
                      <div className="stat-label">Total Posts</div>
                      <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>↑ {stats.totalThisWeek} this week</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', gap: '16px', padding: '20px 24px' }}>
                    <div style={{ fontSize: '24px', width: '48px', height: '48px', background: 'rgba(245,158,11,0.12)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>🏛️</div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 900, lineHeight: 1.2, color: 'var(--text-primary)' }}>NIT</div>
                      <div className="stat-label" style={{ fontSize: '10px' }}>Kurukshetra</div>
                      <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '2px', fontWeight: 600 }}>Our Campus</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="card mb-4" style={{ marginBottom: '24px' }}>
                <div className="card-body" style={{ padding: '16px 24px' }}>
                  <div className="flex justify-between items-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex gap-2 items-center" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                      <button 
                        className={`chip ${filterType === '' ? 'active' : ''}`}
                        onClick={() => setFilterType('')}
                      >
                        All
                      </button>
                      <button 
                        className={`chip ${filterType === 'lost' ? 'active' : ''}`}
                        onClick={() => setFilterType('lost')}
                      >
                        <span style={{ color: '#ef4444', marginRight: '4px' }}>●</span> Lost
                      </button>
                      <button 
                        className={`chip ${filterType === 'found' ? 'active' : ''}`}
                        onClick={() => setFilterType('found')}
                      >
                        <span style={{ color: '#22c55e', marginRight: '4px' }}>●</span> Found
                      </button>
                      
                      <div style={{ height: '24px', width: '1px', background: 'var(--border)', margin: '0 4px' }} />
                      
                      <select 
                        id="filter-category" 
                        className="form-control" 
                        style={{ width: 'auto', padding: '4px 12px', fontSize: '13px' }}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {CF.CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>

                      <select 
                        id="filter-date" 
                        className="form-control" 
                        style={{ width: 'auto', padding: '4px 12px', fontSize: '13px' }}
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                      >
                        <option value="">Any Date</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                      <select 
                        id="filter-sort" 
                        className="form-control" 
                        style={{ width: 'auto', padding: '4px 12px', fontSize: '13px' }}
                        value={filterSort}
                        onChange={(e) => setFilterSort(e.target.value)}
                      >
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                      </select>
                      <button className="icon-btn" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', height: '34px', width: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⇅</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div className="section-title">Latest Items</div>
                  <div className="section-subtitle" id="results-count">
                    {posts.length} {posts.length === 1 ? 'item' : 'items'} found
                  </div>
                </div>
                <span onClick={() => navigate('/create-post')} className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>+ Report Item</span>
              </div>

              <div className="posts-grid" id="posts-grid">
                {posts.length === 0 && !isLoading ? (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-icon">🔍</div>
                    <div className="empty-title">No items found</div>
                    <div className="empty-text">Try adjusting your search or filters.</div>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))
                )}
                {isLoading && (
                  <div className="spinner" style={{ gridColumn: '1 / -1' }} />
                )}
              </div>

              {currentPage < totalPages && (
                <div id="load-more-wrap" style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button className="btn btn-secondary" onClick={handleLoadMore}>
                    Load More
                  </button>
                </div>
              )}


          </div>
        </div>
      </div>
    </>
  );
}
