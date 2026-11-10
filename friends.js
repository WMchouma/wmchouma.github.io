(() => {
  const api = window.wumianBackend.apiBase + "/friends";
  const questions = [
    { title: "我最喜欢的歌手是谁？", options: ["周杰伦", "洛天依", "陈奕迅", "初音未来"] },
    { title: "我喜欢玩电脑还是手机？", options: ["电脑", "手机"] },
    { title: "我的生日是什么？", options: ["五月一日", "七月一日", "六月一日", "十月一日"] },
    { title: "我是男的还是女的？", options: ["男的", "女的"] },
    { title: "我胖还是瘦？", options: ["胖", "瘦"] },
    { title: "我喜欢的季节？", options: ["春天", "夏天", "秋天", "冬天"] },
    { title: "我喜欢的天气？", options: ["雨天", "晴天", "阴天", "雪天"] },
    { title: "我喜欢玩的游戏类型？", options: ["RPG", "SLG", "FPS", "MOBA"] },
    { title: "我喜欢的虚拟主播是谁？", options: ["东雪莲", "向晚", "嘉然", "永雏塔菲"] },
    { title: "我喜欢画画吗？", options: ["喜欢", "不喜欢"] }
  ];
  const escape = (text = "") => String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const normalize = text => String(text).normalize("NFKC").replace(/\s+/gu, "").toLowerCase();
  const cleanName = text => String(text).normalize("NFKC").replace(/\s+/gu, " ").trim();
  const validName = text => text.length > 0 && text.length <= 20 && !/[\p{Cc}\p{Cf}]/u.test(text);
  const initialState = () => ({ phase: "name", name: "", answers: Array(questions.length).fill(""), index: 0, score: null, requestId: crypto.randomUUID(), credential: window.friendSession.createToken(), error: "" });
  let state = initialState();
  let root;
  let friends = [];
  let total = 0;
  let nextCursor = null;
  let loading = false;
  let refreshQueued = false;
  let loaded = false;
  let listError = "";

  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal, credentials: "omit", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "暂时无法连接，请稍后重试。");
      return data;
    } catch (error) {
      if (error instanceof TypeError || error.name === "AbortError" || error instanceof SyntaxError) {
        throw new Error("连接超时或网络不可用，请重试。");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  function renderRoster() {
    const roster = root?.querySelector("#friends-roster");
    if (roster) roster.innerHTML = listMarkup();
  }

  async function loadFriends(more = false) {
    if (loading) {
      if (!more) refreshQueued = true;
      return;
    }
    loading = true;
    listError = "";
    renderRoster();
    try {
      const currentCursor = more && nextCursor ? nextCursor : null;
      const data = await request(api + (currentCursor ? `?cursor=${encodeURIComponent(currentCursor)}` : ""));
      if (!Array.isArray(data.friends) || !Number.isSafeInteger(data.total) || data.total < 0 ||
        (data.nextCursor !== null && !/^[1-9]\d*$/.test(data.nextCursor)) ||
        data.friends.some(item => !Number.isSafeInteger(item.id) || typeof item.name !== "string" ||
          !validName(item.name) || !Number.isInteger(item.score) || item.score < 8 || item.score > 10 ||
          typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date)))) {
        throw new Error("名单暂时无法读取，请重试。");
      }
      friends = more ? [...friends, ...data.friends.filter(item => !friends.some(existing => existing.id === item.id))] : data.friends;
      total = data.total;
      nextCursor = data.nextCursor && data.nextCursor !== currentCursor ? data.nextCursor : null;
      loaded = true;
    } catch (error) {
      listError = error.message;
    } finally {
      loading = false;
      renderRoster();
      if (refreshQueued) {
        refreshQueued = false;
        loadFriends();
      }
    }
  }

  function listMarkup() {
    return `<section class="friends-roster" aria-labelledby="roster-heading" aria-busy="${loading}">
      <div class="friends-roster-heading"><h2 id="roster-heading">好朋友名单</h2><span>${loaded ? `${total} 人` : "—"}</span><button class="friend-text-button" data-friend-refresh ${loading ? "disabled" : ""}>刷新</button></div>
      <p class="friends-note">所有访客共享这份名单。</p>
      ${listError ? `<p class="friends-error" role="alert">${escape(listError)}</p>` : ""}
      ${loading ? `<p class="friends-note" role="status">正在读取名单…</p>` : ""}
      ${friends.length ?
        `<ul class="friend-list">${friends.map(item => `<li><span class="friend-initial" aria-hidden="true">${escape(Array.from(item.name)[0])}</span><div><h3>${escape(item.name)}</h3><time datetime="${escape(item.date)}">${new Date(item.date).toLocaleDateString("zh-CN")}</time>${item.status === "pending" ? `<small class="member-status">待确认身份</small>` : ""}</div><span class="friend-score">${item.score * 10}%</span></li>`).join("")}</ul>` :
        loaded && !loading && !listError ? `<div class="friends-empty"><span aria-hidden="true">♡</span><p>还没有朋友加入。</p></div>` : ""}
      ${nextCursor ? `<button class="glass-button friend-more" data-friend-more ${loading ? "disabled" : ""}>查看更多</button>` : ""}
    </section>`;
  }

  function stageMarkup() {
    if (state.phase === "name") return `<form id="friend-name-form" class="friend-name-form">
      <span class="friend-step">01 / 留个名字</span><h2 id="friend-stage-heading" tabindex="-1">你叫什么名字？</h2>
      <p class="friend-intro">10 道单选题，答对 8 道就能加入。</p>
      <label class="friend-label" for="friend-name">名字</label>
      <input id="friend-name" name="name" class="friend-input" value="${escape(state.name)}" placeholder="你的名字" autocomplete="nickname" maxlength="20" required aria-describedby="friend-name-error">
      <p id="friend-name-error" class="friends-error" role="alert" hidden></p>
      <button class="glass-button primary" type="submit">开始答题 <span aria-hidden="true">→</span></button>
      <p class="friends-note">名字和成绩会公开显示。相册上传需另行确认身份。</p>
      <a class="back-link" href="#album">已有好友凭证？进入相册</a>
    </form>`;
    if (state.phase === "submitting") return `<div class="friend-result" role="status" aria-busy="true"><span class="friend-step">03 / 提交答案</span><h2 id="friend-stage-heading" tabindex="-1">正在核对答案…</h2><p class="friend-intro">稍等一下。</p></div>`;
    if (state.phase === "submit-error") return `<div class="friend-result"><span class="friend-step">03 / 提交答案</span><h2 id="friend-stage-heading" tabindex="-1">暂时未能完成。</h2><p class="friends-error" role="alert">${escape(state.error)}</p><div class="friend-actions"><button class="glass-button primary" data-friend-send>重新提交</button><button class="friend-text-button" data-friend-reset>换个名字</button></div></div>`;
    if (state.phase === "result") {
      const passed = state.score >= 8;
      return `<div class="friend-result">
        <span class="friend-step">03 / 答题结果</span><h2 id="friend-stage-heading" tabindex="-1">${passed ? "欢迎，好朋友。" : "再了解我一点。"}</h2>
        <p class="result-score ${passed ? "result-pass" : ""}">${state.score * 10}<span>%</span></p>
        <p class="friend-intro">${escape(state.name)}，答对 ${state.score} / 10 道。</p>
        <p id="friend-save-status" class="friends-note" role="status">${passed ? "已加入名单。请到相册获取核验码，联系站点主人确认身份。" : `还差 ${8 - state.score} 道就能加入。`}</p>
        <div class="friend-actions">${passed ? `<a class="glass-button primary" href="#album">进入挚友相册</a><button class="friend-text-button" data-friend-backup>备份好友凭证</button>` : `<button class="glass-button primary" data-friend-retry>重新答题</button>`}<button class="friend-text-button" data-friend-reset>换个名字</button></div>
        ${passed ? `<p class="friends-note">换设备时可导入凭证。请妥善保管，不要分享。</p>` : ""}
      </div>`;
    }
    const question = questions[state.index];
    const value = state.answers[state.index];
    return `<form id="friend-question-form">
      <div class="friend-quiz-top"><span class="friend-step">02 / ${escape(state.name)}</span><span class="friend-question-count">第 ${state.index + 1} / 10 题</span></div>
      <progress class="friend-progress" value="${state.index}" max="10" aria-label="答题进度">${state.index} / 10</progress>
      <fieldset class="friend-question"><legend id="friend-stage-heading" tabindex="-1">${escape(question.title)}</legend>
        <div class="friend-options">${question.options.map(option => `<label class="friend-option"><input type="radio" name="answer" value="${escape(option)}" ${value === option ? "checked" : ""} required><span>${escape(option)}</span></label>`).join("")}</div>
      </fieldset>
      <div class="friend-actions"><button type="button" class="friend-text-button" data-friend-back>${state.index ? "上一题" : "修改名字"}</button><button class="glass-button primary" type="submit">${state.index === 9 ? "提交答案" : "下一题"}<span aria-hidden="true">→</span></button></div>
      <p class="friends-note">答对至少 8 道即可加入。</p>
    </form>`;
  }

  function page() {
    return `<section class="collection-view friends-view">
      <div class="page-heading"><div><h1>好朋友名单</h1><p>你有多了解我？</p></div><a class="glass-button" href="#album">挚友相册 <span aria-hidden="true">→</span></a></div>
      <div class="friends-layout"><section class="friend-quiz" aria-labelledby="friend-stage-heading">${stageMarkup()}</section><div id="friends-roster">${listMarkup()}</div></div>
      <a class="back-link" href="#home"><span aria-hidden="true">←</span>返回开始</a>
    </section>`;
  }

  function renderStage() {
    if (!root?.querySelector(".friend-quiz")) return;
    root.querySelector(".friend-quiz").innerHTML = stageMarkup();
    renderRoster();
    root.querySelector("#friend-stage-heading").focus({ preventScroll: true });
    root.querySelector(".friend-quiz").scrollIntoView({ block: "nearest", behavior: "instant" });
  }

  async function sendAnswers() {
    if (state.phase === "submitting") return;
    state.phase = "submitting";
    renderStage();
    try {
      window.friendSession.pending(state.credential);
      const result = await request(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name, answers: state.answers, requestId: state.requestId, credential: state.credential })
      });
      if (!Number.isInteger(result.score) || result.score < 0 || result.score > 10 || result.passed !== (result.score >= 8) ||
        (result.passed && !result.friend)) throw new Error("结果暂时无法确认，请重试。");
      state.score = result.score;
      state.phase = "result";
      if (result.passed) {
        window.friendSession.accept(state.credential, result.friend);
        await loadFriends();
      } else window.friendSession.clearPending();
    } catch (error) {
      state.error = error.message;
      state.phase = "submit-error";
    }
    renderStage();
  }

  function submit(event) {
    if (!event.target.matches("#friend-name-form, #friend-question-form")) return;
    event.preventDefault();
    if (event.target.id === "friend-name-form") {
      const name = cleanName(new FormData(event.target).get("name") || "");
      const error = root.querySelector("#friend-name-error");
      const exists = friends.some(item => normalize(item.name) === normalize(name));
      if (!validName(name) || exists) {
        error.textContent = exists ? "名字已使用。同名请加备注；已有账号请导入凭证，丢失请联系站点主人。" : "请输入 1–20 个字的名字。";
        error.hidden = false;
        root.querySelector("#friend-name").setAttribute("aria-invalid", "true");
        root.querySelector("#friend-name").focus();
        return;
      }
      state.name = name;
      state.phase = "quiz";
      renderStage();
      return;
    }
    const answer = String(new FormData(event.target).get("answer") || "").trim();
    if (!questions[state.index].options.includes(answer)) return;
    state.answers[state.index] = answer;
    if (state.index < questions.length - 1) state.index++;
    else {
      sendAnswers();
      return;
    }
    renderStage();
  }

  function click(event) {
    if (event.target.closest("[data-friend-backup]")) { window.friendSession.backup(); return; }
    if (event.target.closest("[data-friend-refresh]")) { loadFriends(); return; }
    if (event.target.closest("[data-friend-more]")) { loadFriends(true); return; }
    if (event.target.closest("[data-friend-send]")) { sendAnswers(); return; }
    if (event.target.closest("[data-friend-back]")) {
      const form = root.querySelector("#friend-question-form");
      state.answers[state.index] = String(new FormData(form).get("answer") || "");
      if (state.index) state.index--;
      else state.phase = "name";
    } else if (event.target.closest("[data-friend-retry]")) {
      state = { ...initialState(), name: state.name, phase: "quiz" };
    } else if (event.target.closest("[data-friend-reset]")) state = initialState();
    else return;
    renderStage();
  }

  function mount(container) {
    root = container;
    // Attach once: the app replaces the route contents, not the main element.
    if (!root.dataset.friendEvents) {
      root.dataset.friendEvents = "true";
      root.addEventListener("submit", submit);
      root.addEventListener("click", click);
      root.addEventListener("input", event => {
        if (event.target.matches("#friend-name")) {
          state.name = event.target.value;
          event.target.removeAttribute("aria-invalid");
          root.querySelector("#friend-name-error").hidden = true;
        }
        if (event.target.name === "answer") state.answers[state.index] = event.target.value;
      });
    }
    loadFriends();
  }
  window.friendBook = { page, mount };
})();
