(() => {
  const questions = [
    { title: "我最喜欢的歌手是谁？", options: ["周杰伦", "洛天依", "陈奕迅", "初音未来"], correct: 1 },
    { title: "我喜欢玩电脑还是手机？", options: ["电脑", "手机"], correct: 0 },
    { title: "我的生日是什么？", options: ["五月一日", "七月一日", "六月一日", "十月一日"], correct: 2 },
    { title: "我是男的还是女的？", options: ["男的", "女的"], correct: 0 },
    { title: "我胖还是瘦？", options: ["胖", "瘦"], correct: 1 },
    { title: "我喜欢的季节？", options: ["春天", "夏天", "秋天", "冬天"], correct: 3 },
    { title: "我喜欢的天气？", options: ["雨天", "晴天", "阴天", "雪天"], correct: 1 },
    { title: "我喜欢玩的游戏类型？", options: ["RPG", "SLG", "FPS", "MOBA"], correct: 2 },
    { title: "我喜欢的虚拟主播是谁？", options: ["东雪莲", "向晚", "嘉然", "永雏塔菲"], correct: 3 },
    { title: "我喜欢画画吗？", options: ["喜欢", "不喜欢"], correct: 1 }
  ];
  const initial = () => ({ phase: "start", index: 0, answers: Array(questions.length).fill("") });
  let state = initial();
  let root;
  function stage() {
    if (state.phase === "start") return `<div><span class="friend-step">了解程度测试</span><h2 id="friend-stage-heading" tabindex="-1">你有多了解我？</h2><p class="friend-intro">10 道选择题，测测我们的默契。</p><button class="glass-button primary" data-quiz-start>开始测试 →</button><p class="friends-note">结果仅在当前页面显示，不保存。</p></div>`;
    if (state.phase === "result") {
      const score = questions.reduce((total, question, index) => total + Number(state.answers[index] === question.options[question.correct]), 0);
      return `<div class="friend-result"><span class="friend-step">了解程度</span><h2 id="friend-stage-heading" tabindex="-1">${score >= 8 ? "很有默契。" : "再了解我一点。"}</h2><p class="result-score ${score >= 8 ? "result-pass" : ""}">${score * 10}<span>%</span></p><p class="friend-intro">答对 ${score} / 10 道。</p><button class="glass-button primary" data-quiz-start>重新测试</button></div>`;
    }
    const question = questions[state.index];
    return `<form id="quiz-question-form"><div class="friend-quiz-top"><span class="friend-step">了解程度测试</span><span class="friend-question-count">第 ${state.index + 1} / 10 题</span></div><progress class="friend-progress" value="${state.index}" max="10" aria-label="答题进度">${state.index} / 10</progress><fieldset class="friend-question"><legend id="friend-stage-heading" tabindex="-1">${question.title}</legend><div class="friend-options">${question.options.map(option => `<label class="friend-option"><input type="radio" name="answer" value="${option}" ${state.answers[state.index] === option ? "checked" : ""} required><span>${option}</span></label>`).join("")}</div></fieldset><div class="friend-actions"><button type="button" class="friend-text-button" data-quiz-back>${state.index ? "上一题" : "返回"}</button><button class="glass-button primary" type="submit">${state.index === 9 ? "查看结果" : "下一题"} →</button></div></form>`;
  }
  function page() {
    return `<section class="collection-view quiz-view"><div class="page-heading"><div><h1>默契测试</h1><p>关于我的十件小事。</p></div></div><div class="quiz-layout"><section class="quiz-card" aria-labelledby="friend-stage-heading">${stage()}</section></div><a class="back-link" href="#home">← 返回开始</a></section>`;
  }
  function render() {
    const target = root?.querySelector(".quiz-card");
    if (!target) return;
    target.innerHTML = stage();
    target.querySelector("#friend-stage-heading").focus({ preventScroll: true });
  }
  function mount(container) {
    root = container;
    if (root.dataset.quizEvents) return;
    root.dataset.quizEvents = "true";
    root.addEventListener("submit", event => {
      if (event.target.id !== "quiz-question-form") return;
      event.preventDefault();
      const answer = new FormData(event.target).get("answer");
      if (!questions[state.index].options.includes(answer)) return;
      state.answers[state.index] = answer;
      if (state.index === questions.length - 1) state.phase = "result";
      else state.index++;
      render();
    });
    root.addEventListener("change", event => {
      if (event.target.matches('#quiz-question-form input[name="answer"]')) state.answers[state.index] = event.target.value;
    });
    root.addEventListener("click", event => {
      if (event.target.closest("[data-quiz-start]")) state = { ...initial(), phase: "quiz" };
      else if (event.target.closest("[data-quiz-back]")) {
        if (state.index) state.index--;
        else state.phase = "start";
      } else return;
      render();
    });
  }
  window.friendBook = { page, mount };
})();
