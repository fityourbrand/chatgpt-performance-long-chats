(() => {
  const SETTINGS_KEY = "cplc_settings";
  const DATASET_LIMIT_KEY = "cplcMessageLimit";
  const FETCH_INTERCEPTOR_FILE = "fetch-interceptor.js";

  async function loadSettings() {
    try {
      const store = chrome?.storage?.sync || chrome?.storage?.local;
      if (!store) return null;

      const result = await store.get(SETTINGS_KEY);
      return result?.[SETTINGS_KEY] || null;
    } catch {
      return null;
    }
  }

  function applyConfigToPage(settings) {
    if (settings?.loadMode === "off") {
      document.documentElement.dataset[DATASET_LIMIT_KEY] = "off";
      return;
    }

    const limit = Math.max(1, Number(settings?.loadLimit ?? 20));
    document.documentElement.dataset[DATASET_LIMIT_KEY] = String(limit);
  }

  function injectFetchInterceptor() {
    if (document.documentElement.dataset.cplcFetchInterceptorInjected === "1") return;
    document.documentElement.dataset.cplcFetchInterceptorInjected = "1";

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(FETCH_INTERCEPTOR_FILE);
    script.dataset.cplcInjected = "1";

    script.addEventListener("load", () => script.remove(), { once: true });
    script.addEventListener("error", () => script.remove(), { once: true });
    (document.head || document.documentElement).appendChild(script);
  }

  async function init() {
    applyConfigToPage(null);

    const settings = await loadSettings();
    applyConfigToPage(settings);
    injectFetchInterceptor();
  }

  init();
})();
