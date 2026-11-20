import { test } from "node:test";
import assert from "node:assert/strict";
test("vert", (t) => { t.diagnostic("poses : 3 travaux, délai 10 s"); });
test("rouge", (t) => { t.diagnostic("marge 10 %"); assert.equal(1, 2); });
