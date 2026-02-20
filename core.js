(() => {
    const CPLC = (window.CPLC = window.CPLC || {});

    CPLC.STORAGE_KEY = "cplc_settings";

    CPLC.DEFAULTS = {
        baseVisible: 5,
        autoScroll: true,
        collapseEnabled: true,
        settingsOpen: false,
        step: 1,
        topThreshold: 80,
        bottomThreshold: 120
    };

    CPLC.COLLAPSE_MIN_SCROLL_HEIGHT = 260;
    CPLC.COLLAPSED_MAX_HEIGHT = 220;

    CPLC.state = {
        settings: { ...CPLC.DEFAULTS },
        expandedVisible: CPLC.DEFAULTS.baseVisible,
        lastScrollTop: 0,
        ticking: false,
        observer: null,
        currentScrollContainer: null,
        hooksAttached: false,
        ui: {
            toolbarEl: null,
            countEl: null,
            settingsBtn: null,
            settingsGroup: null,
            collapseBtn: null,
            autoBtn: null,
            upBtn: null,
            downBtn: null,
            minusBtn: null,
            plusBtn: null
        }
    };

    CPLC.uniq = (arr) => Array.from(new Set(arr));

    CPLC.storage = {
        load: async () => {
            const store = chrome?.storage?.sync || chrome?.storage?.local;
            if (!store) return;

            const data = await store.get(CPLC.STORAGE_KEY);
            if (data && data[CPLC.STORAGE_KEY]) {
                CPLC.state.settings = { ...CPLC.state.settings, ...data[CPLC.STORAGE_KEY] };
            }

            CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;
        },

        save: async () => {
            const store = chrome?.storage?.sync || chrome?.storage?.local;
            if (!store) return;
            await store.set({ [CPLC.STORAGE_KEY]: CPLC.state.settings });
        }
    };

    function isScrollable(el) {
        if (!el) return false;

        const docScroller =
            el === document.scrollingElement ||
            el === document.documentElement ||
            el === document.body;

        if (docScroller) {
            const sc = document.scrollingElement || document.documentElement;
            return sc && (sc.scrollHeight - sc.clientHeight) > 200;
        }

        if (!(el instanceof Element)) return false;

        const cs = getComputedStyle(el);
        const oy = cs.overflowY;
        const canScroll = oy === "auto" || oy === "scroll" || oy === "overlay";
        if (!canScroll) return false;

        return (el.scrollHeight - el.clientHeight) > 200;
    }

    function findScrollContainer() {
        const main = document.querySelector("main");
        const doc = document.scrollingElement || document.documentElement;

        if (!main) return doc;

        const candidates = [main, ...Array.from(main.querySelectorAll("div, section, article"))].filter(
            isScrollable
        );

        if (!candidates.length) return doc;

        candidates.sort((a, b) => b.clientHeight - a.clientHeight);
        return candidates[0];
    }

    function getScrollContainer() {
        return CPLC.state.currentScrollContainer || findScrollContainer();
    }

    function setScrollContainerFromEventTarget(target) {
        if (!target) return;

        let t = target;

        if (t === document) t = document.scrollingElement || document.documentElement;

        if (t instanceof Element && !isScrollable(t)) {
            let p = t.parentElement;
            while (p && p !== document.body) {
                if (isScrollable(p)) {
                    t = p;
                    break;
                }
                p = p.parentElement;
            }
        }

        if (isScrollable(t)) {
            CPLC.state.currentScrollContainer = t;
        } else if (!CPLC.state.currentScrollContainer) {
            CPLC.state.currentScrollContainer = findScrollContainer();
        }
    }

    CPLC.scroll = {
        isScrollable,
        findScrollContainer,
        getScrollContainer,
        setScrollContainerFromEventTarget
    };
})();
