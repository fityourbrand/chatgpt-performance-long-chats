(() => {
    const CPLC = window.CPLC;

    function preserveViewport(callback) {
        const sc = CPLC.scroll.getScrollContainer();

        const anchor = CPLC.dom.getFirstVisibleTurn();
        if (!anchor) {
            callback();
            return;
        }

        const beforeTop = anchor.getBoundingClientRect().top;

        callback();

        requestAnimationFrame(() => {
            const afterTop = anchor.getBoundingClientRect().top;
            const delta = afterTop - beforeTop;
            sc.scrollTop += delta;
        });
    }

    function applyVisibility() {
        const turns = CPLC.dom.getTurnElements();
        const keep = Math.max(1, Math.min(CPLC.state.expandedVisible, turns.length));
        const cutoff = Math.max(0, turns.length - keep);

        for (let i = 0; i < turns.length; i++) {
            if (i < cutoff) turns[i].classList.add("cplc-hidden");
            else turns[i].classList.remove("cplc-hidden");
        }
    }

    function revealOne() {
        if (revealOne.lock) return;
        revealOne.lock = true;

        const turns = CPLC.dom.getTurnElements();
        if (CPLC.state.expandedVisible >= turns.length) {
            revealOne.lock = false;
            return;
        }

        CPLC.state.expandedVisible = Math.min(
            turns.length,
            CPLC.state.expandedVisible + CPLC.state.settings.step
        );

        preserveViewport(() => applyVisibility());

        CPLC.userCollapse?.enhance?.();
        CPLC.toolbar?.update?.();

        requestAnimationFrame(() => {
            revealOne.lock = false;
        });
    }

    function hideOne() {
        if (CPLC.state.expandedVisible <= CPLC.state.settings.baseVisible) return;

        CPLC.state.expandedVisible = Math.max(
            CPLC.state.settings.baseVisible,
            CPLC.state.expandedVisible - CPLC.state.settings.step
        );

        preserveViewport(() => applyVisibility());

        CPLC.userCollapse?.enhance?.();
        CPLC.toolbar?.update?.();
    }

    CPLC.visibility = {
        preserveViewport,
        applyVisibility,
        revealOne,
        hideOne
    };
})();
