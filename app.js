/* =========================================================
   SparkEnglish - app.js
   ※ APIキー類はコードに直書きしないこと。
   ========================================================= */
const APP_VERSION = "1.0.1";

/* ---------- Firebase設定 ----------
   Firebaseコンソールの「ウェブアプリ設定」の値。
   ※ firebaseConfig の apiKey はアプリ識別用の公開情報（秘密鍵ではない）。
     データ保護は Firestore セキュリティルール（firestore.rules）で行う。
   値を YOUR_API_KEY 等に戻すと自動でゲストモード（localStorage保存）になります。 */
const firebaseConfig = {
  apiKey: "AIzaSyCVh0lpIjrvmqiM_QzTUA9Y92xEw06O0LA",
  authDomain: "spark-english-3cb91.firebaseapp.com",
  projectId: "spark-english-3cb91",
  storageBucket: "spark-english-3cb91.firebasestorage.app",
  messagingSenderId: "516978899187",
  appId: "1:516978899187:web:5d224e97f2c494f8a51f86",
};
const FB_VER = "13.3.0";
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
const LS_KEY = "sparkenglish_state_v1";
const LS_API = "sparkenglish_gemini_key";

/* ---------- 単元データ（全15単元×3フレーズ） ---------- */
const UNITS = [
  { id: 1, grade: 1, icon: "🌱", title: "be動詞（am / is / are）",
    explain: "「〜です」「〜にいる」はbe動詞。主語によって形が変わるよ。I→am、he/she/it→is、you/we/they→are。否定はbe動詞の後ろにnot、疑問文はbe動詞を前に出すだけ！",
    formula: "主語 + am/is/are + 名詞・形容詞・場所",
    phrases: [
      { en: "I am a student.", ja: "私は学生です。" },
      { en: "She is very kind.", ja: "彼女はとても親切です。" },
      { en: "Are you from Japan?", ja: "あなたは日本出身ですか？" } ] },
  { id: 2, grade: 1, icon: "🏃", title: "一般動詞（do / does）",
    explain: "動作や状態を表す動詞が一般動詞。主語がhe/she/itなど3人称単数で現在なら動詞に -s をつける。否定・疑問はdo/doesを使い、doesのあとは動詞を原形に戻すのがポイント！",
    formula: "主語 + 動詞(s) ／ Do/Does + 主語 + 動詞の原形？",
    phrases: [
      { en: "I play tennis every day.", ja: "私は毎日テニスをします。" },
      { en: "He doesn't like coffee.", ja: "彼はコーヒーが好きではありません。" },
      { en: "Do you speak English?", ja: "あなたは英語を話しますか？" } ] },
  { id: 3, grade: 1, icon: "🎬", title: "現在進行形",
    explain: "「今まさに〜しているところ」はbe動詞＋動詞のing形。be動詞は主語に合わせて使い分ける。likeやknowのような状態を表す動詞は基本的に進行形にしないよ。",
    formula: "主語 + am/is/are + 動詞ing",
    phrases: [
      { en: "I am reading a book now.", ja: "私は今、本を読んでいます。" },
      { en: "They are playing soccer.", ja: "彼らはサッカーをしています。" },
      { en: "What are you doing?", ja: "あなたは何をしているのですか？" } ] },
  { id: 4, grade: 1, icon: "👥", title: "代名詞（I / my / me / mine）",
    explain: "代名詞は文の中の位置で形が変わる。主語なら I、「〜の」なら my、目的語なら me、「〜のもの」なら mine。he → his → him → his、she → her → her → hers も一緒に覚えよう。",
    formula: "主格(I) / 所有格(my) / 目的格(me) / 所有代名詞(mine)",
    phrases: [
      { en: "This is my bag.", ja: "これは私のかばんです。" },
      { en: "Please help me.", ja: "私を手伝ってください。" },
      { en: "That pen is hers.", ja: "あのペンは彼女のものです。" } ] },
  { id: 5, grade: 1, icon: "⏪", title: "過去形",
    explain: "過去のことは動詞を過去形に。規則動詞は -ed、goのような不規則動詞は went など形が変わる。否定・疑問はdidを使い、didのあとは原形。be動詞の過去は was / were。",
    formula: "主語 + 動詞の過去形 ／ Did + 主語 + 原形？",
    phrases: [
      { en: "I went to Kyoto last week.", ja: "私は先週京都へ行きました。" },
      { en: "Did you watch the game?", ja: "あなたはその試合を見ましたか？" },
      { en: "It was a beautiful day.", ja: "美しい日でした。" } ] },
  { id: 6, grade: 2, icon: "🔮", title: "未来（will / be going to）",
    explain: "willは「その場で決めた意志・予測」、be going to は「前から決めていた予定・確実な見通し」。どちらも後ろは動詞の原形だよ。",
    formula: "主語 + will + 原形 ／ 主語 + be going to + 原形",
    phrases: [
      { en: "I will call you later.", ja: "後であなたに電話します。" },
      { en: "We are going to visit Osaka.", ja: "私たちは大阪を訪れる予定です。" },
      { en: "It will rain tomorrow.", ja: "明日は雨が降るでしょう。" } ] },
  { id: 7, grade: 2, icon: "🛠️", title: "助動詞（can / must / should / may）",
    explain: "助動詞は動詞に意味をプラスする道具。can（できる）、must（〜しなければならない）、should（〜すべき）、may（〜してもよい）。後ろは必ず動詞の原形！",
    formula: "主語 + 助動詞 + 動詞の原形",
    phrases: [
      { en: "Can I use your pen?", ja: "あなたのペンを使ってもいいですか？" },
      { en: "You must finish your homework.", ja: "あなたは宿題を終えなければなりません。" },
      { en: "You should see a doctor.", ja: "あなたは医者に診てもらうべきです。" } ] },
  { id: 8, grade: 2, icon: "🎯", title: "不定詞（to + 動詞の原形）",
    explain: "to＋原形で「〜すること」（名詞）、「〜するための」（形容詞）、「〜するために」（副詞）の3つの意味になる万能選手。want to〜、something to〜、to＋目的 をまず押さえよう。",
    formula: "to + 動詞の原形（名詞的・形容詞的・副詞的用法）",
    phrases: [
      { en: "I want to be a teacher.", ja: "私は先生になりたいです。" },
      { en: "I have something to tell you.", ja: "あなたに話すことがあります。" },
      { en: "She went to the library to study.", ja: "彼女は勉強するために図書館へ行きました。" } ] },
  { id: 9, grade: 2, icon: "🎸", title: "動名詞（動詞ing）",
    explain: "動詞にingをつけると「〜すること」という名詞になる。enjoy・finish・stopのあとは動名詞！前置詞のあとも動名詞になるよ。",
    formula: "動詞ing = 〜すること（enjoy / finish / stop + ing）",
    phrases: [
      { en: "I enjoy playing the guitar.", ja: "私はギターを弾くのを楽しみます。" },
      { en: "Swimming is good for your health.", ja: "泳ぐことは健康に良いです。" },
      { en: "Thank you for helping me.", ja: "手伝ってくれてありがとう。" } ] },
  { id: 10, grade: 2, icon: "📏", title: "比較（-er / -est / as 〜 as）",
    explain: "2つを比べるなら 比較級(-er / more) + than、3つ以上で一番なら the + 最上級(-est / most)。同じくらいなら as 原級 as。長い単語には more / most を使う。",
    formula: "A is 比較級 than B ／ the 最上級 ／ as 原級 as",
    phrases: [
      { en: "My brother is taller than me.", ja: "兄は私より背が高いです。" },
      { en: "This is the most interesting book.", ja: "これは一番面白い本です。" },
      { en: "I am as old as you.", ja: "私はあなたと同じ年です。" } ] },
  { id: 11, grade: 3, icon: "🔄", title: "受動態（be + 過去分詞）",
    explain: "「〜される」はbe動詞＋過去分詞。誰によってされるかは by〜 で表す（言わなくてもOK）。時制はbe動詞で調整するよ。",
    formula: "主語 + be動詞 + 過去分詞 (+ by 〜)",
    phrases: [
      { en: "English is spoken all over the world.", ja: "英語は世界中で話されています。" },
      { en: "This house was built in 1990.", ja: "この家は1990年に建てられました。" },
      { en: "The window was broken by Tom.", ja: "その窓はトムによって割られました。" } ] },
  { id: 12, grade: 3, icon: "⏳", title: "現在完了（have + 過去分詞）",
    explain: "過去から今につながる表現。「ずっと〜している（継続）」「〜したことがある（経験）」「ちょうど〜したところ（完了）」の3用法。for / since / ever / never / just がヒント。",
    formula: "主語 + have/has + 過去分詞",
    phrases: [
      { en: "I have lived here for ten years.", ja: "私はここに10年間住んでいます。" },
      { en: "Have you ever been to Hawaii?", ja: "ハワイに行ったことはありますか？" },
      { en: "I have just finished lunch.", ja: "ちょうど昼食を食べ終えたところです。" } ] },
  { id: 13, grade: 3, icon: "🔗", title: "関係代名詞（who / which / that）",
    explain: "名詞の後ろに説明をくっつける接着剤。人ならwho、物ならwhich、どちらにもthatが使える。目的格の関係代名詞は省略できるよ。",
    formula: "名詞 + who/which/that + 説明（文）",
    phrases: [
      { en: "I have a friend who lives in Canada.", ja: "私にはカナダに住んでいる友達がいます。" },
      { en: "This is the book which I bought yesterday.", ja: "これは私が昨日買った本です。" },
      { en: "The man that is standing there is my father.", ja: "あそこに立っている男性は私の父です。" } ] },
  { id: 14, grade: 3, icon: "🎨", title: "分詞・SVOC",
    explain: "ing形（〜している）や過去分詞（〜された）は名詞を修飾できる。またSVOCは「OをCにする/と呼ぶ」の形で、make / call / name などが代表選手。",
    formula: "名詞 + 動詞ing/過去分詞 ／ make・call + O + C",
    phrases: [
      { en: "Look at the sleeping baby.", ja: "眠っている赤ちゃんを見て。" },
      { en: "This is a car made in Japan.", ja: "これは日本製の車です。" },
      { en: "The news made me happy.", ja: "その知らせは私を幸せにしました。" } ] },
  { id: 15, grade: 3, icon: "💭", title: "間接疑問文・仮定法",
    explain: "疑問文が文の一部に入ると「疑問詞＋主語＋動詞」の普通の語順になる（間接疑問文）。仮定法は現実と違う願望・仮定を過去形で表す。I wish〜／If I were〜, I would〜。",
    formula: "疑問詞 + 主語 + 動詞 ／ If + 主語 + 過去形, 主語 + would + 原形",
    phrases: [
      { en: "Do you know where he lives?", ja: "彼がどこに住んでいるか知っていますか？" },
      { en: "I wish I could fly.", ja: "空を飛べたらいいのに。" },
      { en: "If I were you, I would try it.", ja: "もし私があなたなら、それに挑戦するでしょう。" } ] },
];

