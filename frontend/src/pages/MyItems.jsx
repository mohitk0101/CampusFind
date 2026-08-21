import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function MyItems() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lost');

  const loadMyPosts = async () => {
    setIsLoading(true);
    try {
      const data = await CF.apiGet('/posts/my');
      setPosts(data.posts || []);
    } catch (e) {
      alert('Error loading your items: ' + e.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!CF.isLoggedIn()) {
      navigate('/auth');
      return;
    }
    loadMyPosts();
  }, []);

  const getFilteredPosts = () => {
    return posts.filter(post => {
      if (activeTab === 'lost') return post.type === 'lost' && ['active', 'pending', 'rejected'].includes(post.status);
      if (activeTab === 'found') return post.type === 'found' && ['active', 'pending', 'rejected'].includes(post.status);
      if (activeTab === 'resolved') return post.status === 'resolved';
      if (activeTab === 'archived') return post.status === 'archived';
      return false;
    });
  };

  const filtered = getFilteredPosts();

  const getStatusBadgeClass = (status) => {
    if (status === 'active') return 'badge-active';
    if (status === 'pending') return 'badge-pending';
    if (status === 'resolved') return 'badge-resolved';
    if (status === 'archived') return 'badge-archived';
    return 'badge-rejected';
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title="My Items" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="page-body" style={{ maxWidth: '960px' }}>
          <div className="my-items-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '24px' }}>
            {['lost', 'found', 'resolved', 'archived'].map((tab) => (
              <div 
                key={tab}
                className={`my-items-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  padding: '12px 4px', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  textTransform: 'capitalize'
                }}
              >
                {tab} Items
              </div>
            ))}
          </div>

          <div>
            {isLoading ? (
              <div className="spinner" />
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <div className="empty-title">No items found</div>
                <div className="empty-text">You haven't reported any items in this category.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.map((post) => {
                  const img = post.images && post.images.length > 0 ? post.images[post.coverImageIndex || 0] : null;
                  return (
                    <div 
                      key={post._id}
                      className="my-item-row"
                      onClick={() => navigate(`/post-detail?id=${post._id}`)}
                    >
                      <div className="my-item-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
                        {img ? (
                          <img src={img} alt="thumbnail" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="my-item-title">{post.itemName}</div>
                        <div className="my-item-meta">
                          {post.location} • {CF.formatDate(post.date)}
                        </div>
                      </div>
                      <span className={`my-item-badge ${getStatusBadgeClass(post.status)}`}>
                        {post.status}
                      </span>
                      <div className="my-item-chevron" style={{ display: 'flex', alignItems: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
