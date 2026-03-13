const learningItems = [
  {
    id: "v1",
    type: "词汇",
    level: "TOPIK I",
    head: "사랑",
    meaning: "爱情；爱",
    example: "널 사랑해, 믿어줘",
    exampleCn: "我爱你，请相信我。",
    sourceSong: "BIGBANG - LAST DANCE",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=BIGBANG%20LAST%20DANCE",
    detail: "常见搭配：사랑하다(爱), 첫사랑(初恋)。"
  },
  {
    id: "v2",
    type: "词汇",
    level: "TOPIK I",
    head: "기다리다",
    meaning: "等待",
    example: "봄날이 와도 기다릴게",
    exampleCn: "即使春天来了我也会等待你。",
    sourceSong: "BTS - 봄날 (Spring Day)",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=BTS%20Spring%20Day",
    detail: "动词原形 기다리다，过去式 기다렸다。"
  },
  {
    id: "v3",
    type: "词汇",
    level: "TOPIK II",
    head: "꿈",
    meaning: "梦想；梦",
    example: "다시 꾸는 꿈처럼",
    exampleCn: "就像再次做起的梦一样。",
    sourceSong: "IU - 드라마 (Drama)",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=IU%20Drama",
    detail: "惯用：꿈을 꾸다(做梦/怀抱梦想)。"
  },
  {
    id: "g1",
    type: "语法",
    level: "TOPIK I",
    head: "-고 싶다",
    meaning: "想要做某事",
    example: "지금 너를 보고 싶어",
    exampleCn: "现在想见你。",
    sourceSong: "TAEYEON - I",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=TAEYEON%20I",
    detail: "接动词词干，表达说话者愿望：먹고 싶다, 가고 싶다。"
  },
  {
    id: "g2",
    type: "语法",
    level: "TOPIK II",
    head: "-아/어도",
    meaning: "即使……也……",
    example: "비가 와도 괜찮아",
    exampleCn: "就算下雨也没关系。",
    sourceSong: "DAY6 - 괜찮아도 괜찮아",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=DAY6%20%EA%B4%9C%EC%B0%AE%EC%95%84%EB%8F%84%20%EA%B4%9C%EC%B0%AE%EC%95%84",
    detail: "让步关系：늦어도 괜찮아요(晚点也没关系)。"
  },
  {
    id: "g3",
    type: "语法",
    level: "TOPIK II",
    head: "-(으)니까",
    meaning: "因为……所以……",
    example: "네가 있으니까 난 괜찮아",
    exampleCn: "因为有你，我没关系。",
    sourceSong: "Gummy - You Are My Everything",
    musicUrl: "https://y.qq.com/n/ryqq/search?w=Gummy%20You%20Are%20My%20Everything",
    detail: "连接原因，常用于口语解释原因。"
  }
];

const STORAGE_KEY = "topik-song-learning-state";
const defaultState = () => ({
  currentId: learningItems[0].id,
  totalReviews: 0,
  records: Object.fromEntries(
    learningItems.map((item) => [
      item.id,
      { seen: 0, correct: 0, wrong: 0, mastery: 0 }
    ])
  )
});

const state = loadState();

const els = {
  totalReviews: document.getElementById("total-reviews"),
  accuracy: document.getElementById("overall-accuracy"),
  reason: document.getElementById("recommendation-reason"),
  itemType: document.getElementById("item-type"),
  itemLevel: document.getElementById("item-level"),
  itemHead: document.getElementById("item-head"),
  itemMeaning: document.getElementById("item-meaning"),
  itemExample: document.getElementById("item-example"),
  itemExampleCn: document.getElementById("item-example-cn"),
  musicLink: document.getElementById("music-link"),
  detail: document.getElementById("item-detail"),
  recommendList: document.getElementById("recommend-list"),
  masteryButtons: document.getElementById("mastery-buttons")
};