/* ---------- 状態管理 ---------- */
const defaultState = () => ({
  xp: 0, streak: 0, lastStudy: null, studyDays: [], units: {}, favorites: [], dayOffset: 0, updatedAt: 0,
});
let state = loadLocal();
let fb = null;       // { auth, db, mods }
let currentUser = null;

function loadLocal() {
  try { return { ...defaultState(), ...JSON.parse(localStorage.getItem(LS_KEY) || "{}") }; }
  catch { return defaultState(); }
}
let saveTimer = null;
function save() {
  state.updatedAt = Date.now();
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  if (currentUser && fb) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const { doc, setDoc } = fb.fs;
      setDoc(doc(fb.db, "users", currentUser.uid), state).catch(e => console.warn("クラウド保存失敗", e));
    }, 600);
  }
  renderStats();
}

/* ---------- 日付（テスト用の翌日送り対応） ---------- */
function todayDate() { return new Date(Date.now() + state.dayOffset * 86400000); }
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
const todayStr = () => ymd(todayDate());
function diffDays(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

function recordStudy(xp) {
  const t = todayStr();
  if (state.lastStudy !== t) {
    state.streak = state.lastStudy && diffDays(state.lastStudy, t) === 1 ? state.streak + 1 : 1;
    state.lastStudy = t;
  }
  if (!state.studyDays.includes(t)) state.studyDays.push(t);
  state.studyDays = state.studyDays.slice(-60);
  state.xp += xp;
  save();
}
function checkStreakBroken() {
  if (state.lastStudy && diffDays(state.lastStudy, todayStr()) > 1 && state.streak) { state.streak = 0; save(); }
}

/* ---------- 汎用UI ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add("hidden"), 2400);
}
function unitProg(id) { return state.units[id] || { step1: false, step2: false }; }
function masterPercent() {
  let pts = 0; UNITS.forEach(u => { const p = unitProg(u.id); pts += (p.step1 ? 1 : 0) + (p.step2 ? 1 : 0); });
  return Math.round(pts / (UNITS.length * 2) * 100);
}

function renderStats() {
  $("#stat-streak").textContent = state.streak;
  $("#stat-xp").textContent = state.xp;
  $("#stat-master").textContent = masterPercent() + "%";
}

function renderHome() {
  const cal = $("#week-calendar"); cal.innerHTML = "";
  const t = todayDate(); const dow = (t.getDay() + 6) % 7; // 月曜始まり
  const names = ["月", "火", "水", "木", "金", "土", "日"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(t); d.setDate(t.getDate() - dow + i);
    const s = ymd(d); const done = state.studyDays.includes(s);
    cal.insertAdjacentHTML("beforeend",
      `<div class="day ${done ? "done" : ""} ${s === ymd(t) ? "today" : ""}">${names[i]}<div class="stamp">${done ? "🔥" : ""}</div></div>`);
  }
  const p = masterPercent();
  $("#master-bar").style.width = p + "%";
  const mastered = UNITS.filter(u => unitProg(u.id).step2).length;
  $("#master-text").textContent = `${mastered} / ${UNITS.length} 単元マスター（${p}%）`;
}

function renderRoadmap() {
  const r = $("#roadmap"); r.innerHTML = "";
  const next = UNITS.find(u => !unitProg(u.id).step2);
  let g = 0;
  UNITS.forEach(u => {
    if (u.grade !== g) { g = u.grade; r.insertAdjacentHTML("beforeend", `<div class="grade-label g${g}">中${g}</div>`); }
    const p = unitProg(u.id);
    const cls = p.step2 ? "master" : p.step1 ? "half" : "";
    const el = document.createElement("div");
    el.className = `node ${cls} ${next && next.id === u.id ? "current" : ""}`;
    el.innerHTML = `<div class="node-circle">${p.step2 ? "👑" : u.icon}</div><div class="node-title">${u.id}. ${esc(u.title)}</div>`;
    el.onclick = () => openUnit(u.id);
    r.appendChild(el);
  });
}

function renderFav() {
  const box = $("#fav-list");
  if (!state.favorites.length) { box.innerHTML = `<div class="card muted">まだお気に入りはありません。単元のフレーズで⭐を押すとここに追加されます。</div>`; return; }
  box.innerHTML = "";
  state.favorites.forEach(key => {
    const [uid, idx] = key.split("-").map(Number);
    const u = UNITS.find(x => x.id === uid); if (!u) return;
    const ph = u.phrases[idx];
    const el = document.createElement("div"); el.className = "card phrase";
    el.innerHTML = `<button class="fav-btn on" aria-label="お気に入り解除">⭐</button>
      <div class="phrase-en">${esc(ph.en)}</div><div class="phrase-ja">${esc(ph.ja)}</div>
      <p class="muted small">単元${u.id}：${esc(u.title)}</p>
      <div class="phrase-actions"><button class="btn btn-small btn-blue" data-r="1">🔊 再生</button><button class="btn btn-small btn-outline" data-r="0.75">🐢 0.75倍</button></div>`;
    el.querySelector(".fav-btn").onclick = () => { toggleFav(key); renderFav(); };
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => speak(ph.en, +b.dataset.r));
    box.appendChild(el);
  });
}
function toggleFav(key) {
  const i = state.favorites.indexOf(key);
  i >= 0 ? state.favorites.splice(i, 1) : state.favorites.push(key);
  save();
  return i < 0;
}

/* ---------- 画面遷移 ---------- */
function go(view) {
  if (view !== "talk") stopTalk();
  $$(".view").forEach(v => v.classList.remove("active"));
  $(`#view-${view}`).classList.add("active");
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.goto === view || (view === "unit" && t.dataset.goto === "roadmap")));
  if (view === "home") renderHome();
  if (view === "roadmap") renderRoadmap();
  if (view === "fav") renderFav();
  if (view === "talk") renderAiMode();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- 音声合成 ---------- */
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ("speechSynthesis" in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function speak(text, rate = 1) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) { toast("この端末は音声再生に対応していません"); return resolve(); }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = rate;
    const v = voices.find(v => /en[-_]US/i.test(v.lang) && /Samantha|Google|Natural/i.test(v.name)) || voices.find(v => /^en/i.test(v.lang));
    if (v) u.voice = v;
    let done = false; const fin = () => { if (!done) { done = true; resolve(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, Math.max(4000, text.length * 160 / rate)); // 保険
    speechSynthesis.speak(u);
  });
}

