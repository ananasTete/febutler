"use strict";
const { LOWEST_NODE_VERSION } = require("./const");
const semver = require("semver");
const colors = require("colors");
const log = require("@febutler/log");
const { verifyDataType } = require("@febutler/utils");

class Command {
  constructor(argv) {
    if (!argv) throw new Error("class Command: Argv must be provided");
    if (!verifyDataType(argv, "Array"))
      throw new Error("class Command: Argv must be a Array");
    if (argv.length < 1)
      throw new Error("class Command: Argv must have one item at least");
    this._argv = argv;

    this.runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {
        this.checkNodeVersion();
      });
      chain = chain.then(() => {
        this.initArgs();
      });
      chain = chain.then(() => {
        this.init();
        // 为什么在这里调用 init 会先调用子类中的 init，没有再调用当前 Command 类中的 init ??
        // 子类会覆盖从父类中继承到的同名方法
      });
      chain = chain.then(() => {
        this.exec();
      });
      chain.catch((err) => {
        log.error(err);
      });

      // 如何改变 runner 这个期约实例的状态 ？？
    });
  }

  initArgs() {
    // 拆分 _argv ，_cmd 拿到最后一项即命令对象，_argv 去掉最后一项，即拿到所有的argument和option对象组成的数组
    this._options = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  checkNodeVersion() {
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

  init() {
    // 验证Command的子类是否实现了init方法，没实现却调用时会调用Command类中此方法抛出错误
    throw new Error("Subclasses of Command must implement the init method");
  }

  exec() {
    throw new Error("Subclasses of Command must implement the exec method");
  }
}
module.exports = Command;
