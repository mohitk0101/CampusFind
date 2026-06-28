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

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      return alert('Please fill in Name, Email, and Message fields.');
    }
    setIsSendingContact(true);
    try {
      await CF.apiPost('/posts/contact', {
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage
      });
      alert(`Thank you, ${contactName}! Your message has been sent successfully to the support mailbox.`);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to send message. Please try again later.');
    }
    setIsSendingContact(false);
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
            <span className={`landing-nav-link ${activeNav === 'developer' ? 'active' : ''}`} onClick={() => scrollToSection('developer')}>Developer</span>
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

        {/* Developer Section */}
        <section className="landing-section" id="developer">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#818cf8', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{'</>'}</span> Developer
            </span>
          </div>
          <h2 className="landing-title" style={{ marginBottom: '8px' }}>About the <span style={{ textDecoration: 'underline', textDecorationColor: '#818cf8' }}>Developer</span></h2>
          <p className="landing-subtitle">The mind behind CampusFind – building solutions to help our campus community.</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <div className="dev-profile-card">


              <div className="dev-avatar-ring">
                <img
                  src="/mohit.jpg"
                  alt="Mohit Kumar"
                  className="dev-avatar-img"
                  onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                />
                <div style={{ display: 'none', width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>👨‍💻</div>
              </div>
              <h3 className="dev-name">Mohit Kumar</h3>
              <p className="dev-role">Full Stack Developer &amp; Problem Solver</p>
              <p className="dev-quote">&ldquo;Building digital solutions that make everyday campus life easier for everyone.&rdquo;</p>
              <div className="dev-social-links">
                <a href="https://github.com/mohitk0101" target="_blank" rel="noreferrer" className="dev-social-btn dev-social-github" title="GitHub">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/mohit-kumar-57568b331/" target="_blank" rel="noreferrer" className="dev-social-btn dev-social-linkedin" title="LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.instagram.com/mohit_k0101/" target="_blank" rel="noreferrer" className="dev-social-btn dev-social-instagram" title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
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
                  <a href="https://github.com/mohitk0101" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '16px' }}>🐱</span>
                  </a>
                  <a href="https://www.linkedin.com/in/mohit-kumar-57568b331/" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>in</span>
                  </a>
                  <a href="https://www.instagram.com/mohit_k0101/" target="_blank" rel="noreferrer" className="landing-social-icon" style={{ textDecoration: 'none' }}>
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
