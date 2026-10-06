const assert = require("assert");
const { generateSession, FAMILY, GREETINGS, MONTHS, WEEKDAYS } = require("../app.js");

const RUNS = 5000;
const male = ["Grandfather", "Father", "Brother", "Uncle", "Cousin", "Son"];
const female = ["Grandmother", "Mother", "Sister", "Auntie", "Daughter"];
let deadCounts = new Set();
let orders = new Set();

for (let r = 0; r < RUNS; r++) {
  const s = generateSession();
  assert.strictEqual(s.length, 12);
  assert.deepStrictEqual([...s.map(x => x.member)].sort(), FAMILY.map(f => f.name).sort());
  assert.deepStrictEqual([...new Set(s.map(x => x.birthday.match(/ (\w+)\.$/)[1]))].sort(), [...MONTHS].sort());
  assert.strictEqual(new Set(s.map(x => x.birthday.match(/ (\w+)\.$/)[1])).size, 12);
  for (const w of WEEKDAYS) assert(s.some(x => x.birthday.includes(` ${w}, `)), "weekday " + w);
  for (const g of GREETINGS) assert(s.some(x => x.greeting === g), "greeting " + g);
  let dead = 0;
  for (const x of s) {
    assert(/is (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \d\d [A-Z][a-z]+\.$/.test(x.birthday), x.birthday);
    if (x.member === "Me") {
      assert(x.birthday.startsWith("My birthday is "), x.birthday);
      assert.strictEqual(x.dead, null);
    } else {
      assert(x.birthday.startsWith(`My ${x.member.toLowerCase()}\u2019s birthday is `), x.birthday);
    }
    if (x.dead) {
      dead++;
      assert.strictEqual(x.dead, (male.includes(x.member) ? "He" : "She") + " is dead.");
      assert(male.includes(x.member) || female.includes(x.member));
    }
  }
  deadCounts.add(dead);
  orders.add(s.map(x => x.member).join());
}
assert(deadCounts.size > 3, "dead count should vary");
assert(orders.size > 1000, "orders should vary");
console.log(`OK: ${RUNS} sessions. dead-line counts seen:`, [...deadCounts].sort((a,b)=>a-b).join(","), "| distinct orders:", orders.size);
