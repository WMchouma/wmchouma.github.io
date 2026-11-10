const content = window.siteContent;
const main = document.querySelector("main");
const names = { home: "开始", music: "音乐", photos: "摄影", friends: "朋友" };
const featured = content.music.find(item => item.featured);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const symbols = { play: "▶", pause: "Ⅱ", music: "♫", photo: "▣", external: "↗", back: "←", star: "☆", wide: "◫", grid: "▦", search: "⌕", close: "×" };
const icon = name => `<span class="symbol" aria-hidden="true">${symbols[name] || ""}</span>`;
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const safeLink = value => {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? escapeHtml(url.href) : ""; }
  catch { return ""; }
};
const safeImage = (value = "") => /^\s*(?:javascript|data|vbscript):/i.test(value) ? "" : escapeHtml(value);
const readPreference = key => { try { return localStorage.getItem(`wumian-${key}`); } catch { return null; } };
const savePreference = (key, value) => { try { localStorage.setItem(`wumian-${key}`, String(value)); } catch { /* Preferences are optional in private/file contexts. */ } };
let photoColumns = readPreference("columns") === "2" ? 2 : 3;
let query = "";
let route;
let keyboardInput = false;
const galleryCount = () => {
  const videos = content.photos.filter(item => item.type === "video").length;
  const photos = content.photos.length - videos;
  return [photos ? `${photos} 张照片` : "", videos ? `${videos} 段视频` : ""].filter(Boolean).join(" · ") || "暂无作品";
};
document.addEventListener("keydown", () => { keyboardInput = true; document.documentElement.classList.add("keyboard-input"); });
document.addEventListener("pointerdown", () => { keyboardInput = false; document.documentElement.classList.remove("keyboard-input"); });

function playButton(className = "glass-button primary") {
  return `<button class="${className}" data-play aria-label="播放${escapeHtml(featured?.title)}">${icon("play")}<span class="play-label">播放</span></button>`;
}

function homePage() {
  return `<section class="home-view">
    <div class="nature-hero">
      <div class="home-art" aria-hidden="true"><img src="assets/cloud-sky.webp" alt="" width="1920" height="1080" fetchpriority="high"></div>
      <div class="home-intro"><h1>雾眠筹码</h1><p class="intro-copy">喜欢的音乐，拍下的日常。</p></div>
      <div class="portal-area" aria-label="探索收藏">
        <a class="portal music-portal" href="#music"><span class="orb portal-icon blue-orb">${icon("music")}</span><div class="portal-copy"><h2>音乐</h2><p>${content.music.length} 首收藏</p></div></a>
        <a class="portal photo-portal" href="#photos"><span class="orb portal-icon green-orb">${icon("photo")}</span><div class="portal-copy"><h2>摄影</h2><p>${galleryCount()}</p></div></a>
      </div>
    </div>
    ${featured ? `<div class="home-feature"><div><span class="featured-label">${icon("star")}首推</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.artist)}</p></div>${playButton()}</div>` : ""}
    <a class="home-friends" href="#friends"><span class="orb nav-orb green-orb" aria-hidden="true">♡</span><span><strong>好朋友名单</strong><small>10 道题，答对 8 道就能加入。</small></span><span aria-hidden="true">→</span></a>
  </section>`;
}

function musicPage() {
  return `<section class="collection-view music-view">
    <div class="page-heading"><div><h1>音乐</h1><p>留在这里，慢慢听。</p></div><span class="count-pill">${icon("music")}${content.music.length} 首收藏</span></div>
    ${featured ? `<article class="featured-track" aria-label="首推音乐：${escapeHtml(featured.title)}"><div class="featured-track-info"><span class="featured-label">${icon("star")}首推</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.artist)}</p></div><div class="featured-playback">${featured.src ? playButton() : ""}${safeLink(featured.url) ? `<a class="back-link" href="${safeLink(featured.url)}" target="_blank" rel="noopener noreferrer">网易云${icon("external")}</a>` : ""}</div></article>` : ""}
    <div class="music-toolbar"><h2>全部收藏 <span id="result-count" role="status"></span></h2><div class="search-field"><label for="music-search" class="sr-only">搜索歌曲或歌手</label>${icon("search")}<input id="music-search" type="search" placeholder="搜索歌曲或歌手" value="${escapeHtml(query)}" autocomplete="off" spellcheck="false"><button id="clear-search" class="icon-button" aria-label="清除搜索" title="清除搜索" ${query ? "" : "hidden"}>${icon("close")}</button></div></div>
    <div id="music-results"></div>
    <a class="back-link" href="#home">${icon("back")}返回开始</a>
  </section>`;
}

