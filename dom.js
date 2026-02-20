(() => {
    const CPLC = window.CPLC;

    function getTurnElements() {
        let turns = Array.from(document.querySelectorAll('div[data-testid="conversation-turn"]'));

        if (!turns.length) {
            const msgNodes = Array.from(document.querySelectorAll("[data-message-author-role]"));
            turns = msgNodes
                .map((n) => n.closest('div[data-testid="conversation-turn"]') || n.closest("article") || n.closest("div") || n)
                .filter(Boolean);
            turns = CPLC.uniq(turns);
        }

        return turns;
    }

    function getFirstVisibleTurn() {
        const turns = getTurnElements().filter((t) => !t.classList.contains("cplc-hidden"));
        if (!turns.length) return null;

        for (const t of turns) {
            const r = t.getBoundingClientRect();
            if (r.bottom > 0) return t;
        }
        return turns[0];
    }

    CPLC.dom = {
        getTurnElements,
        getFirstVisibleTurn
    };
})();
