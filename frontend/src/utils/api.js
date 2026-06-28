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

  apiGet: (path) => CF.apiFetch(path, { method: 'GET' }),
  apiPost: (path, body) => CF.apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  apiPut: (path, body) => CF.apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  apiDelete: (path) => CF.apiFetch(path, { method: 'DELETE' }),

  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
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
