const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Refresh requests are shared so several simultaneous 401s don't rotate the
// same refresh token concurrently and accidentally invalidate the session.
let refreshPromise = null;

const AUTH_ENDPOINTS_WITHOUT_AUTO_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

async function readResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await readResponse(res);
      if (!res.ok) {
        CF.clearAuth();
        throw new Error(data.message || 'Your session expired. Please log in again.');
      }
      if (data.user) CF.setAuth(data.user);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export const CF = {
  // Access and refresh tokens must never be read from or stored in localStorage.
  // Keep getToken temporarily for compatibility with older UI code.
  getToken: () => null,

  getUser: () => {
    const u = localStorage.getItem('cf_user');
    try { return u ? JSON.parse(u) : null; } catch { return null; }
  },

  // Accept both setAuth(user) and the old setAuth(token, user) signature,
  // but deliberately persist only the non-sensitive user display cache.
  setAuth: (tokenOrUser, maybeUser) => {
    const user = maybeUser || tokenOrUser;
    if (user && typeof user === 'object') {
      localStorage.setItem('cf_user', JSON.stringify(user));
    }
    localStorage.removeItem('cf_token');
  },

  clearAuth: () => {
    localStorage.removeItem('cf_token'); // remove any legacy token
    localStorage.removeItem('cf_user');
  },

  // This is a UI hint only; the server cookie is the actual authentication.
  isLoggedIn: () => !!CF.getUser(),

  apiFetch: async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (hasBody && !isFormData && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const requestOptions = {
      ...options,
      headers,
      credentials: 'include',
    };

    let res = await fetch(`${API_BASE}${path}`, requestOptions);

    const isAuthEndpoint = AUTH_ENDPOINTS_WITHOUT_AUTO_REFRESH.some((endpoint) =>
      path === endpoint || path.startsWith(`${endpoint}?`)
    );

    if (res.status === 401 && !isAuthEndpoint) {
      try {
        await refreshSession();
        // Retry once with the newly issued HttpOnly access cookie.
        res = await fetch(`${API_BASE}${path}`, requestOptions);
      } catch (err) {
        CF.clearAuth();
        throw err;
      }
    }

    const data = await readResponse(res);
    if (!res.ok) {
      if (res.status === 401 && !isAuthEndpoint) CF.clearAuth();
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
  },

  apiGet: (path) => CF.apiFetch(path, { method: 'GET' }),
  apiPost: (path, body) => CF.apiFetch(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  apiPut: (path, body) => CF.apiFetch(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  apiDelete: (path) => CF.apiFetch(path, { method: 'DELETE' }),

  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  compressImage: (file, maxWidth = 800, maxHeight = 800) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with jpeg compression
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
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
