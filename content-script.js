(() => {
  const CPLC = window.CPLC;

  let lastUrl = location.href;
  let lastTurnCount = 0;

  let refreshQueued = false;
  let refreshNeedsReset = false;

  let pendingScrollToBottom = false;
  let pendingScrollDeadline = 0;

  function resetConversationState() {
    CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;

    CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
    CPLC.state.lastScrollTop =
      CPLC.state.currentScrollContainer?.scrollTop || 0;

    lastTurnCount = CPLC.dom.getTurnElements().length;
  }

  function hookComposerSubmit() {
    if (hookComposerSubmit.done) return;
    hookComposerSubmit.done = true;

    document.addEventListener(
      "submit",
      (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        if (!form.matches('form.group\\/composer, form[data-type="unified-composer"]')) return;

        pendingScrollToBottom = true;
        pendingScrollDeadline = Date.now() + 4000;
      },
      true
    );
  }

  function scrollToBottomOnceIfPending() {
    if (!pendingScrollToBottom) return;
    if (pendingScrollDeadline && Date.now() > pendingScrollDeadline) {
      pendingScrollToBottom = false;
      pendingScrollDeadline = 0;
      return;
    }

    const sc = CPLC.scroll.getScrollContainer();
    if (!sc) return;

    sc.scrollTop = sc.scrollHeight;

    pendingScrollToBottom = false;
    pendingScrollDeadline = 0;
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

    CPLC.visibility.applyVisibility();
    CPLC.userCollapse.enhance();
    CPLC.toolbar.ensure();
    CPLC.toolbar.update();

    // Late passes for async/streaming layout (handles long loads too)
    setTimeout(() => {
      CPLC.visibility.applyVisibility();
      CPLC.userCollapse.enhance();
      CPLC.toolbar.update();
    }, 250);

    setTimeout(() => {
      CPLC.visibility.applyVisibility();
      CPLC.userCollapse.enhance();
      CPLC.toolbar.update();
    }, 1000);

    setTimeout(() => {
      CPLC.visibility.applyVisibility();
      CPLC.userCollapse.enhance();
      CPLC.toolbar.update();
    }, 3000);

    // Only scroll if user submitted
    scrollToBottomOnceIfPending();
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

    const root = document.body;

    CPLC.state.observer = new MutationObserver(() => {
      const currentUrl = location.href;
      const urlChanged = currentUrl !== lastUrl;

      const turns = CPLC.dom.getTurnElements();
      const currentTurnCount = turns.length;
      const turnCountChanged = currentTurnCount !== lastTurnCount;

      if (urlChanged) {
        lastUrl = currentUrl;

        // New chat load can be delayed: reset now, then multi-pass refresh will catch the eventual DOM.
        lastTurnCount = 0;
        pendingScrollToBottom = false;
        pendingScrollDeadline = 0;

        queueRefresh(true);
        return;
      }

      if (turnCountChanged) {
        lastTurnCount = currentTurnCount;
        queueRefresh(false);
        return;
      }

      // Streaming / edits inside existing turns
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

    hookComposerSubmit();

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