// Leon Bookmarks - Background Service Worker

// Listen for extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Leon Bookmarks extension installed');
    // Set default API URL
    chrome.storage.local.set({ apiUrl: 'http://localhost:4000/api' });
  }
});

// Context menu for right-click "Save to Leon Bookmarks"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'save-bookmark',
    title: 'Save to Leon Bookmarks',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-bookmark') return;
  const targetUrl = info.linkUrl || tab?.url;
  const targetTitle = info.selectionText || tab?.title || targetUrl;
  if (!targetUrl) return;

  try {
    const stored = await chrome.storage.local.get(['token', 'apiUrl']);
    const token = stored.token;
    const apiUrl = (stored.apiUrl || 'http://localhost:4000/api').replace(/\/$/, '');
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Attempt AI auto-categorize & tags before saving
    let categoryId;
    let tags = [];
    try {
      const [catRes, tagRes] = await Promise.all([
        fetch(`${apiUrl}/ai/categorize`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: targetUrl, title: targetTitle }),
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/ai/tags`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ url: targetUrl, title: targetTitle }),
        }).then((r) => (r.ok ? r.json() : null)),
      ]);
      const catData = catRes?.data || catRes;
      const tagData = tagRes?.data || tagRes;
      if (catData?.categoryId) categoryId = catData.categoryId;
      if (Array.isArray(tagData?.tags)) tags = tagData.tags;
    } catch {}

    await fetch(`${apiUrl}/bookmarks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: targetUrl,
        title: targetTitle,
        categoryId,
        tags,
      }),
    });
  } catch (err) {
    console.error('Failed to quick-save bookmark:', err);
  }
});
