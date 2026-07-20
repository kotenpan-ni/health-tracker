// ---------- ユーティリティ ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- データ ----------
let profile = load("ht_profile", null);
let meals = load("ht_meals", []); // {id, date, mealType, name, kcal, p, f, c}
let weights = load("ht_weights", []); // {id, date, weight}

const MEAL_TYPES = ["朝食", "昼食", "夕食", "間食"];

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUST = {
  lose: -0.2,
  lose_mild: -0.1,
  maintain: 0,
  gain: 0.1,
};

const PFC_RATIO = { p: 0.15, f: 0.25, c: 0.6 };

let currentDate = todayStr();
let selectedFood = null; // {name, kcal, p, f, c}
let currentMealType = null;

// ---------- 目標計算 ----------
function computeTargets(p) {
  const bmr =
    p.gender === "male"
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const tdee = bmr * ACTIVITY_FACTORS[p.activity];
  const targetKcal = Math.round(tdee * (1 + GOAL_ADJUST[p.goal]));
  const targetP = Math.round((targetKcal * PFC_RATIO.p) / 4);
  const targetF = Math.round((targetKcal * PFC_RATIO.f) / 9);
  const targetC = Math.round((targetKcal * PFC_RATIO.c) / 4);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetKcal, targetP, targetF, targetC };
}

// ---------- タブ切り替え ----------
function switchTab(tab) {
  $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $$(".tab-section").forEach((s) => s.classList.toggle("active", s.id === "tab-" + tab));
  if (tab === "weight") renderWeightTab();
  if (tab === "history") renderHistoryTab();
  if (tab === "today") renderTodayTab();
  if (tab === "profile") renderProfileTab();
}

// ---------- 今日の記録タブ ----------
function mealsForDate(date) {
  return meals.filter((m) => m.date === date);
}

function sumMacros(list) {
  return list.reduce(
    (acc, m) => {
      acc.kcal += m.kcal;
      acc.p += m.p;
      acc.f += m.f;
      acc.c += m.c;
      return acc;
    },
    { kcal: 0, p: 0, f: 0, c: 0 }
  );
}

function renderTodayTab() {
  $("#current-date").value = currentDate;
  const dayMeals = mealsForDate(currentDate);
  const totals = sumMacros(dayMeals);

  const targets = profile
    ? computeTargets(profile)
    : { targetKcal: 2000, targetP: 75, targetF: 56, targetC: 300 };

  $("#kcal-value").textContent = Math.round(totals.kcal);
  $("#kcal-target").textContent = `/ ${targets.targetKcal} kcal`;
  const kcalPct = Math.min(100, (totals.kcal / targets.targetKcal) * 100);
  const kcalBar = $("#kcal-bar");
  kcalBar.style.width = kcalPct + "%";
  kcalBar.parentElement.classList.toggle("over", totals.kcal > targets.targetKcal);

  if (!profile) {
    $("#no-profile-notice").style.display = "block";
  } else {
    $("#no-profile-notice").style.display = "none";
  }

  setMacroBar("p", totals.p, targets.targetP);
  setMacroBar("f", totals.f, targets.targetF);
  setMacroBar("c", totals.c, targets.targetC);

  // meal blocks
  MEAL_TYPES.forEach((type) => {
    const container = $(`#meal-list-${type}`);
    container.innerHTML = "";
    const items = dayMeals.filter((m) => m.mealType === type);
    const mealTotal = sumMacros(items);
    $(`#meal-kcal-${type}`).textContent = items.length ? `${Math.round(mealTotal.kcal)} kcal` : "";
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-msg">まだ記録がありません</div>';
      return;
    }
    items.forEach((m) => {
      const row = document.createElement("div");
      row.className = "food-item";
      row.innerHTML = `
        <div>
          <div>${escapeHtml(m.name)}</div>
          <div class="meta">${Math.round(m.kcal)}kcal / P${m.p.toFixed(1)} F${m.f.toFixed(1)} C${m.c.toFixed(1)}</div>
        </div>
        <button class="del-btn" data-id="${m.id}">✕</button>
      `;
      row.querySelector(".del-btn").addEventListener("click", () => {
        meals = meals.filter((x) => x.id !== m.id);
        save("ht_meals", meals);
        renderTodayTab();
      });
      container.appendChild(row);
    });
  });
}

