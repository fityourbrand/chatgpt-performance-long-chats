(() => {
    const CPLC = window.CPLC;

    function createBtn(title, iconFile) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cplc-btn";
        b.title = title;
        b.appendChild(CPLC.icons.make(iconFile));
        return b;
    }

    function update() {
        const { ui, settings, expandedVisible } = CPLC.state;

        if (ui.countEl) ui.countEl.textContent = `${expandedVisible}/${settings.baseVisible}`;

        if (ui.settingsBtn) ui.settingsBtn.classList.toggle("cplc-btn-active", settings.settingsOpen);
        if (ui.settingsGroup) ui.settingsGroup.style.display = settings.settingsOpen ? "" : "none";
        if (ui.autoBtn) ui.autoBtn.classList.toggle("cplc-btn-active", settings.autoScroll);
        if (ui.collapseBtn) ui.collapseBtn.classList.toggle("cplc-btn-active", settings.collapseEnabled);

        const showChevrons = !settings.autoScroll;
        if (ui.upBtn) ui.upBtn.style.display = showChevrons ? "" : "none";
        if (ui.downBtn) ui.downBtn.style.display = showChevrons ? "" : "none";
    }

    function ensure() {
        if (CPLC.state.ui.toolbarEl) return;

        const toolbarEl = document.createElement("div");
        toolbarEl.id = "cplc-toolbar";

        const countEl = document.createElement("div");
        countEl.className = "cplc-count-pill";

        const controls = document.createElement("div");
        controls.className = "cplc-controls";

        toolbarEl.append(countEl, controls);
        document.documentElement.appendChild(toolbarEl);

        CPLC.state.ui.toolbarEl = toolbarEl;
        CPLC.state.ui.countEl = countEl;

        // --- Settings button ---
        const settingsBtn = createBtn("Settings", "settings.svg");
        settingsBtn.addEventListener("click", async () => {
            CPLC.state.settings.settingsOpen = !CPLC.state.settings.settingsOpen;
            await CPLC.storage.save();
            update();
        });
        CPLC.state.ui.settingsBtn = settingsBtn;

        // --- Settings group (+/-) ---
        const settingsGroup = document.createElement("div");
        settingsGroup.className = "cplc-settings-group";

        const plusBtn = createBtn("Show more messages", "plus.svg");
        plusBtn.addEventListener("click", async () => {
            CPLC.state.settings.baseVisible = Math.min(200, CPLC.state.settings.baseVisible + 1);
            CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;

            CPLC.visibility.preserveViewport(() => {
                CPLC.visibility.applyVisibility();
            });

            await CPLC.storage.save();
            CPLC.userCollapse.enhance();
            update();
        });
        CPLC.state.ui.plusBtn = plusBtn;

        const minusBtn = createBtn("Show fewer messages", "minus.svg");
        minusBtn.addEventListener("click", async () => {
            CPLC.state.settings.baseVisible = Math.max(1, CPLC.state.settings.baseVisible - 1);
            CPLC.state.expandedVisible = CPLC.state.settings.baseVisible;

            await CPLC.storage.save();
            CPLC.visibility.applyVisibility();
            CPLC.userCollapse.enhance();
            update();
        });
        CPLC.state.ui.minusBtn = minusBtn;

        settingsGroup.append(plusBtn, minusBtn);
        CPLC.state.ui.settingsGroup = settingsGroup;

        // --- Divider ---
        const divider = document.createElement("div");
        divider.className = "cplc-divider";

        // --- Auto-scroll button ---
        const autoBtn = createBtn("Auto Scroll", "mouse.svg");
        autoBtn.addEventListener("click", async () => {
            CPLC.state.settings.autoScroll = !CPLC.state.settings.autoScroll;
            await CPLC.storage.save();
            update();
        });
        CPLC.state.ui.autoBtn = autoBtn;

        // --- Collapse toggle button ---
        const collapseBtn = createBtn("Collapse long messages", "eye-off.svg");
        collapseBtn.addEventListener("click", async () => {
            CPLC.state.settings.collapseEnabled = !CPLC.state.settings.collapseEnabled;
            await CPLC.storage.save();
            update();
            CPLC.userCollapse.enhance();
        });
        CPLC.state.ui.collapseBtn = collapseBtn;

        // --- Up/Down buttons ---
        const upBtn = createBtn("Reveal older messages", "chevron-up.svg");
        upBtn.addEventListener("click", CPLC.visibility.revealOne);
        CPLC.state.ui.upBtn = upBtn;

        const downBtn = createBtn("Hide revealed messages", "chevron-down.svg");
        downBtn.addEventListener("click", CPLC.visibility.hideOne);
        CPLC.state.ui.downBtn = downBtn;

        controls.append(settingsBtn, settingsGroup, divider, autoBtn, collapseBtn, upBtn, downBtn);
        update();
    }

    CPLC.toolbar = { ensure, update };
})();
