(() => {
    const CPLC = window.CPLC;

    const MODE_CONFIG = [
        {
            key: "fast",
            title: "Fast mode",
            subtitle: "Best performance. Loads less history.",
            loadLimit: 20,
            icon: "zap.svg"
        },
        {
            key: "balanced",
            title: "Balanced mode (Recommended)",
            subtitle: "Good speed and context.",
            loadLimit: 30,
            icon: "rabbit.svg"
        },
        {
            key: "history",
            title: "History mode",
            subtitle: "Loads more history for better context.",
            loadLimit: 60,
            icon: "history.svg"
        },
        {
            key: "snail",
            title: "Snail mode",
            subtitle: "Loads the most history. May become slower.",
            loadLimit: 120,
            icon: "snail.svg"
        },
        {
            key: "off",
            title: "Off mode",
            subtitle: "Initial fetch limiting is disabled. Other optimizations stay active.",
            loadLimit: null,
            icon: "power.svg"
        }
    ];

    function getModeConfig(modeKey) {
        return MODE_CONFIG.find((m) => m.key === modeKey) || MODE_CONFIG[1];
    }

    function getModeKeyForLoadLimit(loadLimit) {
        const n = Number(loadLimit);

        if (n >= 120) return "snail";
        if (n >= 60) return "history";
        if (n >= 30) return "balanced";
        return "fast";
    }

    function ensureModeSetting() {
        if (!CPLC.state.settings.loadMode) {
            CPLC.state.settings.loadMode = getModeKeyForLoadLimit(CPLC.state.settings.loadLimit);
        }

        const mode = getModeConfig(CPLC.state.settings.loadMode);

        if (mode.key !== "off") {
            CPLC.state.settings.loadLimit = mode.loadLimit;
        }
    }

    function getNextModeKey(currentKey) {
        const cycle = ["fast", "balanced", "history", "snail"];

        if (currentKey === "off") return "balanced";

        const index = cycle.indexOf(currentKey);
        if (index === -1) return cycle[0];

        return cycle[(index + 1) % cycle.length];
    }

    function createBtn(iconFile) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cplc-btn";
        b.appendChild(CPLC.icons.make(iconFile));
        return b;
    }

    function replaceBtnIcon(btn, iconFile) {
        if (!btn) return;

        const badge = btn.querySelector(".cplc-badge");
        btn.replaceChildren(CPLC.icons.make(iconFile));
        if (badge) btn.appendChild(badge);
    }

    function ensureWarningBadge(btn) {
        let badge = btn.querySelector(".cplc-badge");
        if (!badge) {
            badge = document.createElement("div");
            badge.className = "cplc-badge";
            badge.textContent = "!";
            btn.appendChild(badge);
        }
        return badge;
    }

    function removeWarningBadge(btn) {
        if (!btn) return;
        const badge = btn.querySelector(".cplc-badge");
        if (badge) badge.remove();
    }

    function ensureTooltipEl() {
        let el = CPLC.state.ui.tooltipEl;
        if (el) return el;

        el = document.createElement("div");
        el.className = "cplc-tooltip";
        el.style.display = "none";

        const titleEl = document.createElement("div");
        titleEl.className = "cplc-tooltip-title";

        const subEl = document.createElement("div");
        subEl.className = "cplc-tooltip-sub";

        el.append(titleEl, subEl);
        document.documentElement.appendChild(el);

        CPLC.state.ui.tooltipEl = el;
        CPLC.state.ui.tooltipTitleEl = titleEl;
        CPLC.state.ui.tooltipSubEl = subEl;

        return el;
    }

    function getTooltipContent(el) {
        if (!el) return null;
        return el._cplcTooltip || null;
    }

    function setTooltip(el, title, subtitle = "") {
        if (!el) return;
        el._cplcTooltip = { title, subtitle };
    }

    function positionTooltip(target, tooltipEl) {
        const rect = target.getBoundingClientRect();
        const gap = 10;

        tooltipEl.style.left = "0px";
        tooltipEl.style.top = "0px";
        tooltipEl.style.display = "block";

        const tipRect = tooltipEl.getBoundingClientRect();

        let left = rect.left - tipRect.width - gap;
        let top = rect.top + rect.height / 2 - tipRect.height / 2;

        if (left < 8) left = rect.right + gap;
        if (top < 8) top = 8;
        if (top + tipRect.height > window.innerHeight - 8) {
            top = window.innerHeight - tipRect.height - 8;
        }

        tooltipEl.style.left = `${Math.round(left)}px`;
        tooltipEl.style.top = `${Math.round(top)}px`;
    }

    function renderTooltip(title, subtitle = "", isWarning = false) {
        const tooltipEl = ensureTooltipEl();
        const titleEl = CPLC.state.ui.tooltipTitleEl;
        const subEl = CPLC.state.ui.tooltipSubEl;

        tooltipEl.classList.toggle("cplc-tooltip-warning", isWarning);

        titleEl.textContent = title || "";
        subEl.textContent = subtitle || "";
        subEl.style.display = subtitle ? "" : "none";

        return tooltipEl;
    }

    function showTooltip(target) {
        if (CPLC.state.ui.stickyTooltipTarget) return;

        const content = getTooltipContent(target);
        if (!content) return;

        const tooltipEl = renderTooltip(content.title, content.subtitle, false);
        positionTooltip(target, tooltipEl);
        CPLC.state.ui.tooltipTarget = target;
    }

    function showStickyTooltip(target, title, subtitle) {
        const tooltipEl = renderTooltip(title, subtitle, true);
        positionTooltip(target, tooltipEl);
        CPLC.state.ui.tooltipTarget = null;
        CPLC.state.ui.stickyTooltipTarget = target;
    }

    function hideTooltip(force = false) {
        const tooltipEl = CPLC.state.ui.tooltipEl;
        if (!tooltipEl) return;
        if (CPLC.state.ui.stickyTooltipTarget && !force) return;

        tooltipEl.style.display = "none";
        tooltipEl.classList.remove("cplc-tooltip-warning");
        CPLC.state.ui.tooltipTarget = null;
        CPLC.state.ui.stickyTooltipTarget = null;
    }

    function clearStickyTooltip() {
        if (!CPLC.state.ui.stickyTooltipTarget) return;
        hideTooltip(true);
    }

    function attachTooltip(btn) {
        if (!btn || btn._cplcTooltipBound) return;
        btn._cplcTooltipBound = true;

        btn.addEventListener("mouseenter", () => showTooltip(btn));
        btn.addEventListener("mouseleave", () => hideTooltip(false));
        btn.addEventListener("focus", () => showTooltip(btn));
        btn.addEventListener("blur", () => hideTooltip(false));
    }

    function acknowledgeReloadHint() {
        if (!CPLC.state.hasContextOverflow) return;

        clearStickyTooltip();
        update();

        requestAnimationFrame(() => {
            if (CPLC.state.ui.reloadBtn) {
                showTooltip(CPLC.state.ui.reloadBtn);
            }
        });
    }

    function update() {
        const { ui, settings } = CPLC.state;

        ensureModeSetting();

        const turns = CPLC.dom.getTurnElements();
        const totalCount = turns.length;
        const visibleCount = turns.filter((t) => !t.classList.contains("cplc-hidden")).length;

        if (ui.countEl) {
            ui.countEl.textContent = `${visibleCount}/${settings.initialVisible}`;
            setTooltip(
                ui.countEl,
                "Visible messages",
                `Showing ${visibleCount} of ${totalCount} currently loaded messages.`
            );
        }

        if (ui.settingsBtn) {
            ui.settingsBtn.classList.toggle("cplc-btn-active", settings.settingsOpen);
            setTooltip(
                ui.settingsBtn,
                "Visible message settings",
                "Adjust how many loaded messages are shown at first."
            );
        }

        if (ui.settingsGroup) {
            ui.settingsGroup.style.display = settings.settingsOpen ? "" : "none";
        }

        if (ui.visiblePlusBtn) {
            setTooltip(
                ui.visiblePlusBtn,
                "Show more visible messages",
                "Increase the number of loaded messages shown in the chat."
            );
        }

        if (ui.visibleMinusBtn) {
            setTooltip(
                ui.visibleMinusBtn,
                "Show fewer visible messages",
                "Reduce the number of loaded messages shown in the chat."
            );
        }

        if (ui.reloadBtn) {
            ui.reloadBtn.style.display = CPLC.state.hasContextOverflow ? "" : "none";
            ui.reloadBtn.classList.toggle("cplc-btn-active", CPLC.state.hasContextOverflow);

            setTooltip(
                ui.reloadBtn,
                "Reload chat",
                "This chat has grown beyond the current loaded context. Reload to restore full performance."
            );

            if (CPLC.state.hasContextOverflow) {
                ensureWarningBadge(ui.reloadBtn);
            } else {
                removeWarningBadge(ui.reloadBtn);
            }

            const justTriggered =
                CPLC.state.hasContextOverflow && !CPLC.state.reloadHintShown;

            if (justTriggered && !CPLC.isUserTyping?.()) {
                CPLC.state.reloadHintShown = true;

                showStickyTooltip(
                    ui.reloadBtn,
                    "Reload recommended",
                    "This chat has grown beyond the current loaded context. Reload to restore full performance."
                );
            }

            if (!CPLC.state.hasContextOverflow) {
                CPLC.state.reloadHintShown = false;
                clearStickyTooltip();
            }
        }

        const mode = getModeConfig(settings.loadMode);
        if (ui.modeBtn) {
            replaceBtnIcon(ui.modeBtn, mode.icon);
            ui.modeBtn.classList.toggle("cplc-btn-active", settings.loadMode !== "off");

            const subtitle =
                mode.key === "off"
                    ? "Initial fetch limiting is disabled. Other optimizations stay active. Click to return to Balanced mode."
                    : `${mode.subtitle}\nCurrently loading approximately ${Math.round(mode.loadLimit / 2)} messages for context.\n\nClick to switch mode.\nShift-click to disable.`;

            setTooltip(ui.modeBtn, mode.title, subtitle);
        }

        if (ui.autoBtn) {
            ui.autoBtn.classList.toggle("cplc-btn-active", settings.autoScroll);
            setTooltip(
                ui.autoBtn,
                settings.autoScroll ? "Auto reveal is on" : "Auto reveal is off",
                settings.autoScroll
                    ? "Older loaded messages reveal automatically when you scroll up."
                    : "Use the arrow buttons to reveal or hide older loaded messages."
            );
        }

        if (ui.collapseBtn) {
            ui.collapseBtn.classList.toggle("cplc-btn-active", settings.collapseEnabled);
            setTooltip(
                ui.collapseBtn,
                settings.collapseEnabled ? "Long message collapse is on" : "Long message collapse is off",
                settings.collapseEnabled
                    ? "Long user messages are collapsed automatically."
                    : "Long user messages stay fully expanded."
            );
        }

        const showChevrons = !settings.autoScroll;

        if (ui.upBtn) {
            ui.upBtn.style.display = showChevrons ? "" : "none";
            setTooltip(
                ui.upBtn,
                "Reveal older loaded messages",
                "Shows more of the already loaded conversation history."
            );
        }

        if (ui.downBtn) {
            ui.downBtn.style.display = showChevrons ? "" : "none";
            setTooltip(
                ui.downBtn,
                "Hide revealed messages",
                "Returns to your default visible message count."
            );
        }

        if (ui.tooltipTarget) {
            showTooltip(ui.tooltipTarget);
        }
    }

    function ensure() {
        if (CPLC.state.ui.toolbarEl) return;

        ensureModeSetting();
        ensureTooltipEl();

        const toolbarEl = document.createElement("div");
        toolbarEl.id = "cplc-toolbar";

        const countEl = document.createElement("div");
        countEl.className = "cplc-count-pill";
        countEl.tabIndex = 0;
        attachTooltip(countEl);

        const controls = document.createElement("div");
        controls.className = "cplc-controls";

        toolbarEl.append(countEl, controls);
        document.documentElement.appendChild(toolbarEl);

        CPLC.state.ui.toolbarEl = toolbarEl;
        CPLC.state.ui.countEl = countEl;

        const settingsBtn = createBtn("settings.svg");
        attachTooltip(settingsBtn);
        settingsBtn.addEventListener("click", async () => {
            CPLC.state.settings.settingsOpen = !CPLC.state.settings.settingsOpen;
            await CPLC.storage.save();
            update();
        });
        CPLC.state.ui.settingsBtn = settingsBtn;

        const settingsGroup = document.createElement("div");
        settingsGroup.className = "cplc-settings-group";

        const visiblePlusBtn = createBtn("plus.svg");
        attachTooltip(visiblePlusBtn);
        visiblePlusBtn.addEventListener("click", async () => {
            const turns = CPLC.dom.getTurnElements();
            const maxVisible = Math.max(1, turns.length);

            CPLC.state.settings.initialVisible = Math.min(200, CPLC.state.settings.initialVisible + 1);
            CPLC.state.expandedVisible = Math.min(
                maxVisible,
                Math.max(CPLC.state.expandedVisible, CPLC.state.settings.initialVisible)
            );

            CPLC.visibility.preserveViewport(() => {
                CPLC.visibility.applyVisibility();
            });

            await CPLC.storage.save();
            CPLC.userCollapse.enhance();
            update();
        });
        CPLC.state.ui.visiblePlusBtn = visiblePlusBtn;

        const visibleMinusBtn = createBtn("minus.svg");
        attachTooltip(visibleMinusBtn);
        visibleMinusBtn.addEventListener("click", async () => {
            CPLC.state.settings.initialVisible = Math.max(1, CPLC.state.settings.initialVisible - 1);
            CPLC.state.expandedVisible = Math.max(
                CPLC.state.settings.initialVisible,
                CPLC.state.expandedVisible
            );

            await CPLC.storage.save();
            CPLC.visibility.applyVisibility();
            CPLC.userCollapse.enhance();
            update();
        });
        CPLC.state.ui.visibleMinusBtn = visibleMinusBtn;

        settingsGroup.append(visiblePlusBtn, visibleMinusBtn);
        CPLC.state.ui.settingsGroup = settingsGroup;

        const divider = document.createElement("div");
        divider.className = "cplc-divider";

        const reloadBtn = createBtn("refresh-cw.svg");
        reloadBtn.style.display = "none";
        attachTooltip(reloadBtn);
        reloadBtn.addEventListener("mouseenter", acknowledgeReloadHint);
        reloadBtn.addEventListener("focus", acknowledgeReloadHint);
        reloadBtn.addEventListener("click", () => {
            window.location.reload();
        });
        CPLC.state.ui.reloadBtn = reloadBtn;

        const initialMode = getModeConfig(CPLC.state.settings.loadMode);
        const modeBtn = createBtn(initialMode.icon);
        attachTooltip(modeBtn);
        modeBtn.addEventListener("click", async (e) => {
            const isShiftClick = e.shiftKey;

            if (isShiftClick) {
                if (CPLC.state.settings.loadMode !== "off") {
                    CPLC.state.settings.loadMode = "off";
                    CPLC.state.hasContextOverflow = false;
                    CPLC.state.reloadHintShown = false;

                    await CPLC.storage.save();
                    update();

                    showStickyTooltip(
                        modeBtn,
                        "Off mode selected",
                        "Initial fetch limiting is now disabled. Reload this chat to apply it."
                    );
                    return;
                }

                CPLC.state.settings.loadMode = "balanced";
                CPLC.state.settings.loadLimit = getModeConfig("balanced").loadLimit;
                CPLC.state.hasContextOverflow = false;
                CPLC.state.reloadHintShown = false;

                await CPLC.storage.save();
                update();

                showStickyTooltip(
                    modeBtn,
                    "Balanced mode selected",
                    "Reload this chat to apply the initial fetch limit again."
                );
                return;
            }

            const nextModeKey = getNextModeKey(CPLC.state.settings.loadMode);
            const nextMode = getModeConfig(nextModeKey);

            CPLC.state.settings.loadMode = nextMode.key;
            if (nextMode.key !== "off") {
                CPLC.state.settings.loadLimit = nextMode.loadLimit;
            }

            CPLC.state.hasContextOverflow = false;
            CPLC.state.reloadHintShown = false;

            await CPLC.storage.save();
            update();

            window.location.reload();
        });
        CPLC.state.ui.modeBtn = modeBtn;

        const autoBtn = createBtn("mouse.svg");
        attachTooltip(autoBtn);
        autoBtn.addEventListener("click", async () => {
            CPLC.state.settings.autoScroll = !CPLC.state.settings.autoScroll;
            await CPLC.storage.save();
            update();
        });
        CPLC.state.ui.autoBtn = autoBtn;

        const collapseBtn = createBtn("eye-off.svg");
        attachTooltip(collapseBtn);
        collapseBtn.addEventListener("click", async () => {
            CPLC.state.settings.collapseEnabled = !CPLC.state.settings.collapseEnabled;
            await CPLC.storage.save();
            update();
            CPLC.userCollapse.enhance();
        });
        CPLC.state.ui.collapseBtn = collapseBtn;

        const upBtn = createBtn("chevron-up.svg");
        attachTooltip(upBtn);
        upBtn.addEventListener("click", CPLC.visibility.revealOne);
        CPLC.state.ui.upBtn = upBtn;

        const downBtn = createBtn("chevron-down.svg");
        attachTooltip(downBtn);
        downBtn.addEventListener("click", CPLC.visibility.hideOne);
        CPLC.state.ui.downBtn = downBtn;

        controls.append(
            settingsBtn,
            settingsGroup,
            divider,
            reloadBtn,
            modeBtn,
            autoBtn,
            collapseBtn,
            upBtn,
            downBtn
        );

        update();
    }

    CPLC.toolbar = { ensure, update, hideTooltip };
})();
