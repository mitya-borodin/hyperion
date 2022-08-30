"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const node_child_process_1 = require("node:child_process");
const node_path_1 = require("node:path");
const logFilePath = (0, node_path_1.resolve)(__dirname, "../log.txt");
const run = async () => {
    const ls = (0, node_child_process_1.spawn)("/root/node/bin/node", [(0, node_path_1.resolve)(__dirname, "index.js")]);
    const timer = setInterval(async () => {
        const logStat = await (0, promises_1.stat)(logFilePath);
        const logInMegaBytes = logStat.size / (1024 * 1024);
        if (logInMegaBytes > 0.05) {
            await (0, promises_1.writeFile)(logFilePath, "", "utf8");
        }
    }, 1 * 60 * 1000);
    ls.stdout.on("data", (data) => {
        console.log(data.toString());
        (0, promises_1.appendFile)(logFilePath, data, { encoding: "utf8" });
    });
    ls.stderr.on("data", (data) => {
        console.error(data.toString());
        (0, promises_1.appendFile)(logFilePath, data, { encoding: "utf8" });
    });
    ls.on("close", (code) => {
        clearInterval(timer);
        console.log(`Child process exited with code ${code} 🛑`);
    });
};
run();
