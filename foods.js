// 食品データベース（概算値・目安）。kcal, p(タンパク質g), f(脂質g), c(炭水化物g) は unit あたり
const FOODS = [
  // 主食
  { name: "ご飯（茶碗1杯 150g）", category: "主食", kcal: 252, p: 3.8, f: 0.5, c: 55.7 },
  { name: "玄米ご飯（150g）", category: "主食", kcal: 248, p: 4.2, f: 1.5, c: 53.4 },
  { name: "食パン（6枚切り1枚）", category: "主食", kcal: 158, p: 5.6, f: 2.6, c: 28.0 },
  { name: "食パン（8枚切り1枚）", category: "主食", kcal: 119, p: 4.2, f: 2.0, c: 21.0 },
  { name: "うどん（茹で1玉）", category: "主食", kcal: 210, p: 5.2, f: 0.8, c: 43.2 },
  { name: "そば（茹で1玉）", category: "主食", kcal: 224, p: 8.6, f: 1.4, c: 43.2 },
  { name: "スパゲッティ（茹で200g）", category: "主食", kcal: 300, p: 10.6, f: 1.4, c: 59.2 },
  { name: "おにぎり（1個）", category: "主食", kcal: 168, p: 2.5, f: 0.3, c: 37.1 },
  { name: "ラーメン（麺+スープ）", category: "主食", kcal: 470, p: 20.0, f: 12.0, c: 68.0 },
  { name: "カレーライス（1皿）", category: "主食", kcal: 760, p: 15.0, f: 25.0, c: 110.0 },

  // 主菜（肉・魚・卵・大豆）
  { name: "鶏むね肉 皮なし（100g焼き）", category: "主菜", kcal: 121, p: 22.3, f: 1.9, c: 0 },
  { name: "鶏もも肉 皮なし（100g焼き）", category: "主菜", kcal: 138, p: 19.0, f: 5.9, c: 0 },
  { name: "鶏もも肉 皮つき（100g焼き）", category: "主菜", kcal: 204, p: 17.0, f: 14.2, c: 0 },
  { name: "豚ロース（100g焼き）", category: "主菜", kcal: 263, p: 22.7, f: 18.3, c: 0.2 },
  { name: "豚バラ（100g焼き）", category: "主菜", kcal: 386, p: 14.4, f: 35.4, c: 0 },
  { name: "牛もも肉（100g焼き）", category: "主菜", kcal: 209, p: 25.6, f: 11.6, c: 0.3 },
  { name: "鮭（1切れ 80g焼き）", category: "主菜", kcal: 176, p: 17.8, f: 9.7, c: 0.1 },
  { name: "サバ（1切れ 80g焼き）", category: "主菜", kcal: 210, p: 16.5, f: 13.9, c: 0.2 },
  { name: "マグロ赤身 刺身（5切れ 50g）", category: "主菜", kcal: 60, p: 13.1, f: 0.6, c: 0.1 },
  { name: "卵（1個）", category: "主菜", kcal: 76, p: 6.2, f: 5.2, c: 0.2 },
  { name: "卵焼き（2個分）", category: "主菜", kcal: 150, p: 12.3, f: 10.5, c: 1.5 },
  { name: "豆腐 絹（1/2丁 150g）", category: "主菜", kcal: 84, p: 7.4, f: 6.0, c: 2.6 },
  { name: "納豆（1パック）", category: "主菜", kcal: 89, p: 7.4, f: 4.5, c: 5.4 },
  { name: "ウインナー（2本）", category: "主菜", kcal: 128, p: 4.6, f: 11.6, c: 1.2 },
  { name: "ハンバーグ（1個 150g）", category: "主菜", kcal: 306, p: 16.4, f: 21.9, c: 10.5 },
  { name: "唐揚げ（4個）", category: "主菜", kcal: 336, p: 21.5, f: 22.0, c: 10.6 },
  { name: "餃子（5個）", category: "主菜", kcal: 220, p: 7.5, f: 10.5, c: 22.5 },
  { name: "刺身盛り合わせ（5点 100g）", category: "主菜", kcal: 130, p: 22.0, f: 3.5, c: 1.0 },

  // 副菜・野菜
  { name: "味噌汁（1杯）", category: "副菜", kcal: 40, p: 2.6, f: 1.2, c: 4.0 },
  { name: "サラダ（ドレッシングなし1皿）", category: "副菜", kcal: 20, p: 1.0, f: 0.2, c: 3.5 },
  { name: "ほうれん草のお浸し（1皿）", category: "副菜", kcal: 20, p: 1.6, f: 0.3, c: 2.5 },
  { name: "きんぴらごぼう（1皿）", category: "副菜", kcal: 90, p: 1.5, f: 4.0, c: 11.0 },
  { name: "肉じゃが（1皿）", category: "副菜", kcal: 180, p: 8.0, f: 5.0, c: 24.0 },
  { name: "冷奴（1皿）", category: "副菜", kcal: 84, p: 7.4, f: 6.0, c: 2.6 },
  { name: "筑前煮（1皿）", category: "副菜", kcal: 140, p: 7.0, f: 5.0, c: 15.0 },
  { name: "ポテトサラダ（1皿）", category: "副菜", kcal: 140, p: 2.5, f: 8.0, c: 15.0 },
  { name: "枝豆（1皿）", category: "副菜", kcal: 67, p: 5.8, f: 3.3, c: 4.3 },

  // 汁物
  { name: "コーンスープ（1杯）", category: "汁物", kcal: 90, p: 2.0, f: 3.5, c: 13.0 },
  { name: "お吸い物（1杯）", category: "汁物", kcal: 10, p: 0.5, f: 0.1, c: 1.5 },

  // 果物
  { name: "バナナ（1本）", category: "果物", kcal: 86, p: 1.1, f: 0.2, c: 22.5 },
  { name: "りんご（1/2個）", category: "果物", kcal: 68, p: 0.2, f: 0.1, c: 19.4 },
  { name: "みかん（1個）", category: "果物", kcal: 32, p: 0.5, f: 0.1, c: 8.1 },
  { name: "いちご（5粒）", category: "果物", kcal: 24, p: 0.7, f: 0.1, c: 5.3 },

  // 飲み物
  { name: "牛乳（コップ1杯 200ml）", category: "飲み物", kcal: 134, p: 6.6, f: 7.6, c: 9.6 },
  { name: "豆乳（200ml）", category: "飲み物", kcal: 92, p: 7.2, f: 3.6, c: 6.0 },
  { name: "コーヒー ブラック", category: "飲み物", kcal: 4, p: 0.2, f: 0, c: 0.7 },
  { name: "カフェラテ（200ml）", category: "飲み物", kcal: 130, p: 6.6, f: 7.0, c: 10.0 },
  { name: "オレンジジュース（200ml）", category: "飲み物", kcal: 92, p: 1.4, f: 0.2, c: 22.0 },
  { name: "ビール（350ml缶）", category: "飲み物", kcal: 140, p: 1.1, f: 0, c: 10.9 },
  { name: "緑茶", category: "飲み物", kcal: 0, p: 0, f: 0, c: 0 },

  // 間食
  { name: "ヨーグルト プレーン（100g）", category: "間食", kcal: 62, p: 3.6, f: 3.0, c: 4.9 },
  { name: "ポテトチップス（1袋 60g）", category: "間食", kcal: 336, p: 3.0, f: 21.6, c: 31.8 },
  { name: "チョコレート（1枚 50g）", category: "間食", kcal: 279, p: 3.5, f: 17.0, c: 28.5 },
  { name: "クッキー（3枚）", category: "間食", kcal: 150, p: 1.8, f: 7.0, c: 20.0 },
  { name: "アイスクリーム（1個）", category: "間食", kcal: 180, p: 3.0, f: 10.0, c: 20.0 },
  { name: "プロテインバー（1本）", category: "間食", kcal: 200, p: 20.0, f: 7.0, c: 15.0 },
];
