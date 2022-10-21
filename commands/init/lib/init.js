"use strict";

const Command = require("@febutler/command");
const log = require("@febutler/log");

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ""; // 拿到项目名称
    this.forceExits = !!this._options.force; // 查看参数中是否传入了 --force
    log.verbose("project name: " + this.projectName);
    log.verbose("force exit: " + this.forceExits);
  }
  exec() {}
}

function init(argv) {
  log.verbose("init command argv: " + argv);
  console.log("argv", argv);
  return new InitCommand(argv);
  // 为什么新建子类实例时传入的参数可以被父类直接拿到，不用像java一样在子类中传入父类的 constructor ??
  // 在新建子类实例时父类的 constructor 相当于在子类中 constructor 之前执行一遍，作用域是子类，所以可以拿到
}

module.exports = init;
