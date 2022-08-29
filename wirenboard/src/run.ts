import { spawn } from "node:child_process";

const run = async () => {
  const ls = spawn("/root/node/bin/node", ["/root/butler/wirenboard/dist/index.js"]);

  ls.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  ls.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  ls.on("close", (code) => {
    console.log(`Cyhild process exited with code ${code}`);
  });
};

run();
