import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';

export default function PostCard({ post, showActions = false, onDelete }) {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const images = post.images && post.images.length > 0 ? post.images : [];
  const img = images[currentIdx];
  const user = CF.getUser();
  const isOwner = user && post.reporter && (post.reporter._id || post.reporter) === user._id;

  let touchStartX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (images.length <= 1) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50 && currentIdx < images.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else if (diff < -50 && currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const catColors = {
    'Wallet': 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)',
    'ID Card': 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)',
    'Keys': 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)',
    'Documents': 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)',
    'Personal': 'color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)',
    'Electronics': 'color:#14b8a6;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.2)',
    'Calculator': 'color:#14b8a6;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.2)',
    'Earbuds': 'color:#14b8a6;background:rgba(20,184,166,0.1);border:1px solid rgba(20,184,166,0.2)',
    'Bag': 'color:#a5b4fc;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2)',
    'Clothes': 'color:#a5b4fc;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2)',
    'Watch': 'color:#a5b4fc;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2)',
    'Books': 'color:#9698b9;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)',
    'Water Bottle': 'color:#9698b9;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)',
    'Others': 'color:#9698b9;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)'
  };
  const categoryStyle = catColors[post.category] || 'color:#9698b9;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1)';

  const handleCardClick = () => {
    navigate(`/post-detail?id=${post._id}`);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    navigate(`/create-post?edit=${post._id}`);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await CF.apiDelete(`/posts/${post._id}`);
        if (onDelete) onDelete(post._id);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="post-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div 
        className="post-card-image" 
        style={{ position: 'relative' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {img ? (
          <img src={img} alt={post.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
        )}

        {images.length > 1 && (
          <>
            {currentIdx > 0 && (
              <button 
                type="button"
                className="carousel-arrow left"
                onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => prev - 1); }}
                style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 0, color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                ‹
              </button>
            )}
            {currentIdx < images.length - 1 && (
              <button 
                type="button"
                className="carousel-arrow right"
                onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => prev + 1); }}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 0, color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                ›
              </button>
            )}
            
            <div className="carousel-dots" style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px', zIndex: 10 }}>
              {images.map((_, idx) => (
                <span 
                  key={idx} 
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: currentIdx === idx ? 'var(--primary)' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }}
                />
              ))}
            </div>
          </>
        )}

        <span className={`post-card-type-badge badge-${post.type}`}>
          {post.type}
        </span>
      </div>
      <div className="post-card-body" style={{ padding: '16px' }}>
        <div className="post-card-title" style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          {post.itemName}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <span>{post.location}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {CF.timeAgo(post.createdAt)}
        </div>
        <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, ...parseInlineStyle(categoryStyle) }}>
          {post.category}
        </div>
        {showActions && isOwner && (
          <div className="flex gap-2 mt-3" style={{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
            {['pending', 'rejected'].includes(post.status) && (
              <button className="btn btn-sm btn-ghost" onClick={handleEditClick}>✏️ Edit</button>
            )}
            <button className="btn btn-sm btn-danger" onClick={handleDeleteClick}>🗑️ Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function parseInlineStyle(styleStr) {
  const styles = {};
  styleStr.split(';').forEach(style => {
    const parts = style.split(':');
    if (parts.length === 2) {
      const key = parts[0].trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      styles[key] = parts[1].trim();
    }
  });
  return styles;
}
