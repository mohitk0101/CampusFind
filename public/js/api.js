// =====================
// API HELPER UTILITY
// =====================
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('cf_token');
}
function getUser() {
  const u = localStorage.getItem('cf_user');
  try { return u ? JSON.parse(u) : null; } catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('cf_token', token);
  localStorage.setItem('cf_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
}
function isLoggedIn() { return !!getToken(); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

async function apiGet(path) { return apiFetch(path, { method: 'GET' }); }
async function apiPost(path, body) { return apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); }
async function apiPut(path, body) { return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }); }
async function apiDelete(path) { return apiFetch(path, { method: 'DELETE' }); }

// Image to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return formatDate(dateStr);
}

// Categories
const CATEGORIES = ['Wallet','ID Card','Electronics','Calculator','Laptop Charger','Books','Earbuds','Keys','Water Bottle','Bag','Watch','Clothes','Sports Equipment','Bicycle','Documents','Others'];
const CATEGORY_ICONS = {
  'Wallet':'👛','ID Card':'🪪','Electronics':'📱','Calculator':'🧮','Laptop Charger':'🔌','Books':'📚','Earbuds':'🎧','Keys':'🔑','Water Bottle':'🧴','Bag':'🎒','Watch':'⌚','Clothes':'👕','Sports Equipment':'⚽','Bicycle':'🚲','Documents':'📄','Others':'📦'
};

// Get initials for avatar
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Truncate text
function truncate(str, len = 100) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

window.CF = { apiGet, apiPost, apiPut, apiDelete, fileToBase64, formatDate, timeAgo, getToken, getUser, setAuth, clearAuth, isLoggedIn, CATEGORIES, CATEGORY_ICONS, getInitials, truncate };
