import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import PostCard from '../components/PostCard';
import { useAppContext } from '../context/AppContext';

const Icon = ({ name, size = 20 }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
    package: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/></>,
    lost: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5m0 4h.01"/></>,
    found: <><path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/></>,
    resolved: <><path d="m7 12 3 3 7-7"/><path d="M21 12a9 9 0 1 1-5.5-8.3"/></>,
    filter: <><path d="M4 5h16M7 12h10m-7 7h4"/></>,
  };
  return <svg {...props}>{paths[name] || paths.search}</svg>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, user, stats, getStats, posts, totalPosts, totalPages, getPosts, isLoading, isDark, toggleTheme } = useAppContext();
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sort, setSort] = useState('newest');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const buildQuery = (pageNo = 1, append = false) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (category) params.set('category', category);
    if (query) params.set('search', query);
    if (dateRange) {
      const now = new Date();
      let from;
      if (dateRange === 'today') from = new Date(now.setHours(0, 0, 0, 0));
      if (dateRange === 'week') from = new Date(Date.now() - 7 * 86400000);
      if (dateRange === 'month') from = new Date(Date.now() - 30 * 86400000);
      if (from) params.set('dateFrom', from.toISOString());
    }
    params.set('sort', sort);
    params.set('page', String(pageNo));
    params.set('limit', isLoggedIn ? '9' : '8');
    return params.toString();
  };

  const load = async (pageNo = 1, append = false, force = false) => {
    try {
      await getPosts(buildQuery(pageNo, append), force, append);
      setPage(pageNo);
    } catch (error) {
      console.error('Unable to load CampusFind posts:', error);
    }
  };

  useEffect(() => {
    getStats().catch(() => {});
    // The context helper is recreated on provider renders; load stats once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1, false, true);
    // Filter changes intentionally reset the feed to page one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, type, category, dateRange, sort, query]);

  const visiblePosts = useMemo(() => posts, [posts]);
  const submitSearch = (event) => {
    event.preventDefault();
    setQuery(queryInput.trim());
    const section = document.getElementById('reported-items');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const beginReport = (nextType = '') => {
    const path = `/create-post${nextType ? `?type=${nextType}` : ''}`;
    navigate(isLoggedIn ? path : `/auth?next=${encodeURIComponent(path)}`);
  };

  const statsValues = {
    total: stats?.totalPosts ?? totalPosts ?? 0,
    lost: stats?.totalLost ?? 0,
    found: stats?.totalFound ?? 0,
    resolved: stats?.totalResolved ?? 0,
  };

  if (!isLoggedIn) {
    return <div className="landing-page finalized-home">
      <header className="landing-nav finalized-landing-nav">
        <button className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Campus<span>Find</span></button>
        <nav className={`landing-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Public navigation">
          <button className="landing-nav-link active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
          <button className="landing-nav-link" onClick={() => document.getElementById('reported-items')?.scrollIntoView({ behavior: 'smooth' })}>Browse</button>
          <button className="landing-nav-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</button>
          <button className="landing-nav-link" onClick={() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })}>About Us</button>
          <button className="landing-nav-link" onClick={() => document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
        </nav>
        <div className="landing-nav-actions">
          <button className="icon-btn theme-toggle-btn" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme"><Icon name={isDark ? 'sun' : 'moon'} size={17}/></button>
          <button className="landing-nav-btn report-nav-btn" onClick={() => beginReport()}>＋ Report Item</button>
          <button className="landing-nav-btn sign-in-accent-btn" onClick={() => navigate('/auth')}>Sign In</button>
          <button className="landing-menu-toggle" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Toggle navigation">☰</button>
        </div>
      </header>

      <section className="landing-hero finalized-hero" id="home">
        <div className="landing-hero-overlay" />
        <div className="hero-stats-art" aria-label="CampusFind community statistics">
          <div className="hero-analytics-card">
            <span className="analytics-brand">CampusFind</span><small>Community impact</small>
            <div className="analytics-legend"><span>Lost</span><span>Found</span><span>Resolved</span></div>
            <div className="analytics-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div>
            <div className="analytics-line">⌁⌁⌁⌁⌁</div>
          </div>
          <div className="floating-stat stat-total"><span className="floating-stat-icon"><Icon name="package" size={25}/></span><span><strong>{statsValues.total}</strong><small>Total Items</small></span></div>
          <div className="floating-stat stat-lost"><span className="floating-stat-icon"><Icon name="search" size={25}/></span><span><strong>{statsValues.lost}</strong><small>Lost Items</small></span></div>
          <div className="floating-stat stat-found"><span className="floating-stat-icon"><Icon name="found" size={25}/></span><span><strong>{statsValues.found}</strong><small>Found Items</small></span></div>
          <div className="floating-stat stat-resolved"><span className="floating-stat-icon"><Icon name="resolved" size={25}/></span><span><strong>{statsValues.resolved}</strong><small>Resolved</small></span></div>
        </div>
        <div className="landing-hero-content finalized-hero-copy">
          <div className="landing-hero-badge">NIT Kurukshetra Campus Community</div>
          <h1 className="landing-hero-title">Lost something?<br/><span>We’ll help you find it.</span></h1>
          <p className="landing-hero-desc">Search campus lost-and-found posts or help someone reunite with their belongings.</p>
          <form className="public-search finalized-public-search" onSubmit={submitSearch}>
            <Icon name="search" size={21}/><input aria-label="Search campus items" placeholder="Search by item, category, or location..." value={queryInput} onChange={e => setQueryInput(e.target.value)}/>
            <button type="submit">Search</button>
          </form>
          <div className="landing-hero-cta">
            <button className="public-action public-action-primary" onClick={() => beginReport('lost')}>＋ I Lost Something</button>
            <button className="public-action public-action-secondary" onClick={() => beginReport('found')}>⌕ I Found Something</button>
          </div>
          <p className="guest-note">Browse posts and search freely. Sign in only when you report or claim an item.</p>
        </div>
      </section>

      <section className="public-items-section finalized-public-items" id="reported-items">
        <div className="public-items-heading">
          <div><p className="public-eyebrow">CAMPUS COMMUNITY</p><h2>Recently reported items</h2><p>Explore the latest lost and found items from our campus community.</p></div>
          <div className="public-filter-row" aria-label="Filter items by status"><button type="button" className={!type ? 'active' : ''} onClick={() => setType('')}>All items</button><button type="button" className={type === 'lost' ? 'active' : ''} onClick={() => setType('lost')}>Lost</button><button type="button" className={type === 'found' ? 'active' : ''} onClick={() => setType('found')}>Found</button></div>
        </div>
        <div className="public-inline-filters" id="public-filters"><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{CF.CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Date<select value={dateRange} onChange={e => setDateRange(e.target.value)}><option value="">Any date</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select></label><label>Sort<select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
        <div className="posts-grid public-posts-grid finalized-posts-grid">
          {visiblePosts.length ? visiblePosts.slice(0, 8).map(post => <PostCard key={post._id} post={post}/>) : !isLoading && <div className="public-empty-state"><strong>No items found</strong><p>Try a different search or filter.</p></div>}
          {isLoading && <div className="spinner"/>}
        </div>
        {page < totalPages && <button className="public-view-all" onClick={() => load(page + 1, true)}>Load more items</button>}
      </section>

      <section className="landing-info-section" id="how-it-works">
        <div className="landing-info-heading"><p className="public-eyebrow">SIMPLE AND SECURE</p><h2>How It Works</h2><p>Three simple steps to help campus belongings find their way home.</p></div>
        <div className="landing-info-grid">
          <article className="landing-info-card"><span className="landing-info-number">01</span><h3>Search the listings</h3><p>Browse recent lost and found posts or search by item name, category, or location.</p></article>
          <article className="landing-info-card"><span className="landing-info-number">02</span><h3>Report or contact</h3><p>Sign in when you are ready to report an item or contact someone about a listing.</p></article>
          <article className="landing-info-card"><span className="landing-info-number">03</span><h3>Reconnect and resolve</h3><p>Coordinate safely through CampusFind and mark the item resolved when it is returned.</p></article>
        </div>
      </section>

      <section className="landing-info-section landing-about-section" id="about-us">
        <div className="landing-about-panel"><p className="public-eyebrow">ABOUT CAMPUSFIND</p><h2>Helping our campus look out for one another.</h2><p>CampusFind is a campus-focused lost-and-found space for the NIT Kurukshetra community. It brings lost and found listings together so students can search, report items, and coordinate their return in one place.</p><button className="landing-info-cta" onClick={() => document.getElementById('reported-items')?.scrollIntoView({ behavior: 'smooth' })}>Browse recent items <span aria-hidden="true">→</span></button></div>
      </section>

      <section className="landing-info-section landing-contact-section" id="contact-us">
        <div className="landing-info-heading"><p className="public-eyebrow">CONTACT</p><h2>Need help with an item?</h2><p>Open the listing to review its details, or sign in to contact the person who reported it.</p></div>
        <div className="landing-contact-actions"><button className="landing-info-cta" onClick={() => document.getElementById('reported-items')?.scrollIntoView({ behavior: 'smooth' })}>Browse items <span aria-hidden="true">→</span></button><button className="landing-info-cta secondary" onClick={() => navigate('/auth')}>Sign in to continue</button></div>
      </section>
    </div>;
  }

  const filterLabels = [
    { value: '', label: 'All items', count: statsValues.total },
    { value: 'lost', label: 'Lost', count: statsValues.lost },
    { value: 'found', label: 'Found', count: statsValues.found },
  ];

  return <div className="dashboard-shell">
    <Topbar/>
    <div className="dashboard-layout">
      {mobileFiltersOpen && <button type="button" className="filter-backdrop" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} />}
      <aside className={`dashboard-filter-sidebar ${mobileFiltersOpen ? 'filters-open' : ''}`}>
        <div className="filter-sidebar-title"><Icon name="filter"/><h2>Refine results</h2><button type="button" className="mobile-filter-close" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)}>×</button></div>
        <div className="filter-group"><h3>Status</h3>{filterLabels.map(item => <button key={item.value || 'all'} className={`filter-sidebar-option ${type === item.value ? 'active' : ''}`} onClick={() => setType(item.value)}><span>{item.label}</span><small>{item.count}</small></button>)}</div>
        <div className="filter-group"><h3>Category</h3><button className={`filter-sidebar-option ${!category ? 'active' : ''}`} onClick={() => setCategory('')}><span>All categories</span><small>{statsValues.total}</small></button>{CF.CATEGORIES.map(item => <button key={item} className={`filter-sidebar-option ${category === item ? 'active' : ''}`} onClick={() => setCategory(category === item ? '' : item)}><span>{item}</span></button>)}</div>
        <div className="filter-group"><h3>Date reported</h3><select className="filter-sidebar-select" value={dateRange} onChange={e => setDateRange(e.target.value)}><option value="">Any date</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select></div>
        <button className="filter-reset" onClick={() => { setType(''); setCategory(''); setDateRange(''); setSort('newest'); setQuery(''); setQueryInput(''); }}>Clear all filters</button>
      </aside>
      <main className="dashboard-main" id="reported-items">
        <div className="dashboard-heading-row"><div><p className="public-eyebrow">CAMPUS COMMUNITY</p><h1>Browse Items</h1><p>Find lost belongings around campus</p></div><div className="dashboard-heading-actions"><label className="sort-control"><span>Sort by</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label><button type="button" className="dashboard-filter-toggle" onClick={() => setMobileFiltersOpen(true)} aria-expanded={mobileFiltersOpen}><Icon name="filter" size={16}/> Filter</button></div></div>
        <form className="dashboard-search-row" onSubmit={submitSearch}><Icon name="search" size={21}/><input value={queryInput} onChange={e => setQueryInput(e.target.value)} placeholder="Search for items (e.g. laptop, keys, bottle, book...)" aria-label="Search items"/><button type="submit">Search</button></form>
        <div className="dashboard-tabs">{filterLabels.map(item => <button key={item.value || 'all'} className={type === item.value ? 'active' : ''} onClick={() => setType(item.value)}>{item.label}</button>)}</div>
        <div className="dashboard-results-line"><span><strong>{totalPosts}</strong> items found</span><button onClick={() => load(1, false, true)}>Refresh results</button></div>
        <div className="posts-grid dashboard-posts-grid">{visiblePosts.map(post => <PostCard key={post._id} post={post}/>)}{!visiblePosts.length && !isLoading && <div className="public-empty-state"><strong>No items found</strong><p>Try adjusting your search or filters.</p></div>}{isLoading && <div className="spinner"/>}</div>
        {page < totalPages && <button className="public-view-all" onClick={() => load(page + 1, true)}>Load more items</button>}
      </main>
    </div>
  </div>;
}