document
  .getElementById("btn-show-answer")
  .addEventListener("click", () => els.detail.classList.toggle("hidden"));
document.getElementById("btn-correct").addEventListener("click", () => review(true));
document.getElementById("btn-wrong").addEventListener("click", () => review(false));
els.masteryButtons.addEventListener("click", onMasteryClick);

render();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      records: { ...base.records, ...(parsed.records || {}) }
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function onMasteryClick(event) {
  const btn = event.target.closest("button[data-level]");
  if (!btn) return;
  const id = state.currentId;
  state.records[id].mastery = Number(btn.dataset.level);
  saveState();
  renderMasteryButtons();
  renderRecommendation();
}

function review(isCorrect) {
  const id = state.currentId;
  const r = state.records[id];
  r.seen += 1;
  if (isCorrect) r.correct += 1;
  else r.wrong += 1;
  state.totalReviews += 1;

  const next = pickNextItem();
  state.currentId = next.id;

  saveState();
  render();
}

function pickNextItem() {
  const scored = learningItems.map((item) => ({
    item,
    score: getPriorityScore(item)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].item;
}

function getPriorityScore(item) {
  const r = state.records[item.id];
  const unseenBonus = r.seen === 0 ? 3 : 0;
  const accuracy = r.seen === 0 ? 0 : r.correct / r.seen;
  const weakPenalty = 1 - accuracy;
  const masteryWeight = (3 - r.mastery) * 0.6;
  const repeatWeight = Math.min(r.wrong * 0.35, 1.4);
  return unseenBonus + weakPenalty * 2 + masteryWeight + repeatWeight;
}

function getReasonText() {
  const unseen = learningItems.filter((i) => state.records[i.id].seen === 0).length;
  if (unseen > 0) return "未学习内容优先";

  const weak = learningItems.filter((i) => {
    const r = state.records[i.id];
    return r.seen > 0 && r.correct / r.seen < 0.7;
  }).length;

  if (weak > 0) return "低正确率内容优先";
  return "按掌握程度均衡复习";
}

function render() {
  const item = learningItems.find((x) => x.id === state.currentId) || learningItems[0];
  const acc = getOverallAccuracy();

  els.totalReviews.textContent = String(state.totalReviews);
  els.accuracy.textContent = `${Math.round(acc * 100)}%`;
  els.reason.textContent = getReasonText();

  els.itemType.textContent = item.type;
  els.itemLevel.textContent = item.level;
  els.itemHead.textContent = item.head;
  els.itemMeaning.textContent = item.meaning;
  els.itemExample.textContent = `${item.example}（${item.sourceSong}）`;
  els.itemExampleCn.textContent = item.exampleCn;
  els.musicLink.href = item.musicUrl;
  els.musicLink.textContent = `点开听：${item.sourceSong}`;
  els.detail.innerHTML = `<strong>解析：</strong>${item.detail}`;
  els.detail.classList.add("hidden");

  renderMasteryButtons();
  renderRecommendation();
}

function renderMasteryButtons() {
  const current = state.records[state.currentId].mastery;
  [...els.masteryButtons.querySelectorAll("button")].forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.level) === current);
  });
}

function renderRecommendation() {
  const top = learningItems
    .map((item) => ({ item, score: getPriorityScore(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  els.recommendList.innerHTML = "";
  top.forEach(({ item }) => {
    const r = state.records[item.id];
    const acc = r.seen ? Math.round((r.correct / r.seen) * 100) : 0;
    const li = document.createElement("li");
    li.textContent = `${item.type} ${item.head} | 掌握:${r.mastery}/3 | 正确率:${acc}% | 复习:${r.seen}`;
    els.recommendList.appendChild(li);
  });
}

function getOverallAccuracy() {
  let correct = 0;
  let seen = 0;
  Object.values(state.records).forEach((r) => {
    correct += r.correct;
    seen += r.seen;
  });
  if (seen === 0) return 0;
  return correct / seen;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
