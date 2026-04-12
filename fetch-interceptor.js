(() => {
  const DATASET_LIMIT_KEY = "cplcMessageLimit";

  if (window.__CPLC_FETCH_PATCHED__) return;
  window.__CPLC_FETCH_PATCHED__ = true;

  const originalFetch = window.fetch.bind(window);

  function isInitialFetchLimitingDisabled() {
    return document.documentElement.dataset[DATASET_LIMIT_KEY] === "off";
  }

  function getMessageLimit() {
    const raw = document.documentElement.dataset[DATASET_LIMIT_KEY];
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 20;
  }

  function getUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    if (input && typeof input.url === "string") return input.url;
    return "";
  }

  function getMethod(input, init) {
    if (init?.method) return String(init.method).toUpperCase();
    if (input && typeof input.method === "string") return String(input.method).toUpperCase();
    return "GET";
  }

  function isConversationGetRequest(url, method) {
    if (method !== "GET" || !url) return false;

    try {
      const u = new URL(url, location.origin);
      return /^\/backend-api\/conversation\/[^/]+$/.test(u.pathname);
    } catch {
      return false;
    }
  }

  function hasJsonContentType(response) {
    const ct = response.headers.get("content-type") || "";
    return ct.includes("application/json");
  }

  function isMessageNode(node) {
    const msg = node?.message;
    const role = msg?.author?.role;

    return !!(
      node &&
      node.id &&
      msg &&
      msg.content &&
      (role === "user" || role === "assistant")
    );
  }

  function collectPathToRoot(mapping, startId) {
    const ids = [];
    const seen = new Set();

    let currentId = startId;
    while (currentId && mapping[currentId] && !seen.has(currentId)) {
      seen.add(currentId);
      ids.push(currentId);
      currentId = mapping[currentId].parent || null;
    }

    return ids;
  }

  function trimConversationData(data, keepCount) {
    if (!data || typeof data !== "object") return null;
    if (!data.mapping || typeof data.mapping !== "object") return null;
    if (!data.current_node) return null;

    const mapping = data.mapping;
    const allNodes = Object.values(mapping);
    const messageNodes = allNodes.filter(isMessageNode);

    if (messageNodes.length <= keepCount) return null;

    const pathIds = collectPathToRoot(mapping, data.current_node);
    const orderedMessages = pathIds
      .map((id) => mapping[id])
      .filter(isMessageNode)
      .reverse();

    const keptMessages = orderedMessages.slice(-keepCount);

    if (!keptMessages.length) return null;

    const rootId = data.root || "root";
    const newMapping = {
      [rootId]: {
        id: rootId,
        parent: null,
        children: [],
        message: null
      }
    };

    let prevId = rootId;

    for (const node of keptMessages) {
      const id = node.id;

      newMapping[id] = {
        ...node,
        parent: prevId,
        children: []
      };

      newMapping[prevId].children.push(id);
      prevId = id;
    }

    return {
      ...data,
      mapping: newMapping,
      current_node: prevId,
      root: rootId
    };
  }

  async function maybeTrimResponse(input, init, response) {
    try {
      const url = getUrl(input);
      const method = getMethod(input, init);

      if (isInitialFetchLimitingDisabled()) return response;
      if (!isConversationGetRequest(url, method)) return response;
      if (!response.ok) return response;
      if (!hasJsonContentType(response)) return response;

      const data = await response.clone().json();
      const trimmed = trimConversationData(data, getMessageLimit());

      if (!trimmed) return response;

      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");

      const nextResponse = new Response(JSON.stringify(trimmed), {
        status: response.status,
        statusText: response.statusText,
        headers
      });

      try {
        Object.defineProperty(nextResponse, "url", {
          value: response.url
        });
      } catch {}

      return nextResponse;
    } catch (err) {
      console.warn("[CPLC] fetch trim failed:", err);
      return response;
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const response = await originalFetch(input, init);
    return maybeTrimResponse(input, init, response);
  };
})();