function renderMusicResults() {
  const normalized = query.trim().normalize("NFKC").toLocaleLowerCase();
  const tracks = content.music.map((item, index) => ({ item, index })).filter(({ item }) =>
    `${item.title} ${item.artist}`.normalize("NFKC").toLocaleLowerCase().includes(normalized));
  document.getElementById("result-count").textContent = normalized ? `${tracks.length} 首匹配` : `${tracks.length} 首`;
  document.getElementById("clear-search").hidden = !query;
  document.getElementById("music-results").innerHTML = tracks.length ? `<div class="list-labels" aria-hidden="true"><span></span><span>歌曲 / 歌手</span><span>收听</span></div><div class="music-list">${tracks.map(({ item, index }) => {
    const action = item.featured && item.src ? `<button class="icon-button track-link" data-play aria-label="播放${escapeHtml(item.title)}" title="播放${escapeHtml(item.title)}">${icon("play")}</button>` : safeLink(item.url) ? `<a class="icon-button track-link" href="${safeLink(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="在网易云打开${escapeHtml(item.title)}" title="在网易云打开">${icon("external")}</a>` : `<span class="unavailable">暂无链接</span>`;
    return `<article class="music-item ${item.featured ? "is-featured" : ""}"><span class="track-number" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span><div class="track-text"><h3>${escapeHtml(item.title || "未命名音乐")}</h3><p>${escapeHtml(item.artist || "艺人待填写")}</p></div>${action}</article>`;
  }).join("")}</div>` : `<div class="search-empty"><span class="symbol" aria-hidden="true">⌕</span><h3>没有找到歌曲</h3><p>试试其他歌名或歌手。</p><button class="glass-button" data-reset-search>清除搜索</button></div>`;
  syncPlayer();
}

function galleryMarkup() {
  if (content.photos.length) return `<div class="photo-grid columns-${photoColumns}">${content.photos.map((photo, index) => `<button class="photo-item" data-photo="${index}" aria-label="${photo.type === "video" ? "播放" : "查看"}${escapeHtml(photo.title || `照片 ${index + 1}`)}"><span class="photo-image"><img src="${safeImage(photo.thumbnail || photo.src)}" alt="${escapeHtml(photo.alt || photo.title || "摄影作品")}" loading="lazy" decoding="async">${photo.type === "video" ? `<span class="video-badge" aria-hidden="true">${icon("play")}视频</span>` : ""}</span><span>${escapeHtml(photo.title || "未命名照片")}</span></button>`).join("")}</div>`;
  return `<div class="gallery-empty"><div class="empty-photo-grid columns-${photoColumns}" aria-hidden="true">${Array.from({ length: photoColumns }, () => `<div class="photo-slot">${icon("photo")}</div>`).join("")}</div><div class="gallery-empty-message"><h2>暂无照片</h2><p>拍下的日常，会放在这里。</p></div></div>`;
}

function photosPage() {
  return `<section class="collection-view photos-view">
    <div class="page-heading"><div><h1>摄影</h1><p>把日常留在光里。</p></div><span class="count-pill">${icon("photo")}${galleryCount()}</span></div>
    <div class="gallery-toolbar"><h2>全部作品</h2><div class="view-switch" role="group" aria-label="照片布局"><button class="icon-button" data-columns="2" aria-label="宽幅布局" aria-pressed="${photoColumns === 2}" title="宽幅布局">${icon("wide")}</button><button class="icon-button" data-columns="3" aria-label="紧凑布局" aria-pressed="${photoColumns === 3}" title="紧凑布局">${icon("grid")}</button></div></div>
    <div id="gallery-content">${galleryMarkup()}</div><a class="back-link" href="#home">${icon("back")}返回开始</a>
  </section>`;
}

function render() {
  const requested = window.location.hash.slice(1) || "home";
  route = Object.hasOwn(names, requested) ? requested : "home";
  if (requested !== route) history.replaceState(null, "", `#${route}`);
  document.getElementById("photo-dialog").close();
  main.innerHTML = ({ home: homePage, music: musicPage, photos: photosPage, friends: window.friendBook.page })[route]();
  document.title = `${names[route]} · 雾眠筹码`;
  document.getElementById("location-name").textContent = names[route];
  document.getElementById("status-text").textContent = ({ home: "音乐与摄影", music: "音乐收藏", photos: "摄影作品", friends: "好朋友名单 · 共享名单" })[route];
  document.getElementById("item-count").textContent = route === "home" ? `${content.music.length} 首音乐 / ${galleryCount()}` : "";
  document.querySelectorAll("[data-route]").forEach(link => {
    if (link.dataset.route === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (route === "music") renderMusicResults();
  if (route === "friends") window.friendBook.mount(main);
  syncPlayer();
  if (!keyboardInput && !reducedMotion.matches) {
    main.getAnimations().forEach(animation => animation.cancel());
    main.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 180, easing: "cubic-bezier(.23,1,.32,1)" });
  }
}

