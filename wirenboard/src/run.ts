import { spawn } from "node:child_process";
import { resolve } from "node:path";

const run = async () => {
  const ls = spawn("/root/node/bin/node", [resolve(__dirname, "index.js")]);

  ls.stdout.on("data", (data: Buffer) => {
    console.log(data.toString());
  });

  ls.stderr.on("data", (data: Buffer) => {
    console.error(data.toString());
  });

  ls.on("close", (code: number | null) => {
    console.log(`Child process exited with code ${code} 🛑`);
  });
};

run();
