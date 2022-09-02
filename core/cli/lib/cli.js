"use strict";

const semver = require("semver");
const colors = require("colors");
const pathExists = require("path-exists").sync;
const log = require("@febutler/log");
const pkg = require("../package.json");
const { LOWEST_NODE_VERSION } = require("./const");

function initCli() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    log.verbose("test", "--debug mode");
  } catch (error) {
    log.error(error);
  }
}

function checkPkgVersion() {
  log.notice("version", pkg.version);
}

function checkNodeVersion() {
  // 获取当前 node 版本号
  const currentVersion = process.version;

  // 与自定义的最低版本号对比，gte方法：当参数1 > 参数2时返回 true。
  if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
    throw new Error(
      `您的 Node.js 版本不满足 febutler 运行所需的最低版本，请安装 v${currentVersion} 以上版本的 Node.js`.red
    );
  }

  // 显示当前 node 版本
  log.notice("node", process.version);
}

function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
}

function checkUserHome() {
  const userHome = process.env.HOME || process.env.USERPROFILE;
  if (!userHome || !pathExists(userHome)) {
    throw new Error("当前登录用户主目录不存在!".red);
  }
}

function checkInputArgs() {
  var argv = require("minimist")(process.argv.slice(2));

  // febutler --debug ==> args = [_: [], debug: true]

  if (argv.debug) {
    process.env.LOG_LEVEL = "verbose";
  }

  log.level = process.env.LOG_LEVEL;
}

module.exports = initCli;
