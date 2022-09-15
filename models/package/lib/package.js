"use strict";

const { checkDataType } = require("@febutler/utils");

class Package {
  /**
   * @param {Object} options
   * @param {String} options.targetPath package的路径
   * @param {String} options.storePath package的存储路径
   * @param {String} options.name package的名称
   * @param {String} options.version package的版本
   */
  constructor(options) {
    if (!checkDataType(options, "Object")) {
      throw new TypeError(
        "参数类型错误! 类 package 的参数 options 为 Object 类型".red
      );
    }
    const { targetPath, storePath, name, version } = options;
    this.targetPath = targetPath;
    this.storePath = storePath;
    this.packageName = name;
    this.packageVersion = version;
  }
}

module.exports = Package;