const audio = document.getElementById("site-audio");
const dock = document.getElementById("player-dock");
const seek = document.getElementById("seek");
const volume = document.getElementById("volume");
const playerMessage = document.getElementById("player-message");
let pendingPlay = false;
let playRequest = 0;
const formatTime = seconds => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};
if (featured?.src) {
  audio.src = featured.src;
  document.getElementById("dock-title").textContent = featured.title;
  document.getElementById("dock-artist").textContent = featured.artist || "";
}
const savedVolume = Number(readPreference("volume") ?? "1");
audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 1;
volume.value = audio.volume;

function syncPlayer() {
  const playing = !audio.paused && !audio.ended;
  document.querySelectorAll("[data-play]").forEach(button => {
    const label = `${pendingPlay ? "取消加载" : playing ? "暂停" : "播放"}${featured?.title || "音乐"}`;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.setAttribute("aria-pressed", String(playing));
    if (button.classList.contains("dock-play")) button.innerHTML = icon(playing || pendingPlay ? "pause" : "play");
    else {
      button.querySelector(".symbol").innerHTML = symbols[playing || pendingPlay ? "pause" : "play"];
      const text = button.querySelector(".play-label");
      if (text) text.textContent = pendingPlay ? "加载中" : playing ? "暂停" : "播放";
    }
    button.classList.toggle("is-playing", playing);
    button.classList.toggle("is-loading", pendingPlay);
  });
  document.documentElement.classList.toggle("player-open", !dock.hidden);
}

