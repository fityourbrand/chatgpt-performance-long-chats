(() => {
    const CPLC = window.CPLC;

    function buildToggleButton(expanded) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cplc-toggle-btn";

        const icon = CPLC.icons.make(expanded ? "chevron-up.svg" : "chevron-down.svg");
        const text = document.createElement("span");

        if (expanded) {
            text.textContent = "Collapse";
            btn.append(icon, text);
        } else {
            text.textContent = "Show more";
            btn.append(text, icon);
        }

        return btn;
    }

    function ensureFadeEl(bubble) {
        let fade = bubble.querySelector(":scope > .cplc-user-fade");
        if (!fade) {
            fade = document.createElement("div");
            fade.className = "cplc-user-fade";
            bubble.appendChild(fade);
        }
        return fade;
    }

    function setCollapsed(bubble, content, collapsed) {
        if (collapsed) {
            content.classList.add("cplc-user-collapsed");
            ensureFadeEl(bubble).style.display = "";
            bubble.dataset.cplcCollapsed = "1";
        } else {
            content.classList.remove("cplc-user-collapsed");
            const fade = bubble.querySelector(":scope > .cplc-user-fade");
            if (fade) fade.style.display = "none";
            bubble.dataset.cplcCollapsed = "0";
        }
    }

    function removeAll() {
        document.querySelectorAll(".user-message-bubble-color[data-cplc-setup]").forEach((bubble) => {
            const content = bubble.querySelector(".whitespace-pre-wrap");
            if (content) {
                content.classList.remove("cplc-user-collapsed");
            }

            const fade = bubble.querySelector(":scope > .cplc-user-fade");
            if (fade) fade.remove();

            const article = bubble.closest("article");
            const actionBar = article ? article.querySelector(".z-0.flex.justify-end > div") : null;
            if (actionBar && bubble.dataset.cplcButtonId) {
                const btn = actionBar.querySelector(`[data-cplc-id="${bubble.dataset.cplcButtonId}"]`);
                if (btn) btn.remove();
            }

            delete bubble.dataset.cplcSetup;
            delete bubble.dataset.cplcCollapsed;
            delete bubble.dataset.cplcButtonId;
        });
    }

    function enhance() {
        if (CPLC.state.settings.collapseEnabled === false) {
            removeAll();
            return;
        }

        const bubbles = document.querySelectorAll(".user-message-bubble-color");

        bubbles.forEach((bubble) => {
            const content = bubble.querySelector(".whitespace-pre-wrap");
            if (!content) return;

            const article = bubble.closest("article");
            const actionBar = article ? article.querySelector(".z-0.flex.justify-end > div") : null;

            const tallEnough = content.scrollHeight >= CPLC.COLLAPSE_MIN_SCROLL_HEIGHT;

            if (!tallEnough) {
                // Clean up stale button if it exists
                if (actionBar && bubble.dataset.cplcButtonId) {
                    const existing = actionBar.querySelector(`[data-cplc-id="${bubble.dataset.cplcButtonId}"]`);
                    if (existing) existing.remove();
                    delete bubble.dataset.cplcButtonId;
                    delete bubble.dataset.cplcSetup;
                }
                return;
            }

            // Re-validate existing setup (button may have been removed by ChatGPT's DOM updates)
            if (bubble.dataset.cplcSetup && actionBar) {
                const btnId = bubble.dataset.cplcButtonId;
                const btn = btnId ? actionBar.querySelector(`[data-cplc-id="${btnId}"]`) : null;
                if (!btn) {
                    delete bubble.dataset.cplcSetup;
                    delete bubble.dataset.cplcButtonId;
                }
            }

            if (!bubble.dataset.cplcSetup) {
                bubble.dataset.cplcSetup = "1";
                const btnId = Math.random().toString(36).slice(2);
                bubble.dataset.cplcButtonId = btnId;

                setCollapsed(bubble, content, true);

                const btn = buildToggleButton(false);
                btn.dataset.cplcRole = "toggle";
                btn.dataset.cplcId = btnId;

                btn.addEventListener("click", () => {
                    const isCollapsed = bubble.dataset.cplcCollapsed === "1";
                    setCollapsed(bubble, content, !isCollapsed);

                    btn.replaceChildren();
                    const nextExpanded = isCollapsed;

                    const icon = CPLC.icons.make(nextExpanded ? "chevron-up.svg" : "chevron-down.svg");
                    const text = document.createElement("span");

                    if (nextExpanded) {
                        text.textContent = "Collapse";
                        btn.append(icon, text);
                    } else {
                        text.textContent = "Show more";
                        btn.append(text, icon);
                    }
                });

                if (actionBar) {
                    actionBar.appendChild(btn);
                } else {
                    bubble.appendChild(btn);
                }

                ensureFadeEl(bubble);
            }

            const fade = bubble.querySelector(":scope > .cplc-user-fade");
            if (fade && bubble.dataset.cplcCollapsed === "1") fade.style.display = "";
        });
    }

    CPLC.userCollapse = { enhance };
})();
