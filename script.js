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

// ---------- 出産準備データ ----------
const BIRTH_CATEGORIES = [
  { id: "labor_bag", label: "陣痛バッグ（陣痛が来たらすぐ持って行く）" },
  { id: "hospital_bag", label: "入院バッグ（入院中に必要なもの）" },
  { id: "baby_items", label: "赤ちゃん用品" },
  { id: "not_needed", label: "持参不要品（産院の貸出・支給品）" },
  { id: "after_home", label: "帰宅後グッズ" },
  { id: "pending", label: "検討中・未決定事項" },
];

const DEFAULT_BIRTH_ITEMS = [
  // 陣痛バッグ
  { id: "b-mothernote", category: "labor_bag", name: "母子手帳・診察券・保険証", note: "" },
  { id: "b-cash", category: "labor_bag", name: "現金・印鑑", note: "" },
  { id: "b-phone", category: "labor_bag", name: "スマホ・充電器", note: "" },
  { id: "b-jelly", category: "labor_bag", name: "ゼリー飲料（陣痛時のエネルギー補給）", note: "ウイダーinゼリー エネルギー マスカット味が第一候補" },
  { id: "b-tennisball", category: "labor_bag", name: "テニスボール等（腰押し用）", note: "" },
  { id: "b-fan", category: "labor_bag", name: "うちわ・手持ち扇風機", note: "" },

  // 入院バッグ
  { id: "b-pajama", category: "hospital_bag", name: "パジャマ・部屋着（前開き）", note: "" },
  { id: "b-nursingbra", category: "hospital_bag", name: "授乳用ブラ・パッド", note: "" },
  { id: "b-toiletries", category: "hospital_bag", name: "洗面用具・タオル", note: "" },
  { id: "b-earplug", category: "hospital_bag", name: "耳栓", note: "入院中は優先度低め。帰宅後の夜間交代制用として購入予定" },
  { id: "b-slippers", category: "hospital_bag", name: "スリッパ", note: "" },
  { id: "b-outfit-me", category: "hospital_bag", name: "退院時の服（自分用）", note: "" },
  { id: "b-carseat", category: "hospital_bag", name: "チャイルドシート（退院時に必要）", note: "" },

  // 赤ちゃん用品
  { id: "b-clothes", category: "baby_items", name: "短肌着・コンビ肌着", note: "購入済み", checked: true },
  { id: "b-swaddle", category: "baby_items", name: "おくるみ", note: "ユニクロで購入済み", checked: true },
  { id: "b-carrier", category: "baby_items", name: "抱っこ紐", note: "ベビービョルン「ハーモニー」に決定（試着済み・新生児からインサート不要・後抱き・4way）" },
  { id: "b-diaper", category: "baby_items", name: "おむつ（新生児用）", note: "" },
  { id: "b-wipes", category: "baby_items", name: "おしりふき", note: "" },
  { id: "b-gauze", category: "baby_items", name: "ガーゼハンカチ", note: "" },
  { id: "b-outfit-baby", category: "baby_items", name: "カバーオール／ショートオール", note: "新生児期は不要と判断、後回しでOK" },

  // 持参不要品
  { id: "b-clinic-list", category: "not_needed", name: "産院の貸出・支給品リストを確認", note: "わたしのクリニック産科LCの案内に基づく。施設ごとに異なるため必ず最新の案内で確認" },
  { id: "b-postpartum-pants", category: "not_needed", name: "産褥ショーツ（入院中）", note: "産院支給の可能性あり。要確認" },
  { id: "b-babywear-in", category: "not_needed", name: "赤ちゃんの肌着・おむつ（入院中）", note: "産院支給の可能性あり。要確認" },

  // 帰宅後グッズ
  { id: "b-pump", category: "after_home", name: "搾乳機", note: "保留：産後の母乳の出次第で判断" },
  { id: "b-scale", category: "after_home", name: "ベビースケール", note: "保留：レンタルも選択肢" },
  { id: "b-babybath", category: "after_home", name: "ベビーバス・沐浴剤", note: "" },

  // 検討中・未決定
  { id: "b-omiyamairi", category: "pending", name: "お宮参りの実施可否・時期", note: "義務ではなく任意行事。8月出産だと真夏になるため時期をずらす方向で検討中（未確定）" },
];

let birthItems = load("ht_birth_items", null);
if (!birthItems) {
  birthItems = DEFAULT_BIRTH_ITEMS.map((i) => ({ checked: false, ...i }));
  save("ht_birth_items", birthItems);
}

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
  if (tab === "birth") renderBirthTab();
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

// ---------- 出産準備タブ ----------
function renderBirthTab() {
  const total = birthItems.length;
  const done = birthItems.filter((i) => i.checked).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  $("#birth-progress-bar").style.width = pct + "%";
  $("#birth-progress-text").textContent = `${done} / ${total} 完了`;

  const container = $("#birth-categories");
  container.innerHTML = BIRTH_CATEGORIES.map(
    (cat) => `
    <div class="card">
      <h2>${escapeHtml(cat.label)}</h2>
      <div class="checklist" id="birth-list-${cat.id}"></div>
      <div class="add-item-row">
        <input type="text" id="birth-add-input-${cat.id}" placeholder="項目を追加" />
        <button data-cat="${cat.id}" class="birth-add-btn">追加</button>
      </div>
    </div>
  `
  ).join("");

  BIRTH_CATEGORIES.forEach((cat) => {
    const listEl = $(`#birth-list-${cat.id}`);
    const items = birthItems.filter((i) => i.category === cat.id);
    if (items.length === 0) {
      listEl.innerHTML = '<div class="empty-msg">項目はありません</div>';
      return;
    }
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "checklist-item";
      row.innerHTML = `
        <label class="checklist-label">
          <input type="checkbox" data-id="${item.id}" ${item.checked ? "checked" : ""} />
          <span class="checklist-text">
            <span class="checklist-name ${item.checked ? "done" : ""}">${escapeHtml(item.name)}</span>
            ${item.note ? `<span class="checklist-note">${escapeHtml(item.note)}</span>` : ""}
          </span>
        </label>
        <button class="del-btn" data-del="${item.id}">✕</button>
      `;
      row.querySelector("input[type=checkbox]").addEventListener("change", (e) => {
        item.checked = e.target.checked;
        save("ht_birth_items", birthItems);
        renderBirthTab();
      });
      row.querySelector("[data-del]").addEventListener("click", () => {
        birthItems = birthItems.filter((i) => i.id !== item.id);
        save("ht_birth_items", birthItems);
        renderBirthTab();
      });
      listEl.appendChild(row);
    });
  });

  $$(".birth-add-btn").forEach((btn) => {
    btn.addEventListener("click", () => addBirthItem(btn.dataset.cat));
  });
  BIRTH_CATEGORIES.forEach((cat) => {
    $(`#birth-add-input-${cat.id}`).addEventListener("keydown", (e) => {
      if (e.key === "Enter") addBirthItem(cat.id);
    });
  });
}

function addBirthItem(catId) {
  const input = $(`#birth-add-input-${catId}`);
  const name = input.value.trim();
  if (!name) return;
  birthItems.push({ id: uid(), category: catId, name, note: "", checked: false });
  save("ht_birth_items", birthItems);
  renderBirthTab();
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
