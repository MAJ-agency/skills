// L'essai `close.mjs` du relecteur, contre la forme d'A-172 : l'enfant dans son groupe, tué par son groupe, la tranche
// résolue sur `exit`, ses flux détruits.
import { execSync, spawn } from "node:child_process";
const require_ps = () => execSync("ps -eo stat,args").toString().split("\n").some((l) => /^[^Z]\S*\s+sleep 6$/.test(l));
const t0 = Date.now();
const e = spawn(process.execPath, ["-e", "require('child_process').spawn('sleep',['6'],{stdio:'inherit'}); setInterval(()=>{},1000)"], { stdio: ["ignore", "pipe", "pipe"], detached: true });
e.stdout.on("data", () => {});
e.stderr.on("data", () => {});
let tue = false;
setTimeout(() => { tue = true; process.kill(-e.pid, "SIGKILL"); }, 1000);
e.on("exit", (c, s) => {
  console.log("exit", s, (Date.now() - t0) / 1000);
  if (tue) { e.stdout.destroy(); e.stderr.destroy(); console.log("résolue", (Date.now() - t0) / 1000); }
});
e.on("close", (c, s) => console.log("close", s, (Date.now() - t0) / 1000));
setTimeout(() => console.log("sleep 6 encore là à 3 s :", require_ps()), 3000);
