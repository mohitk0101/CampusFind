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

  const fetchStats = async () => {
    if (!isLoggedIn) return;
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
    }
  }, [isLoggedIn, filterType, filterCategory, filterDateRange, filterSort, searchQuery]);

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

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar 
          title="Dashboard" 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          onSearchChange={isLoggedIn ? handleSearchChange : undefined}
        />
        
        <div className="page-body">
          {!isLoggedIn ? (
            <div id="hero-section">
              <div className="hero-section">
                <div className="hero-badge">🎓 Exclusive for NIT Kurukshetra Students</div>
                <h1 className="hero-title">Find What You Lost.<br />Return What You Found.</h1>
                <p className="hero-subtitle">CampusFind is a secure platform where NITKKR students can report lost items, post found belongings, and connect safely to recover them.</p>
                <div className="hero-cta">
                  <span onClick={() => navigate('/auth?tab=signup')} className="btn btn-primary btn-lg" style={{ cursor: 'pointer' }}>🚀 Get Started</span>
                  <span onClick={() => navigate('/auth')} className="btn btn-ghost btn-lg" style={{ cursor: 'pointer', marginLeft: '12px' }}>🔐 Sign In</span>
                </div>
              </div>

              <div className="stats-grid mb-6" style={{ marginBottom: '40px' }}>
                <div className="stat-card">
                  <div className="stat-value">🔐</div>
                  <div className="stat-label">Verified Students Only</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">✅</div>
                  <div className="stat-label">Admin Approved Posts</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">💬</div>
                  <div className="stat-label">Secure Messaging</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">🔔</div>
                  <div className="stat-label">Smart Notifications</div>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