async function togglePlayback() {
  if (!featured?.src) return;
  const request = ++playRequest;
  if (!audio.paused || pendingPlay) {
    pendingPlay = false;
    audio.pause();
    syncPlayer();
    return;
  }
  dock.hidden = false;
  playerMessage.hidden = true;
  pendingPlay = true;
  syncPlayer();
  try {
    await audio.play();
    if (request !== playRequest) return;
    pendingPlay = false;
    syncPlayer();
  } catch (error) {
    if (request !== playRequest) return;
    pendingPlay = false;
    if (error.name !== "AbortError") {
      playerMessage.textContent = "暂时无法播放，请重试或前往网易云收听。";
      playerMessage.hidden = false;
    }
    syncPlayer();
  }
}
function syncTimeline() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  seek.disabled = !duration;
  seek.max = duration || 100;
  seek.value = audio.currentTime;
  seek.style.setProperty("--progress", `${duration ? audio.currentTime / duration * 100 : 0}%`);
  seek.setAttribute("aria-valuetext", `${formatTime(audio.currentTime)}，共 ${formatTime(duration)}`);
  document.getElementById("elapsed").textContent = formatTime(audio.currentTime);
  document.getElementById("duration").textContent = formatTime(duration);
}
["loadedmetadata", "durationchange", "timeupdate", "seeked", "ended"].forEach(event => audio.addEventListener(event, syncTimeline));
["play", "pause", "ended"].forEach(event => audio.addEventListener(event, syncPlayer));
audio.addEventListener("error", () => {
  pendingPlay = false;
  playerMessage.textContent = "音乐文件暂时无法加载，可前往网易云收听。";
  playerMessage.hidden = dock.hidden;
  syncPlayer();
});
seek.addEventListener("input", () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); syncTimeline(); });
volume.addEventListener("input", () => { audio.volume = Number(volume.value); audio.muted = false; savePreference("volume", audio.volume); });
function syncVolume() {
  const muted = audio.muted || audio.volume === 0;
  const toggle = document.getElementById("mute-toggle");
  toggle.setAttribute("aria-pressed", String(muted));
  toggle.setAttribute("aria-label", muted ? "取消静音" : "静音");
  toggle.title = muted ? "取消静音" : "静音";
  toggle.innerHTML = `<span aria-hidden="true">${muted ? "\u{1F507}\uFE0E" : "\u{1F50A}\uFE0E"}</span>`;
  volume.value = audio.muted ? 0 : audio.volume;
}
audio.addEventListener("volumechange", syncVolume);
syncVolume();
document.getElementById("mute-toggle").addEventListener("click", () => {
  const wasMuted = audio.muted || audio.volume === 0;
  if (wasMuted && audio.volume === 0) { audio.volume = 0.5; savePreference("volume", 0.5); }
  audio.muted = !wasMuted;
});
document.getElementById("close-player").addEventListener("click", () => {
  ++playRequest;
  pendingPlay = false;
  audio.pause();
  audio.currentTime = 0;
  dock.hidden = true;
  syncPlayer();
  const returnButton = main.querySelector("[data-play]");
  (returnButton || document.querySelector(`[data-route="${route}"]`)).focus({ preventScroll: true });
});
document.addEventListener("click", event => { if (event.target.closest("[data-play]")) togglePlayback(); });

const motionToggle = document.getElementById("motion-toggle");
let motionPaused = readPreference("motion-paused") === "true";
function updateMotionControl() {
  const paused = motionPaused || reducedMotion.matches;
  document.documentElement.classList.toggle("motion-paused", paused);
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.setAttribute("aria-label", paused ? "开启背景动效" : "暂停背景动效");
  motionToggle.title = reducedMotion.matches ? "已跟随系统减少动态效果" : paused ? "开启背景动效" : "暂停背景动效";
  motionToggle.disabled = reducedMotion.matches;
  motionToggle.innerHTML = icon(paused ? "play" : "pause");
}
motionToggle.addEventListener("click", () => {
  motionPaused = !motionPaused;
  savePreference("motion-paused", motionPaused);
  updateMotionControl();
});
reducedMotion.addEventListener("change", () => { updateMotionControl(); if (reducedMotion.matches) main.getAnimations().forEach(animation => animation.cancel()); });
document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("page-hidden", document.hidden));
document.querySelector(".skip-link").addEventListener("click", event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: "start" });
});
document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (link && link.hash === `#${route}` && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion.matches || keyboardInput ? "instant" : "smooth" });
  }
});
window.addEventListener("hashchange", () => {
  render();
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
});
main.addEventListener("input", event => {
  if (event.target.id === "music-search") { query = event.target.value; renderMusicResults(); }
});
main.addEventListener("keydown", event => {
  if (event.target.id === "music-search" && event.key === "Escape" && query) {
    event.preventDefault();
    query = "";
    event.target.value = "";
    renderMusicResults();
  }
});
main.addEventListener("click", event => {
  if (event.target.closest("#clear-search, [data-reset-search]")) {
    query = "";
    const input = document.getElementById("music-search");
    input.value = "";
    renderMusicResults();
    input.focus();
  }
  const layoutButton = event.target.closest("[data-columns]");
  if (layoutButton) {
    photoColumns = Number(layoutButton.dataset.columns);
    savePreference("columns", photoColumns);
    document.querySelectorAll("[data-columns]").forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.columns) === photoColumns)));
    document.getElementById("gallery-content").innerHTML = galleryMarkup();
  }
  const photoButton = event.target.closest("[data-photo]");
  if (photoButton) openPhoto(Number(photoButton.dataset.photo));
});

