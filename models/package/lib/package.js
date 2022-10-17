"use strict";

const path = require("path");
const pkgDir = require("pkg-dir").sync;
const pathExists = require("path-exists").sync;
const fsExtra = require("fs-extra");
const npmInstall = require("npmInstall");
const formatPath = require("@febutler/format-path");
const { verifyDataType, getDataType } = require("@febutler/utils");
const { getLatestVersion } = require("@febutler/get-npm-info");

class Package {
  /**
   * @param {Object} options 参数对象
   * @param {string} options.targetPath package的路径
   * @param {string} options.storeDir package的缓存路径
   * @param {string} options.packageName package的name
   * @param {string} options.packageVersion package的version
   */
  constructor(options) {
    if (!options || !verifyDataType(options, "Object")) {
      throw new TypeError(
        `类 Package 的参数 options: expected Object, get ${getDataType(
          options
        )}`.red
      );
    }
    this.targetPath = options.targetPath;
    this.storeDir = options.storeDir;
    this.packageName = options.packageName;
    this.packageVersion = options.packageVersion;
    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      // 根据路径创建目录
      fsExtra.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getLatestVersion(this.packageName);
    }
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  getSpecificFilePath(version) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    );
  }

  // 判断当前 package 是否存在
  async exists() {
    if (this.storeDir) {
      // 使用了缓存路径
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath); // 为什么判断package的依据是 dependencies 是否存在？
    }
  }

  // 安装 package
  async install() {
    await this.prepare();
    return npmInstall({
      root: this.targetPath,
      registry: "https://registry.npmmirror.com/",
      storeDir: this.storeDir,
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }

  // 更新 package
  async update() {
    await this.prepare();
    const latestVersion = await getLatestVersion(this.packageName);
    const latestVersionFilePath = this.getSpecificFilePath(latestVersion);
    if (!pathExists(latestVersionFilePath)) {
      await npmInstall({
        root: this.targetPath,
        registry: "https://registry.npmmirror.com/",
        storeDir: this.storeDir,
        pkgs: [{ name: this.packageName, version: latestVersion }],
      });
      this.packageVersion = latestVersion;
    }
  }

  // 获取 package 入口文件的路径
  getRootFilePath() {
    const p = this.storeDir ? this.cacheFilePath : this.targetPath;

    // 1. 获取 package.json 所在目录（使用 pkg-dir 包）
    const pkgPath = pkgDir(p);
    if (!pkgPath) return null;

    // 2. 读取 package.json ，使用 require()
    const pkg = require(path.resolve(pkgPath, "package.json"));
    if (!pkg || (!pkg.main && !pkg.lib)) return null;

    // 3. 从 package.json 中读取 main/bin 指向的路径，即为入口文件
    const rootPath = pkg.main || pkg.lib;

    // 4. 路径的兼容处理
    return formatPath(path.resolve(pkgPath, rootPath));
  }
}

module.exports = Package;