/* ---------- 音声認識 ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let activeRec = null;
function listen() {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error("unsupported"));
    const rec = new SR(); activeRec = rec;
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 3;
    let got = false;
    rec.onresult = e => { got = true; resolve([...e.results[0]].map(a => a.transcript)); };
    rec.onerror = e => { if (!got) reject(new Error(e.error)); };
    rec.onend = () => { activeRec = null; if (!got) reject(new Error("no-speech")); };
    try { rec.start(); } catch (e) { reject(e); }
  });
}
function stopListening() { try { activeRec && activeRec.abort(); } catch { } activeRec = null; }
const norm = s => s.toLowerCase().replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ").trim();
function similarity(target, said) {
  const t = norm(target).split(" "), s = norm(said).split(" ");
  let hit = 0; const pool = [...s];
  t.forEach(w => { const i = pool.indexOf(w); if (i >= 0) { hit++; pool.splice(i, 1); } });
  return hit / t.length;
}

/* ---------- 単元学習 ---------- */
let unitSession = null;
function openUnit(id) {
  const u = UNITS.find(x => x.id === id);
  const p = unitProg(id);
  unitSession = { unit: u, step: p.step1 && !p.step2 ? 2 : 1, cleared: [false, false, false], revealed: [false, false, false] };
  go("unit"); renderUnit();
}
function renderUnit() {
  const { unit: u, step } = unitSession; const p = unitProg(u.id);
  const c = $("#unit-content");
  c.innerHTML = `
    <h2 class="unit-title">${u.icon} 単元${u.id}：${esc(u.title)}</h2>
    <div class="card explain"><h2>⏱️ 1分でわかる解説</h2><p>${esc(u.explain)}</p><div class="formula">📐 公式：${esc(u.formula)}</div></div>
    <div class="steps">
      <div class="step-pill ${step === 1 ? "active" : ""} ${p.step1 ? "done" : ""}">STEP1 理解＋音読</div>
      <div class="step-pill ${step === 2 ? "active" : ""} ${p.step2 ? "done" : ""}">STEP2 瞬間英作文</div>
    </div>
    <p class="muted small">${step === 1 ? "お手本を聞いて、マイクで音読しよう！（声が出せない時はスキップOK）" : "日本語を見て英語で言ってみよう！英文は隠れています。"}</p>
    <div id="phrase-list"></div>
    <div id="unit-footer"></div>`;
  const list = $("#phrase-list");
  u.phrases.forEach((ph, i) => {
    const key = `${u.id}-${i}`; const cleared = unitSession.cleared[i];
    const hide = step === 2 && !unitSession.revealed[i] && !cleared;
    const el = document.createElement("div"); el.className = `card phrase ${cleared ? "passed" : ""}`;
    el.innerHTML = `
      <button class="fav-btn ${state.favorites.includes(key) ? "on" : ""}" aria-label="お気に入り">⭐</button>
      ${step === 2 ? `<div class="phrase-ja" style="font-size:1.1rem;color:#3c3c3c">🇯🇵 ${esc(ph.ja)}</div>` : ""}
      <div class="phrase-en ${hide ? "hidden-en" : ""}">${esc(ph.en)}</div>
      ${step === 1 ? `<div class="phrase-ja">${esc(ph.ja)}</div>` : ""}
      <div class="phrase-actions">
        ${hide ? `<button class="btn btn-small btn-outline" data-a="reveal">👀 答えを見る</button>`
               : `<button class="btn btn-small btn-blue" data-a="play">🔊 お手本</button><button class="btn btn-small btn-outline" data-a="slow">🐢 0.75倍</button>`}
        ${cleared ? "" : `<button class="btn btn-small btn-red" data-a="mic">🎙️ 発音チェック</button><button class="btn btn-small btn-ghost" data-a="skip">スキップ ⏭</button>`}
      </div>
      <div class="result ${cleared ? "ok" : ""}">${cleared ? "✅ クリア！" : ""}</div>`;
    el.querySelector(".fav-btn").onclick = e => { const on = toggleFav(key); e.currentTarget.classList.toggle("on", on); toast(on ? "復習帳に追加しました⭐" : "復習帳から外しました"); };
    el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => phraseAction(b.dataset.a, i, el, b));
    list.appendChild(el);
  });
  const f = $("#unit-footer");
  if (unitSession.cleared.every(Boolean)) {
    if (step === 1) {
      f.innerHTML = `<button class="btn btn-primary btn-block btn-big" id="to-step2">STEP2 瞬間英作文へ進む →</button>`;
      $("#to-step2").onclick = () => { unitSession = { ...unitSession, step: 2, cleared: [false, false, false], revealed: [false, false, false] }; renderUnit(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    } else {
      const nextU = UNITS.find(x => x.id === u.id + 1);
      f.innerHTML = `<div class="card master-celebrate"><div class="big">👑</div><h2>単元マスター！</h2><p class="muted">+30 XP 獲得！この調子！</p>
        ${nextU ? `<button class="btn btn-primary btn-block" id="next-unit">次の単元へ →</button>` : `<button class="btn btn-primary btn-block" data-goto="roadmap">ロードマップへ</button>`}</div>`;
      if (nextU) $("#next-unit").onclick = () => openUnit(nextU.id);
    }
  }
}
function completeStep() {
  const { unit: u, step } = unitSession;
  const p = { ...unitProg(u.id) };
  if (step === 1 && !p.step1) { p.step1 = true; state.units[u.id] = p; recordStudy(20); toast("STEP1クリア！+20 XP 🎉"); }
  else if (step === 2 && !p.step2) { p.step2 = true; state.units[u.id] = p; recordStudy(30); toast("単元マスター！+30 XP 👑"); }
  else recordStudy(5);
}
async function phraseAction(a, i, el, btn) {
  const ph = unitSession.unit.phrases[i];
  const res = el.querySelector(".result");
  if (a === "play") return speak(ph.en, 1);
  if (a === "slow") return speak(ph.en, 0.75);
  if (a === "reveal") { unitSession.revealed[i] = true; renderUnit(); return speak(ph.en, 1); }
  if (a === "skip") return clearPhrase(i);
  if (a === "mic") {
    if (!SR) { res.className = "result ng"; res.textContent = "この端末は音声認識に非対応です。スキップで進めてね。"; return; }
    speechSynthesis.cancel(); btn.classList.add("mic-on"); btn.textContent = "🎙️ 聞いています…";
    res.className = "result"; res.textContent = "英語で話してください";
    try {
      const alts = await listen();
      const best = Math.max(...alts.map(s => similarity(ph.en, s)));
      if (best >= 0.7) { res.className = "result ok"; res.textContent = `🎉 Great!（${Math.round(best * 100)}%）「${alts[0]}」`; setTimeout(() => clearPhrase(i), 900); }
      else { res.className = "result ng"; res.textContent = `もう一息！（${Math.round(best * 100)}%）認識：「${alts[0]}」`; }
    } catch (e) {
      res.className = "result ng";
      res.textContent = e.message === "not-allowed" ? "マイクが許可されていません。スキップで進めてね。" : "うまく聞き取れませんでした。もう一度かスキップで！";
    } finally { btn.classList.remove("mic-on"); btn.textContent = "🎙️ 発音チェック"; }
  }
}
function clearPhrase(i) {
  unitSession.cleared[i] = true; unitSession.revealed[i] = true;
  if (unitSession.cleared.every(Boolean)) completeStep();
  renderUnit();
}

/* ---------- ハンズフリーAI英会話 ---------- */
const THEMES = {
  chat: { name: "雑談", opener: "Hi there! How are you doing today?" },
  cafe: { name: "カフェ", opener: "Hello! Welcome to Spark Cafe. What would you like to order?" },
  travel: { name: "旅行", opener: "Hi! Are you planning a trip? Where would you like to go?" },
  hobby: { name: "趣味", opener: "Hey! What do you like to do in your free time?" },
};
let talk = { theme: "chat", running: false, history: [] };
let audioCtx = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.09);
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.25);
  } catch { }
  return new Promise(r => setTimeout(r, 280));
}
const getApiKey = () => localStorage.getItem(LS_API) || "";
function renderAiMode() {
  $("#ai-mode-text").textContent = getApiKey()
    ? "🤖 Gemini AIモードで会話します。"
    : "💡 ローカル基本会話モード（「🔑 AI設定」でGemini APIキーを登録すると本格AI会話に）";
}
function addMsg(role, text, sub = "") {
  const log = $("#chat-log");
  log.insertAdjacentHTML("beforeend", `<div class="msg ${role}">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>`);
  log.scrollTop = log.scrollHeight;
}
function setStatus(t, listening = false) { const s = $("#talk-status"); s.textContent = t; s.classList.toggle("listening", listening); }

