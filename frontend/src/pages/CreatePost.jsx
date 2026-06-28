import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CF } from '../utils/api';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [type, setType] = useState('lost');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');

  useEffect(() => {
    if (!CF.isLoggedIn()) {
      navigate('/auth');
      return;
    }

    if (editId) {
      const loadEditData = async () => {
        try {
          const data = await CF.apiGet(`/posts/${editId}`);
          const p = data.post;
          setType(p.type);
          setItemName(p.itemName);
          setCategory(p.category);
          setLocation(p.location);
          if (p.date) {
            setDate(new Date(p.date).toISOString().split('T')[0]);
          }
          setDescription(p.description);
          setImages(p.images || []);
          setCoverImageIndex(p.coverImageIndex || 0);
          if (p.questions) {
            setQ1(p.questions.question1 || '');
            setQ2(p.questions.question2 || '');
            setQ3(p.questions.question3 || '');
          }
        } catch (e) {
          alert('Error loading post data: ' + e.message);
        }
      };
      loadEditData();
    }
  }, [editId]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      return alert('You can upload a maximum of 5 images.');
    }
    try {
      const base64s = await Promise.all(files.map(f => CF.fileToBase64(f)));
      setImages((prev) => [...prev, ...base64s]);
    } catch (err) {
      alert('Error uploading images: ' + err.message);
    }
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (coverImageIndex >= images.length - 1) {
      setCoverImageIndex(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return alert('Please select a category.');
    setIsLoading(true);

    const body = {
      type,
      itemName,
      category,
      location,
      date,
      description,
      images,
      coverImageIndex,
      questions: {
        question1: q1,
        question2: q2,
        question3: q3
      }
    };

    try {
      if (editId) {
        await CF.apiPut(`/posts/${editId}`, body);
        alert('Post updated and resubmitted for approval!');
      } else {
        await CF.apiPost('/posts', body);
        alert('Post submitted! Pending admin approval.');
      }
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Topbar title={editId ? 'Edit Post' : 'Report Lost & Found Item'} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="page-body" style={{ maxWidth: '760px' }}>
          <form onSubmit={handleSubmit} className="card">
            <div className="card-header">
              <div className="card-title">Item details & verification questions</div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="lost" 
                      checked={type === 'lost'}
                      onChange={() => setType('lost')}
                    />
                    <span>🔴 Lost Item</span>
                  </label>
                  <label className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: '12px' }}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="found" 
                      checked={type === 'found'}
                      onChange={() => setType('found')}
                    />
                    <span>🟢 Found Item</span>
                  </label>
                </div>
              </div>

              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Leather Wallet, Boat Earbuds"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category</option>
                    {CF.CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Location (Where {type === 'lost' ? 'lost' : 'found'}?)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Senate Hall, Library Room 2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date (When {type === 'lost' ? 'lost' : 'found'}?)</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Features</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="Provide details like color, brand, unique marks (Do not share security details like keys password or exact cash quantity here)."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Images Upload (Max 5)</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', border: coverImageIndex === idx ? '1px solid var(--primary)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
                      onClick={() => setCoverImageIndex(idx)}
                      title="Click to set as cover image"
                    >
                      <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 0, color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                      {coverImageIndex === idx && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '8px', textAlign: 'center', padding: '1px 0' }}>Cover</div>
                      )}
                    </div>
                  ))}
                  {images.length < 5 && (
                    <div 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-elevated)', fontSize: '11px', color: 'var(--text-secondary)' }}
                      onClick={() => document.getElementById('image-upload-input').click()}
                    >
                      <span>➕</span>
                      <span>Upload</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="image-upload-input" 
                  accept="image/*" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={handleImageUpload} 
                />
              </div>

              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>🔒 Verification Questions</h3>
                <p className="text-xs text-muted mb-4">Set 3 questions that claimants must answer to prove ownership before they can contact you.</p>
                
                <div className="form-group">
                  <label className="form-label">Q1: {type === 'lost' ? 'What color/unique markings does it have?' : 'Describe any unique identifier (e.g. brand, stickers).'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Q2: {type === 'lost' ? 'Where exactly do you think you dropped it?' : 'Where did you deposit it (or where can we meet)?'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Q3: {type === 'lost' ? 'How can I identify you as the owner?' : 'Is it currently with you or deposited with a guard?'}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={q3}
                    onChange={(e) => setQ3(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? '⏳ Submitting...' : editId ? '💾 Save Changes' : '📤 Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
