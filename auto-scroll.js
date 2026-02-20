(() => {
    const CPLC = window.CPLC;

    function runAutoScroll(directionHint) {
        if (!CPLC.state.settings.autoScroll) return;

        const sc = CPLC.scroll.getScrollContainer();
        if (!sc) return;

        const st = sc.scrollTop;
        const maxScroll = sc.scrollHeight - sc.clientHeight;
        const remainingBottom = maxScroll - st;

        const direction = directionHint || (st < CPLC.state.lastScrollTop ? "up" : "down");
        CPLC.state.lastScrollTop = st;

        const nearTop = st <= CPLC.state.settings.topThreshold;
        const nearBottom = remainingBottom <= CPLC.state.settings.bottomThreshold;

        if (direction === "up" && nearTop) CPLC.visibility.revealOne();
        if (direction === "down" && nearBottom) CPLC.visibility.hideOne();
    }

    function onAnyScroll(e) {
        CPLC.scroll.setScrollContainerFromEventTarget(e?.target);

        if (CPLC.state.ticking) return;
        CPLC.state.ticking = true;

        requestAnimationFrame(() => {
            runAutoScroll();
            CPLC.state.ticking = false;
        });
    }

    function onWheel(e) {
        if (!CPLC.state.settings.autoScroll) return;

        CPLC.scroll.setScrollContainerFromEventTarget(e?.target);

        const dir = e.deltaY < 0 ? "up" : "down";

        if (CPLC.state.ticking) return;
        CPLC.state.ticking = true;

        requestAnimationFrame(() => {
            runAutoScroll(dir);
            CPLC.state.ticking = false;
        });
    }

    function ensureHooks() {
        if (CPLC.state.hooksAttached) return;
        CPLC.state.hooksAttached = true;

        document.addEventListener("scroll", onAnyScroll, { capture: true, passive: true });
        document.addEventListener("wheel", onWheel, { capture: true, passive: true });
        document.addEventListener("touchmove", onAnyScroll, { capture: true, passive: true });
    }

    CPLC.autoScroll = { ensureHooks };
})();