async function startTalk() {
  if (audioCtx === null) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { } }
  talk.running = true; talk.history = [];
  $("#chat-log").innerHTML = "";
  $("#talk-start").classList.add("hidden"); $("#talk-stop").classList.remove("hidden");
  const opener = THEMES[talk.theme].opener;
  talk.history.push({ role: "model", text: opener });
  await aiSay(opener);
  recordStudy(5);
}
function stopTalk() {
  if (!talk.running) return;
  talk.running = false; stopListening(); if ("speechSynthesis" in window) speechSynthesis.cancel();
  $("#talk-start").classList.remove("hidden"); $("#talk-stop").classList.add("hidden");
  setStatus("会話を終了しました。おつかれさま！🎉");
}
async function aiSay(text) {
  addMsg("ai", text);
  setStatus("🔊 AIが話しています…");
  await speak(text, 0.95);
  if (talk.running) listenLoop();
}
async function listenLoop() {
  if (!talk.running) return;
  if (!SR) { setStatus("音声認識非対応のため、下の入力欄から英語で返信してね⌨️"); return; }
  await beep();
  if (!talk.running) return;
  setStatus("🎙️ 聞いています…英語で話してね", true);
  try {
    const alts = await listen();
    if (talk.running) handleUser(alts[0]);
  } catch (e) {
    if (!talk.running) return;
    if (e.message === "not-allowed") { setStatus("マイクが許可されていません。入力欄から返信してね⌨️"); return; }
    setStatus("聞き取れませんでした。もう一度どうぞ…");
    setTimeout(listenLoop, 700);
  }
}
async function handleUser(text) {
  if (!text || !text.trim()) return;
  stopListening();
  addMsg("user", text);
  talk.history.push({ role: "user", text });
  setStatus("💭 考え中…");
  let reply;
  try { reply = getApiKey() ? await geminiReply() : localReply(text); }
  catch (e) { console.warn(e); reply = localReply(text); toast("AI接続に失敗したためローカル応答に切り替えました"); }
  talk.history.push({ role: "model", text: reply });
  xpTick();
  if (talk.running) await aiSay(reply); else addMsg("ai", reply);
}
let talkCount = 0;
function xpTick() { if (++talkCount % 3 === 0) recordStudy(3); }

