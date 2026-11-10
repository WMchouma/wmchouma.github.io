(() => {
  const key = "wumian-friends-v1";
  const questions = [
    { title: "我的真名是什么？", answers: ["李健辰"] },
    { title: "我喜欢玩电脑还是手机？", options: ["电脑", "手机"], answers: ["电脑"] },
    { title: "我的生日是什么？", answers: ["六月一日", "六月一号", "6月1日", "6月1号", "6月一日", "6.1", "6/1", "6-1", "06.01", "06/01", "06-01", "0601"] },
    { title: "我是男的还是女的？", options: ["男的", "女的"], answers: ["男的"] },
    { title: "我胖还是瘦？", options: ["胖", "瘦"], answers: ["瘦"] },
    { title: "我喜欢的季节？", options: ["春天", "夏天", "秋天", "冬天"], answers: ["冬天"] },
    { title: "我喜欢的天气？", options: ["晴天", "雨天", "阴天", "雪天"], answers: ["晴天"] },
    { title: "我喜欢玩的游戏类型？", answers: ["FPS"] },
    { title: "我喜欢的虚拟主播是谁？", answers: ["永雏塔菲"] },
    { title: "我喜欢画画吗？", options: ["喜欢", "不喜欢"], answers: ["不喜欢"] }
  ];
  const escape = (text = "") => String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const normalize = text => String(text).normalize("NFKC").replace(/\s+/gu, "").toLocaleLowerCase();
  const cleanName = text => String(text).normalize("NFKC").replace(/\s+/gu, " ").trim();
  const validName = text => text.length > 0 && text.length <= 20 && !/[\p{Cc}\p{Cf}]/u.test(text);
  const initialState = () => ({ phase: "name", name: "", answers: Array(questions.length).fill(""), index: 0, score: null, saved: false });
  let state = initialState();
  let root;
  let storageError = false;
  let scoring = false;

  function readFriends() {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(parsed)) throw new Error("Invalid friend list");
      storageError = false;
      return parsed.filter(item => item && typeof item.name === "string" && validName(item.name) &&
        Number.isInteger(item.score) && item.score >= 8 && item.score <= 10 && typeof item.date === "string" &&
        Number.isFinite(Date.parse(item.date)));
    } catch {
      storageError = true;
      return [];
    }
  }

  function listMarkup() {
    const friends = readFriends();
    return `<section class="friends-roster" aria-labelledby="roster-heading">
      <div class="friends-roster-heading"><h2 id="roster-heading">好朋友名单</h2><span>${friends.length} 人</span></div>
      <p class="friends-note">仅保存在当前浏览器，不会同步到其他设备。</p>
      ${storageError ? `<p class="friends-error" role="alert">暂时无法读取名单，请允许浏览器保存网站数据后重试。</p>` : friends.length ?
        `<ul class="friend-list">${friends.map(item => `<li><span class="friend-initial" aria-hidden="true">${escape(Array.from(item.name)[0])}</span><div><h3>${escape(item.name)}</h3><time datetime="${escape(item.date)}">${new Date(item.date).toLocaleDateString("zh-CN")}</time></div><span class="friend-score">${item.score * 10}%</span></li>`).join("")}</ul>` :
        `<div class="friends-empty"><span aria-hidden="true">♡</span><p>还没有朋友加入。</p></div>`}
    </section>`;
  }

  function stageMarkup() {
    if (state.phase === "name") return `<form id="friend-name-form" class="friend-name-form">
      <span class="friend-step">01 / 留个名字</span><h2 id="friend-stage-heading" tabindex="-1">你叫什么名字？</h2>
      <p class="friend-intro">10 道题，答对 8 道就能加入。</p>
      <label class="friend-label" for="friend-name">名字</label>
      <input id="friend-name" name="name" class="friend-input" value="${escape(state.name)}" placeholder="你的名字" autocomplete="nickname" maxlength="20" required aria-describedby="friend-name-error">
      <p id="friend-name-error" class="friends-error" role="alert" hidden></p>
      <button class="glass-button primary" type="submit">开始答题 <span aria-hidden="true">→</span></button>
    </form>`;
    if (state.phase === "result") {
      const passed = state.score >= 8;
      return `<div class="friend-result">
        <span class="friend-step">03 / 答题结果</span><h2 id="friend-stage-heading" tabindex="-1">${passed ? state.saved ? "欢迎，好朋友。" : "答题通过。" : "再了解我一点。"}</h2>
        <p class="result-score ${passed ? "result-pass" : ""}">${state.score * 10}<span>%</span></p>
        <p class="friend-intro">${escape(state.name)}，答对 ${state.score} / 10 道。</p>
        <p id="friend-save-status" class="friends-note" role="status">${passed ? state.saved ? "你的名字已加入本机名单。" : "名单保存失败，请重试。" : `还差 ${8 - state.score} 道就能加入。`}</p>
        <div class="friend-actions">${passed && !state.saved ? `<button class="glass-button primary" data-friend-save>重试保存</button>` : ""}<button class="glass-button ${passed ? "" : "primary"}" data-friend-retry>${passed ? "再答一次" : "重新答题"}</button><button class="friend-text-button" data-friend-reset>换个名字</button></div>
      </div>`;
    }
    const question = questions[state.index];
    const value = state.answers[state.index];
    return `<form id="friend-question-form">
      <div class="friend-quiz-top"><span class="friend-step">02 / ${escape(state.name)}</span><span class="friend-question-count">第 ${state.index + 1} / 10 题</span></div>
      <progress class="friend-progress" value="${state.index}" max="10" aria-label="答题进度">${state.index} / 10</progress>
      <fieldset class="friend-question"><legend id="friend-stage-heading" tabindex="-1">${escape(question.title)}</legend>
        ${question.options ? `<div class="friend-options">${question.options.map((option, index) => `<label class="friend-option"><input type="radio" name="answer" value="${escape(option)}" ${value === option ? "checked" : ""} required><span>${escape(option)}</span></label>`).join("")}</div>` :
          `<label class="sr-only" for="friend-answer">你的答案</label><input id="friend-answer" class="friend-input" name="answer" value="${escape(value)}" placeholder="输入答案" maxlength="40" autocomplete="off" spellcheck="false" required>`}
      </fieldset>
      <div class="friend-actions"><button type="button" class="friend-text-button" data-friend-back>${state.index ? "上一题" : "修改名字"}</button><button class="glass-button primary" type="submit">${state.index === 9 ? "提交答案" : "下一题"}<span aria-hidden="true">→</span></button></div>
      <p class="friends-note">答对至少 8 道即可加入。</p>
    </form>`;
  }

  function page() {
    return `<section class="collection-view friends-view">
      <div class="page-heading"><div><h1>好朋友名单</h1><p>你有多了解我？</p></div><span class="count-pill">80% 就能加入</span></div>
      <div class="friends-layout"><section class="friend-quiz" aria-labelledby="friend-stage-heading">${stageMarkup()}</section><div id="friends-roster">${listMarkup()}</div></div>
      <a class="back-link" href="#home"><span aria-hidden="true">←</span>返回开始</a>
    </section>`;
  }

  function renderStage() {
    if (!root?.querySelector(".friend-quiz")) return;
    root.querySelector(".friend-quiz").innerHTML = stageMarkup();
    root.querySelector("#friends-roster").innerHTML = listMarkup();
    root.querySelector("#friend-stage-heading").focus({ preventScroll: true });
    root.querySelector(".friend-quiz").scrollIntoView({ block: "nearest", behavior: "instant" });
  }

  function saveRegistration() {
    if (state.score < 8 || !validName(state.name)) return;
    const friends = readFriends();
    if (storageError) { state.saved = false; return; }
    const existing = friends.find(item => normalize(item.name) === normalize(state.name));
    if (existing) existing.score = Math.max(existing.score, state.score);
    else friends.push({ name: state.name, score: state.score, date: new Date().toISOString() });
    try {
      // Show success only after persistence succeeds; unavailable storage must not look like registration.
      localStorage.setItem(key, JSON.stringify(friends));
      state.saved = true;
    } catch {
      state.saved = false;
    }
  }

  function submit(event) {
    if (!event.target.matches("#friend-name-form, #friend-question-form")) return;
    event.preventDefault();
    if (event.target.id === "friend-name-form") {
      const name = cleanName(new FormData(event.target).get("name") || "");
      const error = root.querySelector("#friend-name-error");
      const exists = readFriends().some(item => normalize(item.name) === normalize(name));
      if (!validName(name) || exists || storageError) {
        error.textContent = storageError ? "浏览器无法保存名单，请允许保存网站数据后重试。" : exists ? "这个名字已在本机名单里，换个名字吧。" : "请输入 1–20 个字的名字。";
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
    if (!answer) {
      const field = event.target.querySelector(".friend-input");
      if (field) { field.setCustomValidity("请填写答案。"); field.reportValidity(); }
      return;
    }
    state.answers[state.index] = answer;
    if (state.index < questions.length - 1) state.index++;
    else if (!scoring) {
      scoring = true;
      state.score = questions.reduce((score, question, index) => score + Number(question.answers.some(answer => normalize(answer) === normalize(state.answers[index]))), 0);
      state.phase = "result";
      if (state.score >= 8) saveRegistration();
      scoring = false;
    }
    renderStage();
  }

  function click(event) {
    if (event.target.closest("[data-friend-back]")) {
      const form = root.querySelector("#friend-question-form");
      state.answers[state.index] = String(new FormData(form).get("answer") || "");
      if (state.index) state.index--;
      else state.phase = "name";
    } else if (event.target.closest("[data-friend-retry]")) {
      state = { ...initialState(), name: state.name, phase: "quiz" };
    } else if (event.target.closest("[data-friend-reset]")) state = initialState();
    else if (event.target.closest("[data-friend-save]")) saveRegistration();
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
        if (event.target.matches("#friend-answer")) event.target.setCustomValidity("");
        if (event.target.matches("#friend-name")) {
          state.name = event.target.value;
          event.target.removeAttribute("aria-invalid");
          root.querySelector("#friend-name-error").hidden = true;
        }
        if (event.target.name === "answer") state.answers[state.index] = event.target.value;
      });
    }
  }
  window.addEventListener("storage", event => {
    if (event.key !== key || !root?.querySelector("#friends-roster")) return;
    root.querySelector("#friends-roster").innerHTML = listMarkup();
  });
  window.friendBook = { page, mount };
})();
