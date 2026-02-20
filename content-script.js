(() => {
  const CPLC = window.CPLC;
  let lastUrl = location.href;

  function observeConversation() {
    if (CPLC.state.observer) CPLC.state.observer.disconnect();

    const root = document.querySelector("main") || document.body;

    CPLC.state.observer = new MutationObserver(() => {
      const urlChanged = location.href !== lastUrl;

      if (urlChanged) {
        lastUrl = location.href;

        // Reset for new conversation
        CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;

        CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
        CPLC.state.lastScrollTop = CPLC.state.currentScrollContainer?.scrollTop || 0;
      }

      if (
        !CPLC.state.currentScrollContainer ||
        !CPLC.scroll.isScrollable(CPLC.state.currentScrollContainer)
      ) {
        CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
        CPLC.state.lastScrollTop =
          CPLC.state.currentScrollContainer?.scrollTop || 0;
      }

      CPLC.visibility.applyVisibility();
      CPLC.userCollapse.enhance();
      CPLC.toolbar.ensure();
      CPLC.toolbar.update();
    });

    CPLC.state.observer.observe(root, { childList: true, subtree: true });
  }

  async function init() {
    await CPLC.storage.load();

    CPLC.toolbar.ensure();

    CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
    CPLC.state.lastScrollTop = CPLC.state.currentScrollContainer?.scrollTop || 0;

    CPLC.autoScroll.ensureHooks();

    CPLC.visibility.applyVisibility();
    CPLC.userCollapse.enhance();
    observeConversation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
