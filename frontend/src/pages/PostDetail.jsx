import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function PostDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [post, setPost] = useState(null);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [initialMsg, setInitialMsg] = useState('Hi, I think I have found/lost this item. Can we connect?');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [user, setUser] = useState(CF.getUser());

  const loadPost = async () => {
    try {
      const data = await CF.apiGet(`/posts/${id}`);
      setPost(data.post);
    } catch (e) {
      alert('Error loading post: ' + e.message);
    }
  };

  useEffect(() => {
    setUser(CF.getUser());
    if (id) {
      loadPost();
      const interval = setInterval(loadPost, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  if (!post) {
    return (
      <>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <Topbar title="Loading Details..." onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div className="page-body"><div className="spinner" /></div>
        </div>
      </>
    );
  }

  const images = post.images || [];
  const mainImage = images.length > 0 ? images[selectedImgIndex] : null;
  const isOwner = user && post.reporter && (post.reporter._id || post.reporter) === user._id;

  const handleConfirmHandover = async () => {
    if (!window.confirm('Are you sure you want to confirm handover of this item? This tells the system you returned it.')) return;
    try {
      await CF.apiPut(`/posts/${post._id}/confirm-handover`, {});
      alert('Handover confirmed!');
      loadPost();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!window.confirm('Are you sure you want to confirm receipt of this item? This tells the system you received it.')) return;
    try {
      await CF.apiPut(`/posts/${post._id}/confirm-receipt`, {});
      alert('Receipt confirmed!');
      loadPost();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSendInitialMsg = async (e) => {
    e.preventDefault();
    if (!initialMsg.trim()) return alert('Please enter a message.');
    setIsSendingChat(true);
    try {
      const reporterId = post.reporter._id || post.reporter;
      await CF.apiPost('/messages', { postId: post._id, receiverId: reporterId, text: initialMsg });
      setChatModalOpen(false);
      navigate(`/chat?post=${post._id}&user=${reporterId}`);
    } catch (err) {
      alert(err.message);
    }
    setIsSendingChat(false);
  };

  const handleClaimLost = async () => {
    if (!window.confirm('Do you want to claim that you found this item? This will let the owner coordinate with you.')) return;
    try {
      await CF.apiPut(`/posts/${post._id}/claim-lost`, {});
      alert('You have successfully claimed finding this item! The owner has been notified.');
      loadPost();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleClaimFound = async () => {
    if (!window.confirm('Do you want to claim ownership of this found item? This will let the finder coordinate with you.')) return;
    try {
      await CF.apiPut(`/posts/${post._id}/claim-found`, {});
      alert('You have successfully claimed ownership of this item! The finder has been notified.');
      loadPost();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleReportPost = () => {
    if (window.confirm('Are you sure you want to report this post for violating guidelines?')) {
      alert('Thank you for your report. The admin team has been notified and will review this post.');
    }
  };


  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title="Item Details" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="page-body">
          <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            
            <div>
              <div className="card mb-4" style={{ marginBottom: '16px' }}>
                <div className="card-body">
                  
                  <div className="gallery-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div 
                      className="gallery-main" 
                      style={{ height: '360px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', cursor: 'zoom-in', position: 'relative' }}
                      onClick={() => mainImage && setLightboxOpen(true)}
                    >
                      {mainImage ? (
                        <img src={mainImage} alt={post.itemName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ fontSize: '72px' }}>{CF.CATEGORY_ICONS[post.category] || '📦'}</div>
                      )}
                      <span className={`post-card-type-badge badge-${post.type}`} style={{ position: 'absolute', top: '16px', left: '16px', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
                        {post.type}
                      </span>
                    </div>

                    {images.length > 1 && (
                      <div className="gallery-thumbs" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {images.map((img, i) => (
                          <div 
                            key={i} 
                            className={`gallery-thumb ${selectedImgIndex === i ? 'active' : ''}`}
                            onClick={() => setSelectedImgIndex(i)}
                            style={{ width: '60px', height: '60px', borderRadius: '6px', border: selectedImgIndex === i ? '2px solid var(--primary)' : '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
                          >
                            <img src={img} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <h1 style={{ fontSize: '24px', fontWeight: 900, marginTop: '20px', marginBottom: '8px' }}>{post.itemName}</h1>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <span>📍 {post.location}</span>
                    <span>📅 {CF.formatDate(post.date)}</span>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '24px' }}>{post.description}</p>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>🔒 Verification Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-elevated)' }}>
                        <div className="text-sm text-muted mb-2">Q1: {post.type === 'lost' ? 'What color/unique markings does it have?' : 'Describe any unique identifier (e.g. brand, stickers).'}</div>
                        <div className="text-sm">{post.questions?.question1}</div>
                      </div>
                      <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-elevated)' }}>
                        <div className="text-sm text-muted mb-2">Q2: {post.type === 'lost' ? 'Where exactly do you think you dropped it?' : 'Where did you deposit it (or where can we meet)?'}</div>
                        <div className="text-sm">{post.questions?.question2}</div>
                      </div>
                      <div className="card" style={{ padding: '12px 16px', background: 'var(--bg-elevated)' }}>
                        <div className="text-sm text-muted mb-2">Q3: {post.type === 'lost' ? 'How can I identify you as the owner?' : 'Is it currently with you or deposited with a guard?'}</div>
                        <div className="text-sm">{post.questions?.question3}</div>
                      </div>
                    </div>
                  </div>

                  {post.status === 'rejected' && post.rejectionReason && (
                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <div className="font-bold text-danger" style={{ marginBottom: '4px' }}>❌ Rejected</div>
                      <div className="text-sm">Reason: {post.rejectionReason}</div>
                    </div>
                  )}

                  {post.status === 'active' && CF.isLoggedIn() && (
                    <div className="card mt-4" style={{ padding: '16px', background: 'var(--bg-elevated)', marginTop: '20px' }}>
                      <div className="font-bold mb-2">🤝 Exchange Resolution Status</div>
                      <p className="text-xs text-muted mb-3">To resolve this post, both the owner must confirm receipt and the finder must confirm handover.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        <div className="text-sm">
                          ● Owner Receipt: <strong>{post.ownerConfirmed ? '✅ Confirmed' : '⏳ Pending'}</strong> {post.owner ? `(${post.owner.name || 'Student'})` : '(Not Claimed)'}
                        </div>
                        <div className="text-sm">
                          ● Finder Handover: <strong>{post.finderConfirmed ? '✅ Confirmed' : '⏳ Pending'}</strong> {post.finder ? `(${post.finder.name || 'Student'})` : '(Not Claimed)'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        {post.type === 'lost' ? (
                          <>
                            {/* Owner Role: Confirm receipt only after someone claimed it */}
                            {isOwner && post.finder && !post.ownerConfirmed && (
                              <button className="btn btn-secondary btn-sm" onClick={handleConfirmReceipt}>✅ Confirm Receipt</button>
                            )}

                            {/* Finder Role: Confirm handover only after claiming it */}
                            {!isOwner && post.finder && (post.finder._id || post.finder) === user?._id && !post.finderConfirmed && (
                              <button className="btn btn-secondary btn-sm" onClick={handleConfirmHandover}>🤝 Confirm Handover</button>
                            )}

                            {/* Any other student (who doesn't have the item) sees Claim button */}
                            {!isOwner && !post.finder && (
                              <button className="btn btn-primary btn-sm" onClick={handleClaimLost}>🙋 I Found This Item</button>
                            )}
                          </>
                        ) : (
                          <>
                            {/* Finder Role: Confirm handover only after owner claimed it */}
                            {isOwner && post.owner && !post.finderConfirmed && (
                              <button className="btn btn-secondary btn-sm" onClick={handleConfirmHandover}>🤝 Confirm Handover</button>
                            )}

                            {/* Owner Role: Confirm receipt only after claiming it */}
                            {!isOwner && post.owner && (post.owner._id || post.owner) === user?._id && !post.ownerConfirmed && (
                              <button className="btn btn-secondary btn-sm" onClick={handleConfirmReceipt}>✅ Confirm Receipt</button>
                            )}

                            {/* Any other student (who doesn't have the item) sees Claim button */}
                            {!isOwner && !post.owner && (
                              <button className="btn btn-primary btn-sm" onClick={handleClaimFound}>🙋 This is My Item</button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            <div>
              <div className="card mb-4" style={{ marginBottom: '16px' }}>
                <div className="card-header"><div className="card-title">Reported By</div></div>
                <div className="card-body">
                  {post.reporter && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="sidebar-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', flexShrink: 0 }}>
                        {post.reporter.profilePicture ? (
                          <img src={post.reporter.profilePicture} alt={post.reporter.name} />
                        ) : (
                          CF.getInitials(post.reporter.name)
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{post.reporter.name}</div>
                        <div className="text-sm text-muted">{post.reporter.rollNumber}</div>
                        {post.reporter.department && <div className="text-sm text-muted">{post.reporter.department}</div>}
                      </div>
                    </div>
                  )}

                  {!isOwner && CF.isLoggedIn() && post.status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="btn btn-primary btn-block" onClick={() => setChatModalOpen(true)}>
                        💬 {post.type === 'lost' ? 'Message Owner' : 'Message Finder'}
                      </button>
                      <button className="btn btn-ghost btn-block" onClick={handleReportPost} style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        ⚠️ Report Post
                      </button>
                    </div>
                  )}
                  {!CF.isLoggedIn() && (
                    <span onClick={() => navigate('/auth')} className="btn btn-primary btn-block" style={{ cursor: 'pointer' }}>🔐 Login to Contact</span>
                  )}
                  {isOwner && (
                    <div className="chip" style={{ display: 'block', textAlign: 'center' }}>👤 This is your post</div>
                  )}
                </div>
              </div>

              <div className="card mb-4" style={{ marginBottom: '16px' }}>
                <div className="card-header"><div className="card-title">🛡️ Safety Tips</div></div>
                <div className="card-body" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <ul style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>🤝 <strong>Meet in a public place</strong> (e.g. library, cafeteria).</li>
                    <li>🔍 <strong>Verify the item details</strong> before handing over.</li>
                    <li>🔒 <strong>Do not share personal info</strong> or addresses.</li>
                    <li>⚠️ <strong>Report suspicious activity</strong> to the admin.</li>
                  </ul>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Post Info</div></div>
                <div className="card-body">
                  <div className="text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Posted</span><span>{CF.timeAgo(post.createdAt)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Type</span><span>{post.type === 'lost' ? '🔴 Lost' : '🟢 Found'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Category</span><span>{post.category}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Status</span><span style={{ fontWeight: 700 }}>{post.status.toUpperCase()}</span></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div className="modal-overlay active" style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1000 }} onClick={() => setLightboxOpen(false)}>
          <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <img src={mainImage} alt="lightbox" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
            <button className="modal-close" onClick={() => setLightboxOpen(false)} style={{ position: 'absolute', top: '-40px', right: 0, fontSize: '24px', color: 'white', background: 'transparent', border: 0, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {chatModalOpen && (
        <div className="modal-overlay active">
          <form className="modal" onSubmit={handleSendInitialMsg} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💬 Contact Reporter</div>
              <button type="button" className="modal-close" onClick={() => setChatModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted mb-4">Send a message to start a chat and discuss returning the item.</p>
              <div className="form-group">
                <label className="form-label">Initial Message</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={initialMsg}
                  onChange={(e) => setInitialMsg(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setChatModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSendingChat}>
                {isSendingChat ? '⏳ Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
