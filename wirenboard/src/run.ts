import { appendFile, stat, writeFile } from "fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const logFilePath = resolve(__dirname, "../log.txt");

const run = async () => {
  const ls = spawn("/root/node/bin/node", [resolve(__dirname, "index.js")]);

  const timer = setInterval(async () => {
    const logStat = await stat(logFilePath);
    const logInMegaBytes = logStat.size / (1024 * 1024);

    if (logInMegaBytes > 0.15) {
      await writeFile(logFilePath, "", "utf8");
    }
  }, 1 * 60 * 1000);

  ls.stdout.on("data", (data: Buffer) => {
    console.log(data.toString());

    appendFile(logFilePath, data, { encoding: "utf8" });
  });

  ls.stderr.on("data", (data: Buffer) => {
    console.error(data.toString());

    appendFile(logFilePath, data, { encoding: "utf8" });
  });

  ls.on("close", (code: number | null) => {
    clearInterval(timer);

    console.log(`Child process exited with code ${code} 🛑`);
  });
};

run();
