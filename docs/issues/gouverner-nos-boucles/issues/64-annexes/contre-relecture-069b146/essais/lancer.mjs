import { pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
const { lancer } = await import(pathToFileURL(process.argv[2]).href);
const vivant = (pid) => existsSync(`/proc/${pid}/stat`) && !/^\d+ \(.*\) Z/.test(readFileSync(`/proc/${pid}/stat`, "utf8"));
const essais = {
  "petit-enfant tient le tube": "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['30'], { stdio: 'inherit' }); console.log(e.pid); setInterval(() => {}, 1000);",
  "ignore SIGTERM": "process.on('SIGTERM', () => {}); const { spawn } = require('node:child_process'); const e = spawn('sleep', ['30'], { stdio: 'inherit' }); console.log(e.pid); setInterval(() => {}, 1000);",
  "petit-enfant détaché (setsid) tient le tube": "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['30'], { stdio: 'inherit', detached: true }); console.log(e.pid); setInterval(() => {}, 1000);",
  "enfant sort, petit-enfant garde le tube (sans kill)": "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['4'], { stdio: 'inherit' }); e.unref(); console.log(e.pid);",
  "petit-enfant détaché garde le tube, enfant bloqué": "const { spawn } = require('node:child_process'); const e = spawn('sh', ['-c', 'sleep 30'], { stdio: 'inherit', detached: true }); console.log(e.pid); while(true){}",
};
for (const [nom, script] of Object.entries(essais)) {
  const d = Date.now();
  const borne = 1000;
  const r = await lancer(["-e", script], { cwd: process.cwd(), env: { PATH: process.env.PATH }, borne });
  const ms = Date.now() - d;
  await new Promise((f) => setTimeout(f, 300));
  const pid = Number(r.sortie.split("\n")[0]);
  console.log(`${nom} : borne ${borne} ms, résolue ${ms} ms, tue=${r.tue} code=${r.code} signal=${r.signal} r.ms=${r.ms}, petit-enfant ${pid} vivant=${vivant(pid)}`);
  try { process.kill(pid, "SIGKILL"); } catch {}
}
// arreter() avant la borne
const p = lancer(["-e", "setInterval(()=>{},1000)"], { cwd: process.cwd(), env: { PATH: process.env.PATH }, borne: 60_000 });
const d = Date.now(); setTimeout(() => p.arreter(), 200);
const r = await p; console.log(`arreter : ${Date.now() - d} ms, tue=${r.tue} arrete=${r.arrete}`);
// arreter() après résolution
p.arreter(); console.log("arreter après résolution : sans effet, pas d'exception");
// pid absent (spawn échoue) : cwd inexistant
const e = await lancer(["-e", "1"], { cwd: "/nulle/part", env: {}, borne: 1000 });
console.log(`cwd absent : ${JSON.stringify({ code: e.code, tue: e.tue })}`);