const photoDialog = document.getElementById("photo-dialog");
const fullPhoto = document.getElementById("photo-full");
const fullVideo = document.getElementById("photo-video");
let photoIndex = 0;
let photoTrigger;
function showPhoto(index) {
  photoIndex = index;
  const photo = content.photos[index];
  resetGalleryVideo();
  const isVideo = photo.type === "video";
  document.getElementById("photo-title").textContent = photo.title || "摄影作品";
  document.getElementById("photo-load-error").hidden = true;
  fullPhoto.hidden = isVideo;
  fullVideo.hidden = !isVideo;
  if (isVideo) {
    fullPhoto.removeAttribute("src");
    fullVideo.poster = photo.thumbnail || "";
    fullVideo.src = photo.src;
    fullVideo.setAttribute("aria-label", photo.title || "视频");
    fullVideo.load();
  } else {
    fullPhoto.src = photo.src;
    fullPhoto.alt = photo.alt || photo.title || "摄影作品";
  }
  document.getElementById("photo-description").textContent = photo.description || "";
  document.getElementById("photo-position").textContent = `${index + 1} / ${content.photos.length}`;
  document.getElementById("previous-photo").disabled = index === 0;
  document.getElementById("next-photo").disabled = index === content.photos.length - 1;
}
function openPhoto(index) {
  photoTrigger = document.activeElement;
  showPhoto(index);
  photoDialog.showModal();
  document.getElementById("close-photo").focus();
}
function resetGalleryVideo() {
  fullVideo.pause();
  fullVideo.removeAttribute("src");
  fullVideo.load();
}
fullPhoto.addEventListener("error", () => { fullPhoto.hidden = true; document.getElementById("photo-load-error").hidden = false; });
fullVideo.addEventListener("error", () => {
  if (!fullVideo.hasAttribute("src")) return;
  fullVideo.hidden = true;
  document.getElementById("photo-load-error").hidden = false;
});
fullVideo.addEventListener("play", () => { ++playRequest; pendingPlay = false; audio.pause(); syncPlayer(); });
document.getElementById("close-photo").addEventListener("click", () => photoDialog.close());
document.getElementById("previous-photo").addEventListener("click", () => { if (photoIndex > 0) showPhoto(photoIndex - 1); });
document.getElementById("next-photo").addEventListener("click", () => { if (photoIndex < content.photos.length - 1) showPhoto(photoIndex + 1); });
photoDialog.addEventListener("keydown", event => {
  if (event.target === fullVideo) return;
  if (event.key === "ArrowLeft" && photoIndex > 0) { event.preventDefault(); showPhoto(photoIndex - 1); }
  if (event.key === "ArrowRight" && photoIndex < content.photos.length - 1) { event.preventDefault(); showPhoto(photoIndex + 1); }
});
photoDialog.addEventListener("click", event => {
  if (event.target !== photoDialog) return;
  const bounds = photoDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) photoDialog.close();
});
photoDialog.addEventListener("close", () => { resetGalleryVideo(); if (photoTrigger?.isConnected) photoTrigger.focus({ preventScroll: true }); });
updateMotionControl();
render();
