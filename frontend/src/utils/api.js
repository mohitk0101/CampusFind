const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const CF = {
  getToken: () => localStorage.getItem('cf_token'),
  getUser: () => {
    const u = localStorage.getItem('cf_user');
    try { return u ? JSON.parse(u) : null; } catch { return null; }
  },
  setAuth: (token, user) => {
    localStorage.setItem('cf_token', token);
    localStorage.setItem('cf_user', JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
  },
  isLoggedIn: () => !!localStorage.getItem('cf_token'),

  apiFetch: async (path, options = {}) => {
    const token = CF.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  },

  // Use this for multipart/form-data. The browser must set the boundary itself.
  apiForm: async (path, formData, method = 'POST') => {
    const token = CF.getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method, body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  apiGet: (path) => CF.apiFetch(path, { method: 'GET' }),
  apiPost: (path, body) => CF.apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  apiPut: (path, body) => CF.apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  apiDelete: (path) => CF.apiFetch(path, { method: 'DELETE' }),

  // Retained for profile/chat image flows that still use Base64 payloads.
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
    });
  },

  // Resize and compress in the browser, then return a binary File (not Base64).
  compressImage: (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else if (height >= width && height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Could not process this image.'));
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Could not compress this image.'));
            const baseName = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-z0-9_-]/gi, '_');
            resolve(new File([blob], `${baseName || 'image'}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => reject(new Error('The selected file is not a readable image.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.readAsDataURL(file);
    });
  },

  formatDate: (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  timeAgo: (dateStr) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return CF.formatDate(dateStr);
  },

  CATEGORIES: ['Wallet','ID Card','Electronics','Calculator','Laptop Charger','Books','Earbuds','Keys','Water Bottle','Bag','Watch','Clothes','Sports Equipment','Bicycle','Documents','Others'],

  CATEGORY_ICONS: {
    'Wallet':'👛','ID Card':'🪪','Electronics':'📱','Calculator':'🧮','Laptop Charger':'🔌','Books':'📚','Earbuds':'🎧','Keys':'🔑','Water Bottle':'🧴','Bag':'🎒','Watch':'⌚','Clothes':'👕','Sports Equipment':'⚽','Bicycle':'🚲','Documents':'📄','Others':'📦'
  },

  getInitials: (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },

  truncate: (str, len = 100) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '...' : str;
  }
};
