
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const CF = {
  // JWT is stored in HttpOnly cookies, not readable by JavaScript.
  getToken: () => null,

  getUser: () => {
    const u = localStorage.getItem('cf_user');
    try {
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  // Accept both setAuth(user) and setAuth(token, user)
  // so existing callers continue to work.
  setAuth: (tokenOrUser, user) => {
    const userData = user ?? tokenOrUser;

    if (userData && typeof userData === 'object') {
      localStorage.setItem('cf_user', JSON.stringify(userData));
    }
  },

  clearAuth: () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
  },

  isLoggedIn: () => !!CF.getUser(),

  apiFetch: async (path, options = {}) => {
    const sendRequest = () => {
      const headers = new Headers(options.headers || {});
      const isFormData = options.body instanceof FormData;

      if (
        options.body != null &&
        !isFormData &&
        !headers.has('Content-Type')
      ) {
        headers.set('Content-Type', 'application/json');
      }

      return fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include'
      });
    };

    let res = await sendRequest();

    // Don't refresh for failed login/register or for refresh itself.
    const isAuthEntry =
      path === '/auth/login' ||
      path === '/auth/register' ||
      path === '/auth/refresh';

    if (res.status === 401 && !isAuthEntry) {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (refreshRes.ok) {
        res = await sendRequest();
      } else {
        CF.clearAuth();
      }
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  },

  // Use for Multer uploads. Do not set Content-Type manually:
  // the browser must add the multipart boundary.
  apiForm: (path, formData, method = 'POST') =>
    CF.apiFetch(path, {
      method,
      body: formData
    }),

  apiGet: (path) =>
    CF.apiFetch(path, { method: 'GET' }),

  apiPost: (path, body) =>
    CF.apiFetch(path, {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  apiPut: (path, body) =>
    CF.apiFetch(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  apiDelete: (path) =>
    CF.apiFetch(path, { method: 'DELETE' }),

  // Convert a file to Base64 for features that still require it.
  fileToBase64: (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () =>
        reject(new Error('Could not read the selected file.'));

      reader.readAsDataURL(file);
    }),

  // Resize and compress an image, returning a binary JPEG File.
  compressImage: (file, maxWidth = 800, maxHeight = 800) =>
    new Promise((resolve, reject) => {
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

          if (!ctx) {
            reject(new Error('Could not process this image.'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress this image.'));
                return;
              }

              const baseName = (file.name || 'image')
                .replace(/\.[^.]+$/, '')
                .replace(/[^a-z0-9_-]/gi, '_');

              resolve(
                new File([blob], `${baseName || 'image'}.jpg`, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
              );
            },
            'image/jpeg',
            0.7
          );
        };

        img.onerror = () =>
          reject(new Error('The selected file is not a readable image.'));

        img.src = e.target.result;
      };

      reader.onerror = () =>
        reject(new Error('Could not read the selected image.'));

      reader.readAsDataURL(file);
    }),

  formatDate: (dateStr) => {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  timeAgo: (dateStr) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return CF.formatDate(dateStr);
  },

  CATEGORIES: [
    'Wallet',
    'ID Card',
    'Electronics',
    'Calculator',
    'Laptop Charger',
    'Books',
    'Earbuds',
    'Keys',
    'Water Bottle',
    'Bag',
    'Watch',
    'Clothes',
    'Sports Equipment',
    'Bicycle',
    'Documents',
    'Others'
  ],

  CATEGORY_ICONS: {
    Wallet: '👛',
    'ID Card': '🪪',
    Electronics: '📱',
    Calculator: '🧮',
    'Laptop Charger': '🔌',
    Books: '📚',
    Earbuds: '🎧',
    Keys: '🔑',
    'Water Bottle': '🧴',
    Bag: '🎒',
    Watch: '⌚',
    Clothes: '👕',
    'Sports Equipment': '⚽',
    Bicycle: '🚲',
    Documents: '📄',
    Others: '📦'
  },

  getInitials: (name) => {
    if (!name) return '?';

    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  truncate: (str, len = 100) => {
    if (!str) return '';

    return str.length > len ? str.slice(0, len) + '...' : str;
  }
};
