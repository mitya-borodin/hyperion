"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const run = async () => {
    const ls = (0, node_child_process_1.spawn)("/root/node/bin/node", [(0, node_path_1.resolve)(__dirname, "index.js")]);
    ls.stdout.on("data", (data) => {
        console.log(data.toString());
    });
    ls.stderr.on("data", (data) => {
        console.error(data.toString());
    });
    ls.on("close", (code) => {
        console.log(`Child process exited with code ${code} 🛑`);
    });
};
run();