async function geminiReply() {
  const sys = `You are a friendly English conversation partner for a Japanese learner (junior-high level). Theme: ${THEMES[talk.theme].name} (${talk.theme}). Reply in 1-2 short, simple English sentences and always end with a question to keep the conversation going. If the user's English has a mistake, gently model the correct sentence first. No emojis, no markdown.`;
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": getApiKey() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: talk.history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      generationConfig: { temperature: 0.8, maxOutputTokens: 120 },
    }),
  });
  if (!res.ok) throw new Error("Gemini " + res.status);
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("").trim();
  if (!out) throw new Error("empty");
  return out.replace(/[*#_`]/g, "");
}

function localReply(text) {
  const t = norm(text);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const has = (...w) => w.some(x => t.includes(x));
  if (has("bye", "see you", "goodbye")) return "It was nice talking with you. See you next time!";
  if (has("thank")) return pick(["You're welcome! Anything else?", "My pleasure! What else would you like to talk about?"]);
  const T = talk.theme;
  if (T === "cafe") {
    if (has("coffee", "latte", "tea", "cappuccino", "juice")) return pick(["Great choice! Would you like it hot or iced?", "Sure! What size would you like, small, medium, or large?"]);
    if (has("hot", "iced", "ice", "cold")) return "Got it. Would you like something to eat with it?";
    if (has("small", "medium", "large", "tall")) return "Okay! For here or to go?";
    if (has("cake", "sandwich", "cookie", "eat", "muffin")) return "Sounds delicious! Is that for here or to go?";
    if (has("here", "to go", "take")) return "Perfect. That will be five dollars. How would you like to pay?";
    if (has("card", "cash", "pay")) return "Thank you! Your order will be ready soon. Do you come here often?";
    return pick(["Sure! Would you like a coffee or a tea?", "We also have great cakes today. Would you like one?"]);
  }
  if (T === "travel") {
    if (has("japan", "america", "hawaii", "london", "paris", "korea", "australia", "canada", "kyoto", "okinawa", "italy")) return pick(["Wow, that sounds amazing! What do you want to do there?", "Nice choice! When are you going to go?"]);
    if (has("eat", "food")) return "Trying local food is the best part of traveling! What food do you like?";
    if (has("see", "visit", "shopping", "museum", "beach")) return "That sounds fun! Who are you going to travel with?";
    if (has("friend", "family", "alone", "mother", "father", "sister", "brother")) return "That's nice! How long will you stay there?";
    if (has("week", "day", "days", "month")) return "Great! Have you ever been abroad before?";
    return pick(["Where would you like to go next?", "Do you like traveling by plane or by train?"]);
  }
  if (T === "hobby") {
    if (has("game", "games")) return "Games are fun! What kind of games do you like?";
    if (has("music", "sing", "guitar", "piano")) return "I love music too! Who is your favorite artist?";
    if (has("soccer", "baseball", "tennis", "basketball", "swim", "run", "sport")) return "Sports are great for your health! How often do you play?";
    if (has("read", "book", "manga", "anime", "movie")) return "Cool! Can you recommend one to me?";
    if (has("cook", "draw", "paint", "photo")) return "That's a wonderful hobby! When did you start it?";
    return pick(["Interesting! Why do you like it?", "How long have you been doing that?"]);
  }
  // 雑談
  if (has("good", "great", "fine", "happy", "well")) return pick(["That's great to hear! What did you do today?", "Awesome! Do you have any plans for the weekend?"]);
  if (has("tired", "bad", "sad", "sleepy", "busy")) return "Oh, I'm sorry to hear that. What happened?";
  if (has("school", "work", "study", "class")) return "I see. What is your favorite subject?";
  if (has("weekend", "tomorrow", "plan")) return "Sounds nice! Who will you spend time with?";
  if (has("my name", "i'm", "i am")) return pick(["Nice to meet you! Where are you from?", "Cool! Tell me more about yourself."]);
  return pick(["I see! Can you tell me more?", "That's interesting! Why do you think so?", "Really? What do you like about it?"]);
}

/* ---------- Firebase（設定済みの場合のみ動的読み込み） ---------- */
const fbConfigured = !Object.values(firebaseConfig).some(v => String(v).includes("YOUR_"));
async function initFirebase() {
  if (!fbConfigured) { $("#login-btn").title = "Firebase未設定のためゲストモードで動作中"; return; }
  try {
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import(`${FB_BASE}/firebase-app.js`), import(`${FB_BASE}/firebase-auth.js`), import(`${FB_BASE}/firebase-firestore.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    fb = { auth: auth.getAuth(app), db: fs.getFirestore(app), authMod: auth, fs };
    auth.onAuthStateChanged(fb.auth, onAuth);
  } catch (e) { console.warn("Firebase初期化失敗。ゲストモードで動作します", e); fb = null; }
}
async function onAuth(user) {
  currentUser = user;
  $("#login-btn").classList.toggle("hidden", !!user);
  $("#user-box").classList.toggle("hidden", !user);
  if (!user) { $("#mode-label").textContent = "👤 ゲストモード（この端末に保存）"; return; }
  $("#user-avatar").src = user.photoURL || "icon-192.png";
  $("#mode-label").textContent = `☁️ ${user.displayName || "ユーザー"} さん（クラウド保存中）`;
  const { doc, getDoc, setDoc } = fb.fs;
  const ref = doc(fb.db, "users", user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const cloud = snap.data();
      state = { ...defaultState(), ...cloud };
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } else {
      await setDoc(ref, state); // 初回：ローカル記録をクラウドへ引き継ぎ
      toast("ゲスト記録をクラウドに引き継ぎました☁️");
    }
  } catch (e) { console.warn(e); toast("クラウド読込に失敗しました"); }
  checkStreakBroken(); renderStats(); go(document.querySelector(".view.active").id.replace("view-", "") === "unit" ? "roadmap" : "home");
}
async function login() {
  if (!fbConfigured || !fb) { toast("Firebase未設定のため、ゲストモードで全機能が使えます👤"); return; }
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = fb.authMod;
  const provider = new GoogleAuthProvider();
  try { await signInWithPopup(fb.auth, provider); }
  catch (e) { if (e.code === "auth/popup-blocked") signInWithRedirect(fb.auth, provider); else toast("ログインに失敗しました"); }
}
async function logout() { if (fb) { await fb.authMod.signOut(fb.auth); state = loadLocal(); renderStats(); go("home"); } }

/* ---------- アップデート確認 ---------- */
async function checkUpdate(manual = false) {
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: "no-store" });
    const { version } = await res.json();
    if (version && version !== APP_VERSION) { $("#update-banner").classList.remove("hidden"); if (manual) toast(`新しいバージョン v${version} があります！`); }
    else if (manual) toast("最新版です ✅");
  } catch { if (manual) toast("更新確認に失敗しました（オフライン？）"); }
}
async function forceUpdate() {
  try {
    if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); }
    if ("serviceWorker" in navigator) { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.unregister())); }
  } finally { location.replace(location.pathname + "?v=" + Date.now()); }
}

/* ---------- イベント登録 ---------- */
function bind() {
  document.addEventListener("click", e => { const g = e.target.closest("[data-goto]"); if (g) go(g.dataset.goto); });
  $("#unit-back").onclick = () => go("roadmap");
  $("#continue-btn").onclick = () => { const n = UNITS.find(u => !unitProg(u.id).step2); n ? openUnit(n.id) : go("roadmap"); };
  $("#login-btn").onclick = login;
  $("#logout-btn").onclick = logout;
  $$(".theme-btn").forEach(b => b.onclick = () => {
    if (talk.running) return toast("会話中はテーマを変更できません");
    $$(".theme-btn").forEach(x => x.classList.remove("active")); b.classList.add("active"); talk.theme = b.dataset.theme;
  });
  $("#talk-start").onclick = startTalk;
  $("#talk-stop").onclick = stopTalk;
  $("#talk-text-form").onsubmit = e => {
    e.preventDefault(); const v = $("#talk-text").value.trim(); if (!v) return;
    $("#talk-text").value = "";
    if (!talk.running) { toast("先に「会話を始める」を押してね"); return; }
    speechSynthesis.cancel(); handleUser(v);
  };
  // AI設定
  $("#ai-settings-btn").onclick = () => { $("#api-key-input").value = getApiKey(); $("#ai-modal").classList.remove("hidden"); };
  $("#api-key-cancel").onclick = () => $("#ai-modal").classList.add("hidden");
  $("#api-key-save").onclick = () => {
    const v = $("#api-key-input").value.trim();
    v ? localStorage.setItem(LS_API, v) : localStorage.removeItem(LS_API);
    $("#ai-modal").classList.add("hidden"); renderAiMode(); toast(v ? "APIキーを保存しました🔑" : "APIキーを削除しました");
  };
  $("#api-key-clear").onclick = () => { localStorage.removeItem(LS_API); $("#api-key-input").value = ""; renderAiMode(); toast("APIキーを削除しました"); };
  // テスト用
  $("#next-day-btn").onclick = () => { state.dayOffset++; checkStreakBroken(); save(); renderHome(); toast(`🧪 ${todayStr()} に進めました`); };
  $("#reset-btn").onclick = () => {
    if (!confirm("学習記録をすべて初期化しますか？（APIキーは残ります）")) return;
    state = defaultState(); save(); go("home"); toast("記録を初期化しました");
  };
  $("#check-update-btn").onclick = () => checkUpdate(true);
  $("#update-now-btn").onclick = forceUpdate;
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { checkUpdate(); checkStreakBroken(); renderStats(); } });
}

/* ---------- 起動 ---------- */
function init() {
  $("#app-version").textContent = APP_VERSION;
  bind(); checkStreakBroken(); renderStats(); renderHome();
  initFirebase(); checkUpdate();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW登録失敗", e));
}
init();
