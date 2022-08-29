"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const run = async () => {
    const ls = (0, node_child_process_1.spawn)("/root/node/bin/node", ["/root/butler/wirenboard/dist/index.js"]);
    ls.stdout.on("data", (data) => {
        console.log(data);
    });
    ls.stderr.on("data", (data) => {
        console.error(data);
    });
    ls.on("close", (code) => {
        console.log(`Child process exited with code ${code}`);
    });
};
run();
