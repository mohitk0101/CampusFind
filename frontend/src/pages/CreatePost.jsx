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
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (images.length >= 2) {
      alert('You can upload a maximum of 2 images.');
      input.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      input.value = '';
      return;
    }
    try {
      const compressedFile = await CF.compressImage(file);
      setImages((prev) => {
        if (prev.length >= 2) return prev;
        return [...prev, { file: compressedFile, preview: URL.createObjectURL(compressedFile) }];
      });
      setCoverImageIndex(0);
    } catch (err) {
      alert('Error processing image: ' + err.message);
    } finally {
      input.value = '';
    }
  };

  const removeImage = (idx) => {
    const image = images[idx];
    if (image && typeof image === 'object' && image.preview) URL.revokeObjectURL(image.preview);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (coverImageIndex >= images.length - 1) setCoverImageIndex(0);
    else if (coverImageIndex > idx) setCoverImageIndex((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return alert('Please select a category.');
    if (images.length < 1 || images.length > 2) return alert('Please upload between 1 and 2 images.');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('itemName', itemName);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('date', date);
    formData.append('description', description);
    formData.append('coverImageIndex', String(coverImageIndex));
    formData.append('questions', JSON.stringify({ question1: q1, question2: q2, question3: q3 }));

    // Keep image order when existing Cloudinary URLs and newly selected files are mixed.
    let newFileIndex = 0;
    const imageOrder = images.map((image) => {
      if (typeof image === 'string') return { type: 'existing', url: image };
      formData.append('images', image.file, image.file.name);
      return { type: 'new', index: newFileIndex++ };
    });
    formData.append('imageOrder', JSON.stringify(imageOrder));

    try {
      if (editId) {
        await CF.apiForm(`/posts/${editId}`, formData, 'PUT');
        alert('Post updated and resubmitted for approval!');
      } else {
        await CF.apiForm('/posts', formData, 'POST');
        alert('Post submitted! Pending admin approval.');
      }
      // Release local preview URLs for newly selected images.
      images.forEach((image) => {
        if (image && typeof image === 'object' && image.preview) URL.revokeObjectURL(image.preview);
      });
      navigate('/');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
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
                <label className="form-label">Image Upload (Max 2)</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
                    >
                      <img src={typeof img === 'string' ? img : img.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 0, color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {images.length < 2 && (
                    <div 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-elevated)', fontSize: '11px', color: 'var(--text-secondary)' }}
                      onClick={() => document.getElementById('image-upload-input').click()}
                    >
                      <span style={{ fontSize: '18px', fontWeight: 600, marginBottom: '2px' }}>+</span>
                      <span>Upload</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="image-upload-input" 
                  accept="image/*" 
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
