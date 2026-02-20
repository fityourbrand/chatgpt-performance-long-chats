(() => {
    const CPLC = window.CPLC;

    function url(file) {
        return chrome.runtime.getURL(`icons/${file}`);
    }

    function make(file) {
        const el = document.createElement("span");
        el.className = "cplc-icon";
        set(el, file);
        return el;
    }

    function set(el, file) {
        const u = url(file);
        el.style.webkitMaskImage = `url("${u}")`;
        el.style.maskImage = `url("${u}")`;
    }

    CPLC.icons = { url, make, set };
})();
