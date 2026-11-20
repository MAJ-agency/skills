import { pathToFileURL } from "node:url";
const { MOTS_ECMASCRIPT } = await import(pathToFileURL(process.argv[2]).href);
// ECMA-262 2024, 12.7.2 ReservedWord ; 13.1.1 mots réservés en mode strict ; contextuels nommés par A-177.
const reserves = "await break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield".split(" ");
const strict = "implements interface let package private protected public static".split(" ");
const contextuels = "let static yield await async of get set".split(" ");
const attendu = new Set([...reserves, ...strict, ...contextuels]);
const manque = [...attendu].filter((m) => !MOTS_ECMASCRIPT.has(m));
const enTrop = [...MOTS_ECMASCRIPT].filter((m) => !attendu.has(m));
console.log(`réservés ${reserves.length}, attendu ${attendu.size}, liste ${MOTS_ECMASCRIPT.size}, manque [${manque}], en trop [${enTrop}]`);
// Contrôle : chacun des mots réservés est bien refusé comme nom de variable en module.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const refuses = [...reserves, ...strict].filter((m) => { writeFileSync("js4/mot.mjs", `var ${m} = 1;\n`); return spawnSync(process.execPath, ["--check", "js4/mot.mjs"]).status !== 0; });
console.log(`refusés comme nom en module : ${refuses.length} sur ${new Set([...reserves, ...strict]).size}`);
