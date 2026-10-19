import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import PostCard from '../components/PostCard';

const TABS = [
  { key: 'all', label: 'All Items' },
  { key: 'lost', label: 'Lost' },
  { key: 'found', label: 'Found' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'archived', label: 'Archived' },
];

export default function MyItems() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    if (!CF.isLoggedIn()) {
      navigate(`/auth?next=${encodeURIComponent('/my-items')}`);
      return;
    }
    let active = true;
    const loadMyPosts = async () => {
      setIsLoading(true);
      try {
        const data = await CF.apiGet('/posts/my');
        if (active) setPosts(data.posts || []);
      } catch (error) {
        if (active) window.alert(`Error loading your items: ${error.message}`);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadMyPosts();
    return () => { active = false; };
  }, [navigate]);

  const filtered = useMemo(() => posts.filter(post => {
    if (activeTab === 'lost' && post.type !== 'lost') return false;
    if (activeTab === 'found' && post.type !== 'found') return false;
    if (activeTab === 'resolved' && post.status !== 'resolved') return false;
    if (activeTab === 'archived' && post.status !== 'archived') return false;
    if (activeTab === 'all' && post.status === 'archived') return false;
    const term = search.trim().toLowerCase();
    if (term && ![post.itemName, post.location, post.category, post.description].some(value => String(value || '').toLowerCase().includes(term))) return false;
    return true;
  }).sort((a, b) => sort === 'oldest' ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)), [posts, activeTab, search, sort]);

  const countFor = (key) => posts.filter(post => {
    if (key === 'all') return post.status !== 'archived';
    if (key === 'lost') return post.type === 'lost' && post.status !== 'archived';
    if (key === 'found') return post.type === 'found' && post.status !== 'archived';
    return post.status === key;
  }).length;

  return <div className="my-items-page">
    <Topbar/>
    <main className="page-body my-items-content">
      <div className="page-intro-row"><div><p className="public-eyebrow">YOUR CAMPUS ACTIVITY</p><h1>My Items</h1><p>Manage the items you have reported.</p></div><button className="my-items-report-button" onClick={() => navigate('/create-post')}>＋ Report Item</button></div>
      <div className="my-items-tabs">{TABS.map(tab => <button key={tab.key} className={`my-items-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}<span>{countFor(tab.key)}</span></button>)}</div>
      <div className="my-items-toolbar"><label className="my-items-search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your items..." aria-label="Search your items"/></label><label className="my-items-sort"><span>Sort</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
      {isLoading ? <div className="spinner"/> : filtered.length === 0 ? <div className="empty-state my-items-empty"><div className="empty-title">No items found</div><div className="empty-text">There are no reports in this section yet.</div><button className="my-items-report-button" onClick={() => navigate('/create-post')}>Report an item</button></div> : <div className="posts-grid my-items-posts-grid">{filtered.map(post => <PostCard key={post._id} post={post} showActions onDelete={id => setPosts(current => current.filter(item => item._id !== id))}/>)}</div>}
    </main>
  </div>;
}
