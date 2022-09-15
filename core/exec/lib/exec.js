"use strict";

const Package = require("@febutler/package");
const log = require("@febutler/log");

function exec() {
  new Package();
  const targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  console.log("log_level", process.env.LOG_LEVEL);
  log.verbose("targetPath: " + targetPath);
  log.verbose("homePath: " + homePath);
}

module.exports = exec;
