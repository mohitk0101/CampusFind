import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CF } from '../utils/api';

const Icon = ({ name }) => {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  return <svg {...props}>{name === 'pin' ? <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></> : <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}</svg>;
};

export default function PostCard({ post, showActions = false, onDelete }) {
  const navigate = useNavigate();
  const images = Array.isArray(post.images) ? post.images : [];
  const coverIndex = Number.isInteger(post.coverImageIndex) ? post.coverImageIndex : 0;
  const [currentIdx, setCurrentIdx] = React.useState(coverIndex);
  const touchStartX = React.useRef(null);
  const image = images[currentIdx] || images[coverIndex] || images[0];
  const type = String(post.type || 'lost').toLowerCase();
  const status = String(post.status || 'active').toLowerCase();

  const handleDelete = async (event) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await CF.apiDelete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (error) {
      window.alert(error.message || 'Could not delete this post.');
    }
  };

  const openDetails = () => navigate(`/post-detail?id=${post._id}`);
  const changeImage = (event, index) => {
    event.stopPropagation();
    setCurrentIdx(Math.max(0, Math.min(index, images.length - 1)));
  };
  const handleTouchEnd = (event) => {
    if (touchStartX.current == null || images.length < 2) return;
    const diff = touchStartX.current - event.changedTouches[0].clientX;
    if (diff > 40) setCurrentIdx(index => Math.min(images.length - 1, index + 1));
    if (diff < -40) setCurrentIdx(index => Math.max(0, index - 1));
    touchStartX.current = null;
  };

  return <article className="post-card finalized-post-card">
    <div className="post-card-image finalized-post-image" role="button" tabIndex={0} onClick={openDetails} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') openDetails(); }} onTouchStart={event => { touchStartX.current = event.touches[0].clientX; }} onTouchEnd={handleTouchEnd} aria-label={`View ${post.itemName}`}>
      {image ? <img src={image} alt={post.itemName || 'Reported item'} loading="lazy"/> : <span className="post-image-placeholder"><span className="post-placeholder-mark">CF</span>No image provided</span>}
      <span className={`post-card-type-badge badge-${type}`}>{type === 'found' ? 'FOUND' : 'LOST'}</span>
      {status === 'resolved' && <span className="post-resolved-badge">RESOLVED</span>}
      {images.length > 1 && <div className="post-image-dots" aria-label={`${currentIdx + 1} of ${images.length} photos`}>{images.map((_, index) => <button type="button" key={index} className={currentIdx === index ? 'active' : ''} onClick={event => changeImage(event, index)} aria-label={`Show photo ${index + 1}`}/>)}</div>}
    </div>
    <div className="finalized-post-body">
      <time className="finalized-post-date" dateTime={post.date || post.createdAt}>{CF.formatDate(post.date || post.createdAt)}</time>
      <h3 className="post-card-title">{post.itemName || 'Untitled item'}</h3>
      <div className="cf-card-meta"><Icon name="pin"/><span title={post.location}>{post.location || 'Campus location not specified'}</span></div>
      <div className="cf-card-reporter"><Icon name="user"/><span>{post.reporter?.name || post.reporter?.username || 'Campus member'}</span></div>
      <button className="post-view-more" onClick={openDetails}>View More <span aria-hidden="true">→</span></button>
      {showActions && <button className="post-delete-action" onClick={handleDelete}>Delete report</button>}
    </div>
  </article>;
}
