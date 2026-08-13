import { spawn } from "node:child_process";
import http from "node:http";

const port = 3211;
const srv = spawn("npx", ["next", "dev", "-p", String(port)], { cwd: process.cwd(), stdio: "pipe", shell: true });
srv.stdout.on("data", (d) => { const t = d.toString(); if (t.includes("Ready")) console.log("[srv] READY"); });
srv.stderr.on("data", (d) => console.log("[err] " + d));

function get(path) {
  return new Promise((res) => {
    const req = http.get({ host: "localhost", port, path, timeout: 90000 }, (r) => { res(r.statusCode); r.resume(); });
    req.on("error", (e) => res("ERR:" + e.code));
    req.on("timeout", () => { req.destroy(); res("TIMEOUT"); });
  });
}

await new Promise((r) => setTimeout(r, 9000));
for (const p of ["/", "/pricing", "/about", "/login", "/admin/login", "/nope"]) {
  const code = await get(p);
  console.log("GET", p, "=>", code);
}
srv.kill("SIGKILL");
process.exit(0);
