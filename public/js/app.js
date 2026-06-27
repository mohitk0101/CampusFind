// =====================
// TOAST NOTIFICATIONS
// =====================
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-text">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =====================
// SIDEBAR
// =====================
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
  // Set active nav item
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === currentPage) item.classList.add('active');
    item.addEventListener('click', () => {
      if (item.dataset.href) window.location.href = item.dataset.href;
    });
  });
}

// =====================
// SIDEBAR USER INFO
// =====================
function renderSidebarUser() {
  const user = CF.getUser();
  const sidebarUser = document.getElementById('sidebar-user');
  const authBtn = document.getElementById('sidebar-auth-btn');

  if (!sidebarUser) return;

  if (CF.isLoggedIn() && user) {
    sidebarUser.style.display = 'flex';
    if (authBtn) authBtn.style.display = 'none';

    const avatarEl = sidebarUser.querySelector('.sidebar-avatar');
    const nameEl = sidebarUser.querySelector('.user-name');
    const roleEl = sidebarUser.querySelector('.user-role');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? '⚡ Admin' : `@${user.rollNumber}`;
    if (avatarEl) {
      if (user.profilePicture) {
        avatarEl.innerHTML = `<img src="${user.profilePicture}" alt="${user.name}">`;
      } else {
        avatarEl.innerHTML = '';
        avatarEl.textContent = CF.getInitials(user.name);
      }
    }
    sidebarUser.style.cursor = 'pointer';
    sidebarUser.onclick = () => {
      window.location.href = '/profile.html';
    };
  } else {
    sidebarUser.style.display = 'none';
    if (authBtn) authBtn.style.display = 'block';
  }
}

// =====================
// NOTIFICATIONS
// =====================
let notifOpen = false;
async function loadNotifications() {
  if (!CF.isLoggedIn()) return;
  try {
    const data = await CF.apiGet('/notifications');
    const badge = document.getElementById('notif-badge');
    if (badge) {
      if (data.unreadCount > 0) {
        badge.textContent = data.unreadCount > 9 ? '9+' : data.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (data.notifications.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-title">No notifications</div><div class="empty-text">You'll be notified about items matching your interests.</div></div>`;
    } else {
      list.innerHTML = data.notifications.map(n => `
        <div class="notif-item ${n.isRead ? '' : 'unread'}" data-id="${n._id}" data-post="${n.post ? n.post._id : ''}">
          <div class="notif-text">${n.message}</div>
          <div class="notif-time">${CF.timeAgo(n.createdAt)}</div>
        </div>
      `).join('');
      list.querySelectorAll('.notif-item').forEach(item => {
        item.addEventListener('click', async () => {
          await CF.apiPut(`/notifications/${item.dataset.id}/read`, {});
          item.classList.remove('unread');
          const postId = item.dataset.post;
          if (postId) window.location.href = `/post-detail.html?id=${postId}`;
        });
      });
    }
  } catch (e) { console.error('Notification error:', e); }
}
function initNotifications() {
  const btn = document.getElementById('notif-btn');
  const panel = document.getElementById('notif-panel');
  const closeBtn = document.getElementById('notif-close');
  const readAllBtn = document.getElementById('notif-read-all');
  if (!btn) return;
  btn.addEventListener('click', () => {
    notifOpen = !notifOpen;
    panel.classList.toggle('open', notifOpen);
    if (notifOpen) loadNotifications();
  });
  if (closeBtn) closeBtn.addEventListener('click', () => { notifOpen = false; panel.classList.remove('open'); });
  if (readAllBtn) {
    readAllBtn.addEventListener('click', async () => {
      await CF.apiPut('/notifications/read-all', {});
      loadNotifications();
    });
  }
}

// =====================
// MESSAGE BADGE COUNT
// =====================
async function loadMessageCount() {
  if (!CF.isLoggedIn()) return;
  try {
    const data = await CF.apiGet('/messages/conversations');
    const totalUnread = (data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    // Update all nav-msg-badge elements (sidebar Messages nav item)
    document.querySelectorAll('.nav-msg-badge').forEach(badge => {
      if (totalUnread > 0) {
        badge.textContent = totalUnread > 9 ? '9+' : totalUnread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  } catch (e) { console.error('Message count error:', e); }
}

// =====================
// POST CARD RENDERER
// =====================
function renderPostCard(post, showActions = false) {
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

  return `
    <div class="post-card" onclick="window.location.href='/post-detail.html?id=${post._id}'">
      <div class="post-card-image" style="position:relative">
        ${img ? `<img src="${img}" alt="${post.itemName}">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">${CF.CATEGORY_ICONS[post.category] || '📦'}</div>`}
        <span class="post-card-type-badge badge-${post.type}" style="position:absolute;top:12px;left:12px;text-transform:uppercase;font-size:10px;font-weight:700">${post.type}</span>
        <span style="position:absolute;top:12px;right:12px;font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;background:rgba(0,0,0,0.45);padding:3px 8px;border-radius:10px">${CF.timeAgo(post.createdAt)}</span>
      </div>
      <div class="post-card-body" style="padding:16px">
        <div class="post-card-title" style="font-size:15px;font-weight:700;margin-bottom:6px;color:var(--text-primary)">${post.itemName}</div>
        <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:4px;margin-bottom:12px">
          <span>📍</span> <span>${post.location}</span>
        </div>
        <div style="display:inline-block;padding:4px 10px;border-radius:10px;font-size:11px;font-weight:600;${categoryStyle}">
          ${post.category}
        </div>
        ${showActions && isOwner ? `
          <div class="flex gap-2 mt-3" onclick="event.stopPropagation()">
            ${['pending','rejected'].includes(post.status) ? `<a href="/create-post.html?edit=${post._id}" class="btn btn-sm btn-ghost" onclick="event.stopPropagation()">✏️ Edit</a>` : ''}
            <button class="btn btn-sm btn-danger" onclick="deletePost('${post._id}', this)">🗑️ Delete</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function deletePost(id, btn) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    await CF.apiDelete(`/posts/${id}`);
    btn.closest('.post-card').remove();
    showToast('Post deleted.', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function markStatus(id, status, btn) {
  if (!confirm(`Mark this item as ${status}?`)) return;
  try {
    await CF.apiPut(`/posts/${id}/status`, { status });
    showToast(`Item marked as ${status}!`, 'success');
    setTimeout(() => location.reload(), 800);
  } catch (e) { showToast(e.message, 'error'); }
}



// =====================
// MODAL HELPERS
// =====================
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// =====================
// LOGOUT
// =====================
function logout() {
  if (confirm('Are you sure you want to log out of CampusFind?')) {
    CF.clearAuth();
    window.location.href = '/auth.html';
  }
}

// =====================
// AUTH GUARD
// =====================
function requireAuth() {
  if (!CF.isLoggedIn()) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}
function requireAdmin() {
  const user = CF.getUser();
  if (!CF.isLoggedIn() || !user || user.role !== 'admin') {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  renderSidebarUser();
  if (CF.isLoggedIn()) {
    initNotifications();
    loadNotifications();
    loadMessageCount();
  }

  // Logout buttons
  document.querySelectorAll('[data-action="logout"]').forEach(btn => btn.addEventListener('click', logout));
});

window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;

window.deletePost = deletePost;
window.markStatus = markStatus;
window.renderPostCard = renderPostCard;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.logout = logout;
window.loadMessageCount = loadMessageCount;
