"use strict";

const path = require("path");
const Package = require("@febutler/package");
const log = require("@febutler/log");
const SETTINGS = require("./const");
const { on } = require("events");
const { spawnExec } = require("@febutler/utils");

async function exec() {
  const homePath = process.env.CLI_HOME_PATH;
  let targetPath = process.env.CLI_TARGET_PATH;
  let storeDir = "";
  let pkg;

  // 获取当前命令的名称，如执行 febutler init xxx 时，调用 name() 方法返回 init
  const cmdName = this.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "0.0.6"; // 如何指定版本？？

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

    if (await pkg.exists()) {
      // 更新 package
      console.log("更新");
      await pkg.update();
    } else {
      // 安装 package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }

  throw new Error("结束");

  const rootFilePath = pkg.getRootFilePath();
  if (rootFilePath) {
    try {
      /** 可以通过两种方法运行 package */

      // 在当前进程运行
      const result = "D:/MyProject/febutler/commands/init/lib/init.js";
      // require(rootFilePath).apply(null, Array.from(arguments));
      // require(result).call(null, Array.from(arguments));
      // 当前exec函数是init命令对象的action方法的回调，在当前exec方法中访问this，即为init命令对象；
      // 当前exec方法的参数为该命令注册的所有 arguments 的值，倒数第二个参数为一个对象，值为所有注册的option 的键值对，最后一个参数为当前命令对象，即this

      // 我自己的想法,为什么不这样做呢？？
      // const child = cpSpawn("node", Array.from(arguments), {
      //   cwd: result,
      //   stdio: "inherit",
      // });

      // 开启一个子进程运行

      // 1. 去除 arguments 中的命令对象（自己的）
      const args = Array.from(arguments);
      args.splice(args.length - 1);

      // 1. 去除arguments中最后一个参数--命令对象中的不必要的参数（老师的）
      // const args = Array.from(arguments);
      // const cmd = args[args.length - 1];
      // const o = Object.create(null);
      // Object.keys(cmd).forEach((key) => {
      //   if (
      //     cmd.hasOwnProperty(key) && // hasOwnProperty: 当前对象上的属性，而不是原型链上继承来的属性
      //     !key.startsWith("_") &&
      //     key != "parent"
      //   ) {
      //     o[key] = cmd[key];
      //   }
      // });
      // args[args.length - 1] = o;

      // 如果不从 args 中去除命令对象，也可以进入到目标文件中执行，但终端会显示系统找不到指定文件，也不会执行其导出的方法

      const code = `require('${result}').call(null, ${JSON.stringify(args)})`;
      const child = spawnExec("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error("command fail " + e);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("command exited " + e);
      });
    } catch (error) {
      log.error(error);
    }
  }
}

module.exports = exec;
