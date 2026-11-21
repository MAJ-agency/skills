import { pathToFileURL } from "node:url";
const { lancer } = await import(pathToFileURL(process.argv[2]).href);
const script = "const { spawn } = require('node:child_process'); const e = spawn('sleep', ['8'], { stdio: 'inherit', detached: true }); console.log(e.pid); setInterval(() => {}, 1000);";
const d = Date.now();
const r = await lancer(["-e", script], { cwd: process.cwd(), env: { PATH: process.env.PATH }, borne: 1000 });
console.log(`résolue ${Date.now() - d} ms tue=${r.tue}`);
try { process.kill(Number(r.sortie.split("\n")[0]), "SIGKILL"); } catch {}