function setMacroBar(key, value, target) {
  $(`#macro-${key}-amount`).textContent = `${Math.round(value)} / ${target}g`;
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  $(`#macro-${key}-bar`).style.width = pct + "%";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- 食事追加モーダル ----------
function openModal(mealType) {
  currentMealType = mealType;
  selectedFood = null;
  $("#modal-meal-type").textContent = mealType;
  $("#food-search").value = "";
  $("#manual-name").value = "";
  $("#manual-kcal").value = "";
  $("#manual-p").value = "";
  $("#manual-f").value = "";
  $("#manual-c").value = "";
  $("#selected-food-box").style.display = "none";
  setModalMode("search");
  renderFoodResults("");
  $("#modal-overlay").classList.add("open");
}

function closeModal() {
  $("#modal-overlay").classList.remove("open");
}

function setModalMode(mode) {
  $$("#modal .mode-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  $("#search-panel").style.display = mode === "search" ? "block" : "none";
  $("#manual-panel").style.display = mode === "manual" ? "block" : "none";
}

function renderFoodResults(query) {
  const list = $("#search-results");
  list.innerHTML = "";
  const q = query.trim().toLowerCase();
  const results = FOODS.filter((f) => !q || f.name.toLowerCase().includes(q)).slice(0, 30);
  if (results.length === 0) {
    list.innerHTML = '<div class="empty-msg">見つかりませんでした</div>';
    return;
  }
  results.forEach((f) => {
    const el = document.createElement("div");
    el.className = "search-result-item";
    el.innerHTML = `<span>${escapeHtml(f.name)}</span><span class="meta">${f.kcal}kcal</span>`;
    el.addEventListener("click", () => selectFood(f));
    list.appendChild(el);
  });
}

function selectFood(f) {
  selectedFood = { ...f, qty: 1 };
  const box = $("#selected-food-box");
  box.style.display = "block";
  box.innerHTML = `
    <div><strong>${escapeHtml(f.name)}</strong></div>
    <div style="margin:6px 0;">${f.kcal}kcal / P${f.p}g F${f.f}g C${f.c}g （1人前あたり）</div>
    <label>量の倍率（例: 0.5, 1, 2）</label>
    <input type="number" id="qty-input" value="1" step="0.1" min="0.1" style="margin-bottom:0;">
  `;
  $("#qty-input").addEventListener("input", (e) => {
    selectedFood.qty = parseFloat(e.target.value) || 1;
  });
}

function addSelectedFood() {
  if (!selectedFood) return;
  const q = selectedFood.qty || 1;
  meals.push({
    id: uid(),
    date: currentDate,
    mealType: currentMealType,
    name: selectedFood.name + (q !== 1 ? `（${q}人前）` : ""),
    kcal: selectedFood.kcal * q,
    p: selectedFood.p * q,
    f: selectedFood.f * q,
    c: selectedFood.c * q,
  });
  save("ht_meals", meals);
  closeModal();
  renderTodayTab();
}

function addManualFood() {
  const name = $("#manual-name").value.trim();
  const kcal = parseFloat($("#manual-kcal").value) || 0;
  const p = parseFloat($("#manual-p").value) || 0;
  const f = parseFloat($("#manual-f").value) || 0;
  const c = parseFloat($("#manual-c").value) || 0;
  if (!name || kcal <= 0) {
    alert("名前とカロリーを入力してください");
    return;
  }
  meals.push({ id: uid(), date: currentDate, mealType: currentMealType, name, kcal, p, f, c });
  save("ht_meals", meals);
  closeModal();
  renderTodayTab();
}

// ---------- 体重タブ ----------
function renderWeightTab() {
  const list = $("#weight-list");
  list.innerHTML = "";
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-msg">まだ記録がありません</div>';
  } else {
    sorted.slice(0, 20).forEach((w) => {
      const row = document.createElement("div");
      row.className = "history-row";
      row.innerHTML = `<span class="date">${w.date}</span><span>${w.weight} kg</span>`;
      const del = document.createElement("button");
      del.className = "del-btn";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        weights = weights.filter((x) => x.id !== w.id);
        save("ht_weights", weights);
        renderWeightTab();
      });
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  drawWeightChart();
}

function drawWeightChart() {
  const svg = $("#weight-chart");
  svg.innerHTML = "";
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-30);
  if (sorted.length < 2) {
    svg.innerHTML =
      '<text x="50%" y="50%" text-anchor="middle" fill="var(--muted)" font-size="12">2件以上記録するとグラフが表示されます</text>';
    return;
  }
  const w = svg.clientWidth || 600;
  const h = 160;
  const pad = 24;
  const values = sorted.map((s) => s.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (sorted.length - 1);

  const points = sorted.map((s, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (s.weight - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const pathD = points.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(" ");

  const ns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", pathD);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "var(--accent)");
  path.setAttribute("stroke-width", "2.5");
  svg.appendChild(path);

  points.forEach((pt) => {
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", pt[0]);
    c.setAttribute("cy", pt[1]);
    c.setAttribute("r", "3");
    c.setAttribute("fill", "var(--accent)");
    svg.appendChild(c);
  });

  [min, max].forEach((val, idx) => {
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", 4);
    t.setAttribute("y", idx === 0 ? h - 6 : 14);
    t.setAttribute("font-size", "10");
    t.setAttribute("fill", "var(--muted)");
    t.textContent = val.toFixed(1) + "kg";
    svg.appendChild(t);
  });
}

function addWeight() {
  const date = $("#weight-date").value || todayStr();
  const val = parseFloat($("#weight-input").value);
  if (!val || val <= 0) {
    alert("体重を入力してください");
    return;
  }
  const existing = weights.find((w) => w.date === date);
  if (existing) {
    existing.weight = val;
  } else {
    weights.push({ id: uid(), date, weight: val });
  }
  save("ht_weights", weights);
  $("#weight-input").value = "";
  renderWeightTab();
}

// ---------- 履歴タブ ----------
function renderHistoryTab() {
  const list = $("#history-list");
  list.innerHTML = "";
  const dates = Array.from(new Set(meals.map((m) => m.date))).sort((a, b) => (a < b ? 1 : -1));
  const targets = profile ? computeTargets(profile) : null;
  if (dates.length === 0) {
    list.innerHTML = '<div class="empty-msg">まだ記録がありません</div>';
    return;
  }
  dates.slice(0, 21).forEach((date) => {
    const totals = sumMacros(mealsForDate(date));
    const row = document.createElement("div");
    row.className = "history-row";
    let diffHtml = "";
    if (targets) {
      const diff = Math.round(totals.kcal - targets.targetKcal);
      const cls = diff > 0 ? "over" : "under";
      diffHtml = `<span class="diff ${cls}">${diff > 0 ? "+" : ""}${diff} kcal</span>`;
    }
    row.innerHTML = `<span class="date">${date}</span><span>${Math.round(totals.kcal)} kcal ${diffHtml}</span>`;
    list.appendChild(row);
  });
}

// ---------- プロフィールタブ ----------
function renderProfileTab() {
  if (!profile) return;
  $("#p-age").value = profile.age;
  $("#p-gender").value = profile.gender;
  $("#p-height").value = profile.height;
  $("#p-weight").value = profile.weight;
  $("#p-activity").value = profile.activity;
  $("#p-goal").value = profile.goal;
  showTargetDisplay(profile);
}

function showTargetDisplay(p) {
  const t = computeTargets(p);
  $("#target-display").style.display = "grid";
  $("#target-display").innerHTML = `
    <div>目標カロリー<strong>${t.targetKcal} kcal</strong></div>
    <div>基礎代謝(BMR)<strong>${t.bmr} kcal</strong></div>
    <div>タンパク質目標<strong>${t.targetP} g</strong></div>
    <div>脂質目標<strong>${t.targetF} g</strong></div>
    <div>炭水化物目標<strong>${t.targetC} g</strong></div>
    <div>消費カロリー(TDEE)<strong>${t.tdee} kcal</strong></div>
  `;
}

function saveProfile() {
  const age = parseFloat($("#p-age").value);
  const gender = $("#p-gender").value;
  const height = parseFloat($("#p-height").value);
  const weight = parseFloat($("#p-weight").value);
  const activity = $("#p-activity").value;
  const goal = $("#p-goal").value;
  if (!age || !height || !weight) {
    alert("年齢・身長・体重を入力してください");
    return;
  }
  profile = { age, gender, height, weight, activity, goal };
  save("ht_profile", profile);
  showTargetDisplay(profile);
  renderTodayTab();
}

// ---------- 食事ブロック生成 ----------
function buildMealBlocks() {
  const container = $("#meals-container");
  container.innerHTML = MEAL_TYPES.map(
    (type) => `
    <div class="meal-block">
      <div class="meal-header">
        <span class="name">${type} <span class="kcal" id="meal-kcal-${type}"></span></span>
        <button class="add-btn add-meal-btn" data-meal="${type}">+ 追加</button>
      </div>
      <div id="meal-list-${type}"></div>
    </div>
  `
  ).join("");
}

// ---------- 初期化 ----------
function init() {
  buildMealBlocks();

  $$(".tabs button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  $("#current-date").addEventListener("change", (e) => {
    currentDate = e.target.value;
    renderTodayTab();
  });

  $$(".add-meal-btn").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.meal)));
  $("#close-modal").addEventListener("click", closeModal);
  $("#modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });

  $$("#modal .mode-toggle button").forEach((b) =>
    b.addEventListener("click", () => setModalMode(b.dataset.mode))
  );

  $("#food-search").addEventListener("input", (e) => renderFoodResults(e.target.value));
  $("#confirm-add-food").addEventListener("click", addSelectedFood);
  $("#confirm-manual-food").addEventListener("click", addManualFood);

  $("#weight-date").value = todayStr();
  $("#add-weight-btn").addEventListener("click", addWeight);

  $("#save-profile-btn").addEventListener("click", saveProfile);

  if (!profile) {
    // デフォルト値をフォームに入れておく
    $("#p-age").value = 30;
    $("#p-height").value = 165;
    $("#p-weight").value = 60;
  }

  switchTab(profile ? "today" : "profile");
}

document.addEventListener("DOMContentLoaded", init);
