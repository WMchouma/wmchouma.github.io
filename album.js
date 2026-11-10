(() => {
  const session = window.friendSession;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const sizes = bytes => `${(bytes / 1048576).toFixed(1)} MB`;
  let root = null, items = [], pending = [], cursor = null, total = 0, busy = false, error = "", notice = "";
  let upload = null, uploadController = null, viewController = null, observer = null;
  let generation = 0;
  const urls = new Map();

  function accountMarkup() {
    const { friend, problem, checking, hasToken, persistent } = session.snapshot();
    if (checking) return `<p role="status" aria-busy="true">正在验证好友身份…</p>`;
    if (friend) return `<div class="album-account"><div><h2>${escape(friend.name)}</h2>
      <p>${friend.status === "active" ? "身份已确认，可以上传。" : "身份待确认。请通过你与站点主人原有的联系方式，发送编号和核验码。"} </p>
      ${friend.status !== "active" ? `<p class="verification-code">编号 ${friend.id} · <strong>${escape(friend.verificationCode)}</strong></p>` : ""}
      ${!persistent ? `<p class="friends-error">当前浏览器无法保存凭证，请立即备份。</p>` : ""}
      <p class="friends-note">凭证用于登录，请勿分享。丢失后需联系站点主人恢复。</p></div>
      <div class="friend-actions"><button class="glass-button" data-album-backup>备份凭证</button><button class="friend-text-button" data-album-check>刷新身份</button><button class="friend-text-button" data-album-logout>退出</button></div></div>`;
    return `<div class="album-access"><h2>验证好友身份</h2><p>通过答题后，使用原设备或导入好友凭证。</p>
      ${problem ? `<p class="friends-error" role="alert">${escape(problem)}</p>` : ""}
      <div class="friend-actions"><a class="glass-button primary" href="#friends">前往答题</a><label class="glass-button file-button">导入凭证<input id="friend-key-file" type="file" accept=".json,application/json" aria-label="导入好友凭证"></label>
      ${hasToken ? `<button class="friend-text-button" data-album-check>重新连接</button>` : ""}</div>
      <details class="album-recovery"><summary>丢失凭证 / 名单匹配失败</summary><p>请先联系站点主人核实身份。不要重新注册同名账号。</p>
      <form id="album-recovery-form"><label class="friend-label" for="recovery-invitation">一次性恢复邀请</label><input class="friend-input" id="recovery-invitation" name="invitation" autocomplete="off" spellcheck="false" maxlength="47" required><button class="glass-button" type="submit">恢复身份</button></form></details></div>`;
  }
  function page() {
    return `<section class="collection-view album-view"><div class="page-heading"><div><h1>挚友相册</h1><p>把日常留在这里。</p></div><a class="back-link" href="#friends">好朋友名单 →</a></div>
      <section id="album-account-panel" class="album-account-panel" aria-label="好友身份">${accountMarkup()}</section>
      <p id="album-message" class="friends-error" role="alert" hidden></p><p id="album-notice" role="status" hidden></p>
      <section id="album-content" aria-label="相册作品"></section>
      <dialog id="album-dialog" aria-labelledby="album-media-title"><div class="lightbox-head"><h2 id="album-media-title"></h2><button class="icon-button" data-album-close aria-label="关闭预览">×</button></div><div id="album-media-stage" class="photo-stage"></div></dialog>
      <a class="back-link" href="#home">← 返回开始</a></section>`;
  }
  function message() {
    if (!root) return;
    const node = root.querySelector("#album-message");
    if (!node) return;
    node.textContent = error; node.hidden = !error;
    const status = root.querySelector("#album-notice");
    status.textContent = notice; status.hidden = !notice;
  }
  function render() {
    if (!root?.querySelector("#album-content")) return;
    root.querySelector("#album-account-panel").innerHTML = accountMarkup();
    message();
    const friend = session.snapshot().friend;
    const target = root.querySelector("#album-content");
    observer?.disconnect();
    if (friend?.status !== "active") { target.innerHTML = ""; return; }
    target.innerHTML = `<div class="album-toolbar"><div><h2>全部作品 <small>${total} 件</small></h2><p class="friends-note">图片 ≤ 8 MB · 视频 ≤ 20 MB</p></div>
      <div class="friend-actions"><button class="icon-button" data-album-refresh aria-label="刷新相册" title="刷新相册" ${busy ? "disabled" : ""}>↻</button><label class="glass-button primary file-button ${uploadController ? "is-disabled" : ""}">＋ 上传<input id="album-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" aria-label="上传图片或视频" ${uploadController ? "disabled" : ""}></label></div></div>
      <div id="album-upload-status">${uploadMarkup()}</div>
      ${pending.filter(item => item.id !== upload?.id).map(item => `<div class="album-upload"><div><strong>${escape(item.name)}</strong><p>上次上传未完成，请取消后重新选择文件。</p></div><button class="friend-text-button" data-album-delete="${escape(item.id)}" aria-label="取消未完成上传：${escape(item.name)}">取消上传</button></div>`).join("")}
      ${busy ? `<p role="status" aria-busy="true">正在读取相册…</p>` : ""}
      ${items.length ? `<div class="album-grid">${items.map(item => `<article class="album-item"><button class="album-preview" data-album-open="${escape(item.id)}" aria-label="${item.mime.startsWith("video/") ? "播放视频" : "查看图片"}：${escape(item.name)}">
        <span class="album-thumbnail" data-thumb="${escape(item.id)}">${urls.has(`thumb-${item.id}`) ? `<img src="${urls.get(`thumb-${item.id}`)}" alt="" loading="lazy">` : `<span aria-hidden="true">${item.mime.startsWith("video/") ? "▷" : "▣"}</span>`}</span>
        <span class="album-filename">${escape(item.name)}</span></button><div class="album-item-meta"><p>${escape(item.owner)} · ${sizes(item.size)}<small>${new Date(item.date).toLocaleDateString("zh-CN")}</small></p>
        ${item.ownerId === friend.id ? `<button class="icon-button" data-album-delete="${escape(item.id)}" aria-label="删除：${escape(item.name)}" title="删除作品">×</button>` : ""}</div></article>`).join("")}</div>` : !busy ? `<div class="album-empty"><span aria-hidden="true">▤</span><h2>还没有作品</h2><p>上传第一张图片或一段视频。</p></div>` : ""}
      ${cursor ? `<button class="glass-button friend-more" data-album-more ${busy ? "disabled" : ""}>查看更多</button>` : ""}`;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const item = items.find(item => item.id === entry.target.dataset.thumb);
        if (item?.thumbnailSize && !urls.has(`thumb-${item.id}`)) loadThumbnail(item, entry.target, generation);
      }
    }, { rootMargin: "100px" });
    target.querySelectorAll("[data-thumb]").forEach(node => observer.observe(node));
  }
  function uploadMarkup() {
    if (!upload) return "";
    return `<div class="album-upload"><div><strong>${escape(upload.file.name)}</strong><p role="status">${escape(upload.status)}</p><progress value="${upload.progress}" max="100" aria-label="上传进度">${upload.progress}%</progress></div><div class="friend-actions">
      ${uploadController ? `<button class="friend-text-button" data-album-cancel>取消</button>` : `<button class="glass-button" data-album-retry>重试</button><button class="friend-text-button" data-album-discard>移除</button>`}</div></div>`;
  }
  function renderUpload() {
    const target = root?.querySelector("#album-upload-status");
    if (target) target.innerHTML = uploadMarkup();
  }
  async function load(more = false) {
    if (busy || !root || session.snapshot().friend?.status !== "active") return;
    const version = generation;
    busy = true; error = ""; render();
    try {
      const data = await session.request("/album" + (more && cursor ? `?cursor=${cursor}` : ""));
      if (!root || version !== generation) return;
      items = more ? [...items, ...data.items.filter(item => !items.some(old => old.id === item.id))] : data.items;
      cursor = data.nextCursor; total = data.total; pending = data.pending || [];
    } catch (problem) { if (version === generation) error = problem.message; }
    finally { if (version === generation) { busy = false; render(); } }
  }
  async function loadThumbnail(item, target, version) {
    try {
      const bytes = await session.request(`/album/${item.id}/parts/-1`, { binary: true });
      if (!root || version !== generation) return;
      const url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
      const previous = urls.get(`thumb-${item.id}`); if (previous) URL.revokeObjectURL(previous);
      urls.set(`thumb-${item.id}`, url);
      const image = document.createElement("img"); image.src = url; image.alt = ""; image.decoding = "async";
      target.replaceChildren(image);
    } catch { /* The original remains available through the preview button. */ }
  }
  async function thumbnail(file) {
    if (!file.type.startsWith("image/")) return null;
    const bitmap = await createImageBitmap(file);
    try {
      const ratio = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.72));
      return blob?.size <= 131072 ? blob : null;
    } finally { bitmap.close(); }
  }
  async function sendUpload() {
    if (!upload || uploadController) return;
    const current = upload;
    uploadController = new AbortController();
    const signal = uploadController.signal;
    error = ""; render();
    try {
      current.status = "验证身份…"; renderUpload();
      await session.check();
      if (session.snapshot().friend?.status !== "active") throw new Error("身份尚未确认，无法上传。");
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (!current.prepared) {
        current.status = "准备文件…"; renderUpload();
        current.thumbnail = await thumbnail(current.file);
        current.prepared = true;
      }
      const created = await session.request("/album", { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        requestId: current.requestId, filename: current.file.name, mime: current.file.type, size: current.file.size, thumbnailSize: current.thumbnail?.size || 0
      }) });
      current.id = created.id;
      if (!created.ready) {
        const parts = Math.ceil(current.file.size / created.chunkSize);
        for (let part = 0; part < parts; part++) {
          current.status = `上传中 ${Math.round(part / parts * 100)}%`; renderUpload();
          await session.request(`/album/${created.id}/parts/${part}`, { method: "PUT", signal, headers: { "Content-Type": "application/octet-stream" }, body: current.file.slice(part * created.chunkSize, (part + 1) * created.chunkSize) });
          current.progress = Math.round((part + 1) / parts * 95);
        }
        if (current.thumbnail) await session.request(`/album/${created.id}/parts/-1`, { method: "PUT", signal, headers: { "Content-Type": "application/octet-stream" }, body: current.thumbnail });
        current.status = "正在完成…"; renderUpload();
        await session.request(`/album/${created.id}/complete`, { method: "POST", signal });
      }
      upload = null; notice = "上传完成。";
    } catch (problem) {
      current.status = problem.name === "AbortError" ? "已暂停，可重试或移除。" : `未能上传：${problem.message}`;
      error = problem.name === "AbortError" ? "" : problem.message;
    } finally { uploadController = null; render(); if (!upload) await load(); }
  }
  async function discard() {
    if (uploadController) { uploadController.abort(); return; }
    try {
      if (upload?.id) await session.request(`/album/${upload.id}`, { method: "DELETE" });
      upload = null; error = ""; render();
    } catch (problem) { error = problem.message; message(); }
  }
  function closePreview() {
    viewController?.abort(); viewController = null;
    root?.querySelector("#album-dialog")?.close();
    root?.querySelector("#album-media-stage")?.replaceChildren();
    const url = urls.get("preview"); if (url) URL.revokeObjectURL(url);
    urls.delete("preview");
  }
  async function preview(id) {
    const item = items.find(item => item.id === id);
    if (!item || !root) return;
    closePreview();
    const dialog = root.querySelector("#album-dialog");
    const stage = root.querySelector("#album-media-stage");
    const title = root.querySelector("#album-media-title");
    title.textContent = item.name;
    stage.innerHTML = `<p role="status">正在加载…</p>`;
    dialog.showModal();
    viewController = new AbortController();
    const signal = viewController.signal;
    try {
      const chunks = [];
      for (let part = 0; part < item.parts; part++) chunks.push(await session.request(`/album/${id}/parts/${part}`, { binary: true, signal }));
      if (signal.aborted || !root) return;
      const url = URL.createObjectURL(new Blob(chunks, { type: item.mime })); urls.set("preview", url);
      const media = document.createElement(item.mime.startsWith("video/") ? "video" : "img");
      media.src = url;
      if (media.tagName === "VIDEO") { media.controls = true; media.playsInline = true; media.preload = "metadata"; }
      else media.alt = item.name;
      media.addEventListener("error", () => { stage.textContent = "文件无法预览，请检查原文件格式。"; });
      stage.replaceChildren(media);
    } catch (problem) { if (!signal.aborted) stage.textContent = problem.message; }
  }
  async function change(event) {
    try {
      if (event.target.id === "friend-key-file") {
        const file = event.target.files[0]; if (!file) return;
        if (file.size > 2048) throw new Error("请选择有效的好友凭证文件。");
        const saved = JSON.parse(await file.text());
        if (saved.version !== 1 || saved.site !== "wmchouma.github.io") throw new Error("这不是雾眠筹码的好友凭证。");
        await session.restore(saved.token); notice = "身份已恢复。"; render(); await load();
      }
      if (event.target.id === "album-file") {
        const file = event.target.files[0]; if (!file) return;
        if (upload) throw new Error("请先重试或移除上次的上传。");
        if (!["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"].includes(file.type) ||
          file.size < 12 || file.size > (file.type.startsWith("video/") ? 20971520 : 8388608)) throw new Error("请选择 8 MB 内的 JPG、PNG、WebP 图片或 20 MB 内的 MP4、WebM 视频。");
        upload = { file, requestId: crypto.randomUUID(), progress: 0, status: "准备上传…" };
        notice = ""; await sendUpload();
      }
    } catch (problem) { error = problem instanceof SyntaxError ? "凭证文件格式不正确。" : problem.message; message(); }
  }
  async function click(event) {
    const button = event.target.closest("button");
    if (!button) return;
    try {
      if (button.hasAttribute("data-album-backup")) session.backup();
      if (button.hasAttribute("data-album-logout")) { uploadController?.abort(); closePreview(); session.forget(); items = []; pending = []; upload = null; render(); }
      if (button.hasAttribute("data-album-check") || button.hasAttribute("data-album-refresh")) { await session.check(); render(); await load(); }
      if (button.hasAttribute("data-album-more")) await load(true);
      if (button.hasAttribute("data-album-retry")) await sendUpload();
      if (button.hasAttribute("data-album-cancel")) uploadController?.abort();
      if (button.hasAttribute("data-album-discard")) await discard();
      if (button.dataset.albumOpen) await preview(button.dataset.albumOpen);
      if (button.hasAttribute("data-album-close")) closePreview();
      if (button.dataset.albumDelete) {
        if (!confirm("删除这件作品？此操作无法撤销。")) return;
        button.disabled = true;
        try { await session.request(`/album/${button.dataset.albumDelete}`, { method: "DELETE" }); notice = "作品已删除。"; await load(); }
        finally { button.disabled = false; }
      }
    } catch (problem) { error = problem.message; message(); }
  }
  async function recover(event) {
    if (event.target.id !== "album-recovery-form") return;
    event.preventDefault();
    const button = event.target.querySelector("button"); button.disabled = true;
    const key = session.createToken();
    session.pending(key);
    try {
      const invitation = String(new FormData(event.target).get("invitation")).trim();
      const data = await session.request("/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitation, credential: key }) });
      session.accept(key, data.friend); notice = "身份已恢复，请重新备份凭证。"; error = ""; render(); await load();
    } catch (problem) { error = problem.message; message(); }
    finally { button.disabled = false; }
  }
  function unmount() {
    generation++; observer?.disconnect(); closePreview();
    for (const url of urls.values()) URL.revokeObjectURL(url);
    urls.clear(); root = null; items = []; pending = []; busy = false;
    uploadController?.abort();
  }
  function mount(container) {
    root = container; error = ""; notice = "";
    if (!root.dataset.albumEvents) {
      root.dataset.albumEvents = "true";
      root.addEventListener("change", change); root.addEventListener("click", click); root.addEventListener("submit", recover);
    }
    root.querySelector("#album-dialog").addEventListener("cancel", closePreview);
    session.check().then(() => { if (root) { render(); load(); } });
    render();
  }
  window.addEventListener("friend-session-change", () => {
    if (!session.snapshot().friend || session.snapshot().friend.status !== "active") {
      closePreview();
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    }
    render();
  });
  window.friendAlbum = { page, mount, unmount };
})();
