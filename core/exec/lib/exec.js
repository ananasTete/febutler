"use strict";

const path = require("path");
const Package = require("@febutler/package");
const log = require("@febutler/log");
const SETTINGS = require("./const");

async function exec() {
  const homePath = process.env.CLI_HOME_PATH;
  let targetPath = process.env.CLI_TARGET_PATH;
  let storeDir = "";
  let pkg = null;

  // 获取当前命令的名称，如执行 febutler init xxx 时，调用 name() 方法返回 init
  const cmdName = this.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "0.22.0"; // 如何指定版本？？

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, "dependencies");
    storeDir = path.resolve(targetPath, "node_modules");

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });

    log.verbose("----- debug: exec 方法 -----");
    log.verbose("homePath", homePath);
    log.verbose("targetPath", targetPath);
    log.verbose("storeDir", storeDir);
    log.verbose("packageName", packageName);
    log.verbose("packageVersion", packageVersion);
    log.verbose("---------------------------");

    if (await pkg.exists()) {
      // 更新 package
      await pkg.update();
    } else {
      // 安装 package
      await pkg.install().catch((err) => console.log(err));
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  const rootFilePath = pkg.getRootFilePath();
  console.log(rootFilePath);
  if (rootFilePath) require(rootFilePath).apply(this, arguments);
}

module.exports = exec;
