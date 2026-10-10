import assert from "node:assert/strict";
import test from "node:test";
import { classify } from "../dist/index.js";

test("blocks obvious election content in medium mode", () => {
  const result = classify({ text: "立法院黨團今天針對選舉法案進行表決", strength: "medium" });
  assert.equal(result.blocked, true);
  assert.ok(result.politicalScore >= 0.62);
});

test("keeps ordinary lifestyle content", () => {
  const result = classify({ text: "今天去吃拉麵，晚上看棒球", strength: "medium" });
  assert.equal(result.blocked, false);
});

test("nuclear mode blocks weak policy signals", () => {
  const result = classify({ text: "今天討論新的補助政策", strength: "nuclear" });
  assert.equal(result.blocked, true);
});

test("blocks election result discussion without the word election", () => {
  const result = classify({
    text: "票差這麼多，真的蠻詭異的。這個人做民調跟最後結果有準嗎？留言的人都是藍白。",
    strength: "medium"
  });
  assert.equal(result.blocked, true);
  assert.ok(result.matched.some((match) => match.term === "票差"));
});

test("recognizes political topics beyond elections", () => {
  const examples = [
    ["內閣改組後，行政院長公布施政方針", "government"],
    ["立法院委員會審查中央政府總預算，黨團協商後進入二讀", "legislature"],
    ["陸委會說明兩岸關係與台海局勢", "cross_strait"],
    ["外交部回應邦交國斷交與國際制裁", "international_politics"],
    ["政府推動居住正義及能源轉型政策", "public_policy"],
    ["朝野政黨討論聯合執政與政治獻金", "party_politics"]
  ];
  for (const [text, category] of examples) {
    const result = classify({ text, strength: "medium" });
    assert.equal(result.blocked, true, text);
    assert.ok(result.categories.includes(category), text);
  }
});

test("ambiguous everyday terms do not block medium mode alone", () => {
  for (const text of [
    "今天投票選出最喜歡的拉麵店",
    "員工民調顯示大家喜歡遠端上班",
    "我申請旅遊補助，週末去台南吃飯",
    "選手當選隊長，大家一起慶祝"
  ]) {
    assert.equal(classify({ text, strength: "medium" }).blocked, false, text);
  }
});

test("long official names do not count their shorter aliases twice", () => {
  const result = classify({ text: "中國國民黨", strength: "low" });
  assert.deepEqual(result.matched.map((match) => match.term), ["中國國民黨"]);
});

test("recognizes the official 臺 spelling used in political names", () => {
  const result = classify({ text: "臺灣民眾黨對臺海政策提出新主張", strength: "medium" });
  assert.equal(result.blocked, true);
  assert.ok(result.categories.includes("party_politics"));
  assert.ok(result.categories.includes("cross_strait"));
});

test("recognizes a councilor allegation in a news headline", () => {
  const result = classify({
    text: "魏汝萱遭控用小帳抹黑沈伯洋。網紅比對影片細節，指議員使用匿名小帳抹黑對手。",
    strength: "medium"
  });
  assert.equal(result.blocked, true);
  assert.ok(result.categories.includes("political_person"));
});
