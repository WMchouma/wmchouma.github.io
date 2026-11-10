(() => {
  const base = window.wumianBackend.apiBase;
  const key = "wumian-friend-key-v1";
  const pendingKey = "wumian-friend-pending-v1";
  const valid = value => /^wmf_[A-Za-z0-9_-]{43}$/.test(value || "");
  const read = name => { try { return localStorage.getItem(name) || ""; } catch { return ""; } };
  const store = (name, value) => {
    try { if (value) localStorage.setItem(name, value); else localStorage.removeItem(name); return true; } catch { return false; }
  };
  let token = read(key);
  let friend = null;
  let problem = "";
  let checking = null;
  let persistent = true;
  const notify = () => window.dispatchEvent(new Event("friend-session-change"));
  async function request(path, options = {}, tokenOverride) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const headers = new Headers(options.headers);
    const currentToken = tokenOverride === undefined ? token : tokenOverride;
    if (currentToken) headers.set("Authorization", `Bearer ${currentToken}`);
    try {
      const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
      const response = await fetch(base + path, { ...options, headers, signal, credentials: "omit", cache: "no-store" });
      if (!response.ok) {
        const data = await response.json();
        const error = new Error(data.error || "暂时无法连接，请重试。");
        error.status = response.status;
        throw error;
      }
      return options.binary ? response.arrayBuffer() : response.json();
    } catch (error) {
      if (error.name === "AbortError" && options.signal?.aborted) throw error;
      if (error instanceof TypeError || error.name === "AbortError" || error instanceof SyntaxError) throw new Error("网络暂时不可用，请重试。");
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function accept(value, person) {
    if (!valid(value)) throw new Error("好友凭证格式不正确。");
    token = value;
    friend = person;
    problem = "";
    persistent = store(key, value);
    store(pendingKey, "");
    notify();
  }
  async function restore(value) {
    if (!valid(value)) throw new Error("请选择有效的好友凭证文件。");
    const data = await request("/me", {}, value);
    accept(value, data.friend);
    return data.friend;
  }
  async function check() {
    if (checking) return checking;
    checking = (async () => {
      problem = "";
      friend = null;
      const candidates = [...new Set([read(pendingKey), token].filter(valid))];
      if (!candidates.length) { notify(); return; }
      for (const candidate of candidates) {
        try { await restore(candidate); return; }
        catch (error) {
          if (![401, 403].includes(error.status)) { problem = error.message; notify(); return; }
        }
      }
      token = "";
      friend = null;
      store(key, "");
      store(pendingKey, "");
      problem = "好友凭证已失效，请联系站点主人。";
      notify();
    })();
    try { await checking; } finally { checking = null; notify(); }
  }
  function forget() {
    token = "";
    friend = null;
    problem = "";
    store(key, "");
    store(pendingKey, "");
    notify();
  }
  function backup() {
    if (!friend || !valid(token)) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, site: "wmchouma.github.io", token }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "wumian-friend-key.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.friendSession = {
    request, accept, restore, check, forget, backup,
    snapshot: () => ({ friend, problem, checking: Boolean(checking), persistent, hasToken: Boolean(token || read(pendingKey)) }),
    createToken: () => "wmf_" + btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""),
    pending: value => store(pendingKey, value),
    clearPending: () => store(pendingKey, "")
  };
})();
