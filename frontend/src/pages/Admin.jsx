import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function Admin() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rejectingPostId, setRejectingPostId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const loadPostsForTab = async (tab) => {
    try {
      if (tab === 'pending') {
        const pendingData = await CF.apiGet('/admin/pending');
        setPosts(pendingData.posts || []);
      } else {
        const data = await CF.apiGet(`/admin/posts?status=${tab}`);
        setPosts(data.posts || []);
      }
    } catch (e) {
      alert('Error loading posts: ' + e.message);
    }
  };

  const loadAdminDashboard = async () => {
    setIsLoading(true);
    try {
      const statsData = await CF.apiGet('/admin/stats');
      setStats(statsData.stats);
      await loadPostsForTab(activeTab);
    } catch (e) {
      alert('Error loading admin details: ' + e.message);
      navigate('/');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const user = CF.getUser();
    if (!CF.isLoggedIn() || !user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminDashboard();
  }, [activeTab]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this post?')) return;
    try {
      await CF.apiPut(`/admin/posts/${id}/approve`, {});
      alert('Post approved successfully!');
      loadAdminDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Are you sure you want to reactivate this archived post?')) return;
    try {
      await CF.apiPut(`/admin/posts/${id}/activate`, {});
      alert('Post reactivated successfully!');
      loadAdminDashboard();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectingPostId(id);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return alert('Please enter a rejection reason.');
    setIsSubmittingReject(true);
    try {
      await CF.apiPut(`/admin/posts/${rejectingPostId}/reject`, { reason: rejectReason });
      alert('Post rejected.');
      setRejectingPostId(null);
      loadAdminDashboard();
    } catch (e) {
      alert(e.message);
    }
    setIsSubmittingReject(false);
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title="⚡ Administration Console" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="page-body">
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <>
              {stats && (
                <div className="stats-grid mb-6" style={{ marginBottom: '24px' }}>
                  <div className="stat-card">
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.totalStudents}</div>
                    <div className="stat-label">Verified Students</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.totalLost}</div>
                    <div className="stat-label">Verified Lost Items</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.totalFound}</div>
                    <div className="stat-label">Verified Found Items</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)' }}>{stats.recoveryRate}%</div>
                    <div className="stat-label">Recovery Success Rate</div>
                  </div>
                  <div className="stat-card">
                    <div style={{ fontSize: '24px', fontWeight: 900 }}>{stats.avgRecoveryTime} days</div>
                    <div className="stat-label">Avg Recovery Time</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div>
                  <div className="admin-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '20px' }}>
                    {['pending', 'active', 'resolved', 'archived'].map((tab) => (
                      <div 
                        key={tab}
                        className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                          padding: '10px 4px', 
                          cursor: 'pointer', 
                          fontWeight: 600, 
                          fontSize: '13px',
                          color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                          borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                          textTransform: 'capitalize'
                        }}
                      >
                        {tab} Items
                      </div>
                    ))}
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', textTransform: 'capitalize' }}>
                    📋 {activeTab} Items ({posts.length})
                  </h3>
                  
                  {posts.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📂</div>
                      <div className="empty-title">No items found</div>
                      <div className="empty-text">There are no {activeTab} items at the moment.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {posts.map((post) => {
                        const img = post.images && post.images.length > 0 ? post.images[post.coverImageIndex || 0] : null;
                        return (
                          <div key={post._id} className="card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', flexShrink: 0 }}>
                                {img ? (
                                  <img src={img} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ fontSize: '32px' }}>{CF.CATEGORY_ICONS[post.category] || '📦'}</div>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                  <span className={`post-card-type-badge badge-${post.type}`} style={{ textTransform: 'uppercase', fontSize: '9px', padding: '2px 6px', fontWeight: 700 }}>
                                    {post.type}
                                  </span>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{CF.timeAgo(post.createdAt)}</span>
                                </div>
                                <div className="font-bold text-sm" style={{ marginBottom: '4px' }}>{post.itemName}</div>
                                <div className="text-xs text-muted mb-2">📍 {post.location} • Category: {post.category}</div>
                                <p className="text-xs text-secondary" style={{ lineHeight: 1.4, margin: '8px 0' }}>{post.description}</p>
                                
                                {post.reporter && (
                                  <div className="text-xs text-muted">Submitted by: <strong>{post.reporter.name} ({post.reporter.rollNumber})</strong></div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                  {activeTab === 'pending' && (
                                    <>
                                      <button className="btn btn-secondary btn-sm" onClick={() => handleApprove(post._id)}>✅ Approve</button>
                                      <button className="btn btn-danger btn-sm" onClick={() => handleOpenRejectModal(post._id)}>✕ Reject</button>
                                    </>
                                  )}
                                  {activeTab === 'active' && (
                                    <button className="btn btn-danger btn-sm" onClick={() => handleOpenRejectModal(post._id)}>✕ Reject/Take Down</button>
                                  )}
                                  {activeTab === 'archived' && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleActivate(post._id)}>✅ Activate</button>
                                  )}
                                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/post-detail?id=${post._id}`)}>👁️ View Details</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📊 Database Metrics</h3>
                  {stats && (
                    <div className="card">
                      <div className="card-body" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Active (Visible)</span>
                            <span className="font-bold" style={{ color: '#22c55e' }}>{stats.totalActive}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Pending Review</span>
                            <span className="font-bold" style={{ color: '#eab308' }}>{stats.totalPending}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Successfully Resolved</span>
                            <span className="font-bold" style={{ color: '#3b82f6' }}>{stats.totalResolved}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Archived (Expired)</span>
                            <span className="font-bold" style={{ color: '#6b7280' }}>{stats.totalArchived}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="text-muted">Rejected Submissions</span>
                            <span className="font-bold" style={{ color: '#ef4444' }}>{stats.totalRejected}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {rejectingPostId && (
        <div className="modal-overlay active">
          <form className="modal" onSubmit={handleRejectSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">❌ Reject Submission</div>
              <button type="button" className="modal-close" onClick={() => setRejectingPostId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-4">Please provide a reason why this post is rejected (e.g. duplicate, inappropriate text, fake information).</p>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setRejectingPostId(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-danger" style={{ background: '#ef4444', borderColor: '#ef4444' }} disabled={isSubmittingReject}>
                {isSubmittingReject ? '⏳ Rejecting...' : 'Reject Post'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
