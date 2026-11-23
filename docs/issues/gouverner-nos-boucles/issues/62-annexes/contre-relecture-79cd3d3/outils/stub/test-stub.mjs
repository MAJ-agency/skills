// Un faux node:test : note le nom de chaque test de premier niveau, ne joue rien.
import { appendFileSync } from "node:fs";
const sortie = process.env.NOMS_SORTIE;
const noter = (nom) => appendFileSync(sortie, JSON.stringify(nom) + "\n");
export function test(nom) { noter(typeof nom === "string" ? nom : "<anonyme>"); }
test.skip = test; test.todo = test; test.only = test;
export const it = test, describe = test, suite = test;
export const before = () => {}, after = () => {}, beforeEach = () => {}, afterEach = () => {};
export const mock = { fn: () => () => {}, method: () => {}, timers: { enable() {}, reset() {} } };
export default test;
