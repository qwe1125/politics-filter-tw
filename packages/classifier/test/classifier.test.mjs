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
