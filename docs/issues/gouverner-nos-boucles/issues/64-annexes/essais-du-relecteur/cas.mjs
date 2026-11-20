const { aDesSousTests } = await import(process.argv[2]);
const pas = ["`feat(${nom}): suite (#2)`", '"la suite (x)"', "'it (x)'", '// describe("x")', '/* t.test("x", */', "if (/[\"'`]/.test(x)) {}", 'test("… describe ( …", () => {});'];
const oui = ['t.test("x", () => {})', "t.test(`x`, () => {})", 'describe("x", () => {})', 'it("x", () => {})', '`${ t.test("x") }`', 'x => t.test("y", () => {})', '/"/.test(a) || t.test("y", () => {})'];
const doute = ["const a = `ouvert\n", 'const a = "ouvert\nb";', "const a = `x ${ y\n"];
for (const s of pas) console.log("pas  ", aDesSousTests(s), JSON.stringify(s));
for (const s of oui) console.log("oui  ", aDesSousTests(s), JSON.stringify(s));
for (const s of doute) console.log("doute", aDesSousTests(s), JSON.stringify(s));
