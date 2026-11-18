// Leon Bookmarks – Popup Script

// State
let token = null;
let user = null;
let tenant = null;
let apiBaseUrl = 'http://localhost:4000/api';

// Elements
const loginView = document.getElementById('loginView');
const saveView = document.getElementById('saveView');
const loginForm = document.getElementById('loginForm');
const saveForm = document.getElementById('saveForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');
const saveError = document.getElementById('saveError');
const saveSuccess = document.getElementById('saveSuccess');
const userNameEl = document.getElementById('userName');
const tenantNameEl = document.getElementById('tenantName');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Load stored data
  const stored = await chrome.storage.local.get(['token', 'user', 'tenant', 'apiUrl']);
  token = stored.token;
  user = stored.user;
  tenant = stored.tenant;
  if (stored.apiUrl) apiBaseUrl = stored.apiUrl;
  document.getElementById('apiUrl').value = apiBaseUrl;

  if (token && user) {
    showSaveView();
  } else {
    showLoginView();
  }
});

// API helper
async function apiRequest(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  apiBaseUrl = document.getElementById('apiUrl').value.replace(/\/$/, '');

  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  loginError.style.display = 'none';

  try {
    const data = await apiRequest('POST', '/auth/login', { email, password });
    token = data.accessToken;
    user = data.user;
    tenant = data.tenant;

    await chrome.storage.local.set({ token, user, tenant, apiUrl: apiBaseUrl });
    showSaveView();
  } catch (err) {
    loginError.textContent = err.message;
    loginError.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
});

// Save bookmark
saveForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';
  saveError.style.display = 'none';
  saveSuccess.style.display = 'none';

  try {
    const tagsRaw = document.getElementById('bookmarkTags').value;
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const categoryId = document.getElementById('bookmarkCategory').value || undefined;

    await apiRequest('POST', '/bookmarks', {
      title: document.getElementById('bookmarkTitle').value,
      url: document.getElementById('bookmarkUrl').value,
      description: document.getElementById('bookmarkDesc').value || undefined,
      categoryId,
      tags,
    });

    saveSuccess.style.display = 'flex';
    btn.textContent = 'Saved!';
    setTimeout(() => {
      saveSuccess.style.display = 'none';
      btn.textContent = 'Save Bookmark';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    saveError.textContent = err.message;
    saveError.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Save Bookmark';
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  token = null;
  user = null;
  tenant = null;
  await chrome.storage.local.remove(['token', 'user', 'tenant']);
  showLoginView();
});

// View switching
async function showSaveView() {
  loginView.style.display = 'none';
  saveView.style.display = 'block';
  logoutBtn.style.display = 'flex';

  userNameEl.textContent = user?.name || 'User';
  tenantNameEl.textContent = tenant?.name || '';

  // Auto-fill from active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      document.getElementById('bookmarkTitle').value = tab.title || '';
      document.getElementById('bookmarkUrl').value = tab.url || '';
    }
  } catch {}

  // Load categories
  try {
    const categories = await apiRequest('GET', '/categories');
    const select = document.getElementById('bookmarkCategory');
    // Keep the first option
    select.innerHTML = '<option value="">No category</option>';
    const cats = categories.data || categories;
    if (Array.isArray(cats)) {
      cats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
      });
    }
  } catch {}
}

function showLoginView() {
  loginView.style.display = 'block';
  saveView.style.display = 'none';
  logoutBtn.style.display = 'none';
  saveSuccess.style.display = 'none';
  saveError.style.display = 'none';
}
