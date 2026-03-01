(() => {
  const CPLC = window.CPLC;

  let lastUrl = location.href;
  let lastTurnCount = 0;

  let refreshQueued = false;
  let refreshNeedsReset = false;

  function resetConversationState() {
    CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;

    CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
    CPLC.state.lastScrollTop =
      CPLC.state.currentScrollContainer?.scrollTop || 0;

    lastTurnCount = CPLC.dom.getTurnElements().length;
  }

  function isNearBottomByLastTurn() {
    const turns = CPLC.dom.getTurnElements();
    const last = turns[turns.length - 1];
    if (!last) return false;

    const vh = window.innerHeight || document.documentElement.clientHeight;
    const r = last.getBoundingClientRect();

    return r.top < vh * 0.95;
  }

  function doRefresh(reset = false) {
    if (reset) resetConversationState();

    if (
      !CPLC.state.currentScrollContainer ||
      !CPLC.scroll.isScrollable(CPLC.state.currentScrollContainer)
    ) {
      CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
      CPLC.state.lastScrollTop =
        CPLC.state.currentScrollContainer?.scrollTop || 0;
    }

    const nearBottom =
      CPLC.state.settings.autoScroll && isNearBottomByLastTurn();

    if (nearBottom) {
      CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;
    }

    CPLC.visibility.applyVisibility();
    CPLC.userCollapse.enhance();
    CPLC.toolbar.ensure();
    CPLC.toolbar.update();

    setTimeout(() => {
      CPLC.userCollapse.enhance();
    }, 150);
  }

  function queueRefresh(reset = false) {
    refreshNeedsReset = refreshNeedsReset || reset;
    if (refreshQueued) return;
    refreshQueued = true;

    requestAnimationFrame(() => {
      refreshQueued = false;
      const r = refreshNeedsReset;
      refreshNeedsReset = false;
      doRefresh(r);
    });
  }

  function observeConversation() {
    if (CPLC.state.observer) CPLC.state.observer.disconnect();

    const root = document.querySelector("main") || document.body;

    CPLC.state.observer = new MutationObserver(() => {
      const currentUrl = location.href;
      const urlChanged = currentUrl !== lastUrl;

      const turns = CPLC.dom.getTurnElements();
      const currentTurnCount = turns.length;
      const turnCountChanged = currentTurnCount !== lastTurnCount;

      if (urlChanged) {
        lastUrl = currentUrl;
        queueRefresh(true);
        return;
      }

      if (turnCountChanged) {
        lastTurnCount = currentTurnCount;
        queueRefresh(false);
        return;
      }

      queueRefresh(false);
    });

    CPLC.state.observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async function init() {
    await CPLC.storage.load();

    CPLC.toolbar.ensure();
    resetConversationState();

    CPLC.autoScroll.ensureHooks();

    doRefresh(false);
    observeConversation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();