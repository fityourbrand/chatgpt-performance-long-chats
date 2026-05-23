chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'CPLC_TOGGLE_TOOLBAR' })
  } catch {
    // The content script only runs on supported ChatGPT pages.
  }
})
