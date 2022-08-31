"use strict";

const log = require("@febutler/log");
const pkg = require("../package.json");

function initCli() {
  checkPkgVersion();
}

function checkPkgVersion() {
  log.notice("version", pkg.version);
}

module.exports = initCli;
