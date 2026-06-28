import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';

export default function PostCard({ post, showActions = false, onDelete }) {
  const navigate = useNavigate();
  const img = post.images && post.images.length > 0 ? post.images[post.coverImageIndex || 0] : null;
  const user = CF.getUser();
  const isOwner = user && post.reporter && (post.reporter._id || post.reporter) === user._id;

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
      <div className="post-card-image" style={{ position: 'relative' }}>
        {img ? (
          <img src={img} alt={post.itemName} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
            {CF.CATEGORY_ICONS[post.category] || '📦'}
          </div>
        )}
        <span className={`post-card-type-badge badge-${post.type}`} style={{ position: 'absolute', top: '12px', left: '12px', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>
          {post.type}
        </span>
        <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, background: 'rgba(0,0,0,0.45)', padding: '3px 8px', borderRadius: '10px' }}>
          {CF.timeAgo(post.createdAt)}
        </span>
      </div>
      <div className="post-card-body" style={{ padding: '16px' }}>
        <div className="post-card-title" style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          {post.itemName}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          <span>📍</span> <span>{post.location}</span>
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
