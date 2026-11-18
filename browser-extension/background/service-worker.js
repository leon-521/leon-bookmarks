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
  if (info.menuItemId === 'save-bookmark') {
    // Open popup (can't programmatically open popup, so we just open it)
    // The user will need to click the extension icon
    // We could use a side panel in the future
    console.log('Context menu clicked for:', info.linkUrl || tab?.url);
  }
});
