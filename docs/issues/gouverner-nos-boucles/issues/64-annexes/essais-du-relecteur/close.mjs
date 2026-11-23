import { spawn } from "node:child_process";
const t0 = Date.now();
const e = spawn(process.execPath, ["-e", "require('child_process').spawn('sleep',['6'],{stdio:'inherit'}); setInterval(()=>{},1000)"], { stdio: ["ignore", "pipe", "pipe"] });
e.stdout.on("data", () => {});
setTimeout(() => e.kill("SIGKILL"), 1000);
e.on("exit", (c, s) => console.log("exit", s, (Date.now() - t0) / 1000));
e.on("close", (c, s) => console.log("close", s, (Date.now() - t0) / 1000));
