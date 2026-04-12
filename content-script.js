(() => {
  const CPLC = window.CPLC;

  let lastUrl = location.href;
  let lastTurnCount = 0;

  let pendingScrollToBottom = false;
  let pendingScrollDeadline = 0;

  let lastTypingAt = 0;
  let isCurrentlyTyping = false;
  let typingReleaseTimer = null;
  let postTypingRefreshTimer = null;

  let initialLoadTimers = [];
  let turnCountRefreshTimers = [];

  function isTextEditingElement(el) {
    if (!el || !(el instanceof Element)) return false;

    if (el instanceof HTMLTextAreaElement) return true;

    if (el instanceof HTMLInputElement) {
      const type = (el.type || "").toLowerCase();
      return !type || type === "text" || type === "search";
    }

    if (el.getAttribute("contenteditable") === "true") return true;
    if (el.closest('[contenteditable="true"]')) return true;

    return false;
  }

  function isUserTyping() {
    const recentlyTyped = Date.now() - lastTypingAt < 800;
    return isCurrentlyTyping || recentlyTyped;
  }

  CPLC.isUserTyping = isUserTyping;

  function getContextOverflowBuffer() {
    switch (CPLC.state.settings.loadMode) {
      case "fast":
        return 20;
      case "history":
        return 60;
      case "snail":
        return 120;
      case "off":
        return Infinity;
      case "balanced":
      default:
        return 30;
    }
  }

  function updateContextOverflowState() {
    const turns = CPLC.dom.getTurnElements();
    const currentCount = turns.length;
    const mode = CPLC.state.settings.loadMode;

    if (mode === "off") {
      CPLC.state.hasContextOverflow = false;
      return;
    }

    if (!CPLC.state.contextBaselineCount) {
      if (currentCount >= CPLC.state.settings.loadLimit) {
        CPLC.state.contextBaselineCount = currentCount;
      }

      CPLC.state.hasContextOverflow = false;
      return;
    }

    const buffer = getContextOverflowBuffer();
    CPLC.state.hasContextOverflow = currentCount > CPLC.state.contextBaselineCount + buffer;
  }

  function schedulePostTypingRefresh() {
    if (postTypingRefreshTimer) clearTimeout(postTypingRefreshTimer);

    postTypingRefreshTimer = setTimeout(() => {
      postTypingRefreshTimer = null;

      if (isUserTyping()) return;

      runRefresh(false);
    }, 250);
  }

  function markTyping() {
    lastTypingAt = Date.now();
    isCurrentlyTyping = true;

    if (typingReleaseTimer) clearTimeout(typingReleaseTimer);
    typingReleaseTimer = setTimeout(() => {
      isCurrentlyTyping = false;
      schedulePostTypingRefresh();
    }, 150);
  }

  function resetConversationState() {
    CPLC.state.expandedVisible = CPLC.state.settings.initialVisible;
    CPLC.state.hasContextOverflow = false;
    CPLC.state.contextBaselineCount = 0;

    CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
    CPLC.state.lastScrollTop =
      CPLC.state.currentScrollContainer?.scrollTop || 0;

    lastTurnCount = CPLC.dom.getTurnElements().length;

    CPLC.state.reloadHintShown = false;
    CPLC.toolbar?.hideTooltip?.(true);
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

        scheduleTurnCountRefreshes();
      },
      true
    );
  }

  function hookTypingSignals() {
    if (hookTypingSignals.done) return;
    hookTypingSignals.done = true;

    document.addEventListener(
      "input",
      (e) => {
        if (isTextEditingElement(e.target)) markTyping();
      },
      true
    );

    document.addEventListener(
      "keydown",
      (e) => {
        if (isTextEditingElement(e.target)) markTyping();
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

  function runRefresh(reset = false) {
    if (isUserTyping()) return;

    if (reset) resetConversationState();

    if (
      !CPLC.state.currentScrollContainer ||
      !CPLC.scroll.isScrollable(CPLC.state.currentScrollContainer)
    ) {
      CPLC.state.currentScrollContainer = CPLC.scroll.findScrollContainer();
      CPLC.state.lastScrollTop =
        CPLC.state.currentScrollContainer?.scrollTop || 0;
    }

    const turns = CPLC.dom.getTurnElements();
    const desiredVisible = Math.min(
      turns.length,
      Math.max(CPLC.state.settings.initialVisible, CPLC.state.expandedVisible)
    );

    CPLC.state.expandedVisible = desiredVisible;

    CPLC.visibility.applyVisibility();
    CPLC.userCollapse.enhance();

    updateContextOverflowState();

    CPLC.toolbar.ensure();
    CPLC.toolbar.update();

    scrollToBottomOnceIfPending();
  }

  function clearInitialLoadTimers() {
    for (const id of initialLoadTimers) clearTimeout(id);
    initialLoadTimers = [];
  }

  function clearTurnCountRefreshTimers() {
    for (const id of turnCountRefreshTimers) clearTimeout(id);
    turnCountRefreshTimers = [];
  }

  function scheduleInitialLoadRefreshes() {
    clearInitialLoadTimers();

    const delays = [0, 250, 1000, 3000, 6000];

    for (const delay of delays) {
      const id = setTimeout(() => {
        if (!isUserTyping()) {
          runRefresh(delay === 0);
        }
      }, delay);

      initialLoadTimers.push(id);
    }
  }

  function scheduleTurnCountRefreshes() {
    clearTurnCountRefreshTimers();

    const delays = [0, 250, 1000];

    for (const delay of delays) {
      const id = setTimeout(() => {
        if (!isUserTyping()) {
          runRefresh(false);
        }
      }, delay);

      turnCountRefreshTimers.push(id);
    }
  }

  function observeConversation() {
    if (CPLC.state.observer) CPLC.state.observer.disconnect();

    const root = document.body;

    CPLC.state.observer = new MutationObserver(() => {
      const currentUrl = location.href;
      const urlChanged = currentUrl !== lastUrl;

      if (urlChanged) {
        lastUrl = currentUrl;
        lastTurnCount = 0;
        pendingScrollToBottom = false;
        pendingScrollDeadline = 0;

        scheduleInitialLoadRefreshes();
        return;
      }

      if (isUserTyping()) return;

      const turns = CPLC.dom.getTurnElements();
      const currentTurnCount = turns.length;

      if (currentTurnCount !== lastTurnCount) {
        lastTurnCount = currentTurnCount;
        scheduleTurnCountRefreshes();
      }
    });

    CPLC.state.observer.observe(root, {
      childList: true,
      subtree: true
    });
  }

  async function init() {
    await CPLC.storage.load();

    hookComposerSubmit();
    hookTypingSignals();

    CPLC.toolbar.ensure();
    resetConversationState();

    CPLC.autoScroll.ensureHooks();

    scheduleInitialLoadRefreshes();
    observeConversation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
