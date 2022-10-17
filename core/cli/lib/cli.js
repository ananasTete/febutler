"use strict";

const path = require("path");
const semver = require("semver");
const colors = require("colors");
const pathExists = require("path-exists").sync;
const commander = require("commander");

const log = require("@febutler/log");
const { getLatestVersion } = require("@febutler/get-npm-info");
const init = require("@febutler/init");
const exec = require("@febutler/exec");

const pkg = require("../package.json");
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require("./const");
const userHome = process.env.HOME || process.env.USERPROFILE;

const program = new commander.Command();

async function initCli() {
  try {
    await prepare();
    registryCommands();
    exec();
  } catch (error) {
    log.error(error);
  }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
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
  if (!userHome || !pathExists(userHome)) {
    throw new Error("当前登录用户主目录不存在!".red);
  }
  log.notice("userHome", userHome);
}

function checkEnv() {
  const { config } = require("dotenv");
  const envPath = path.resolve(userHome, ".env");
  if (pathExists(envPath)) {
    config({ path: envPath });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  if (process.env.CLI_HOME) {
    process.env.CLI_HOME_PATH = path.join(userHome, process.env.CLI_HOME);
  } else {
    process.env.CLI_HOME_PATH = path.join(userHome, DEFAULT_CLI_HOME);
  }
}

async function checkGlobalUpdate() {
  // 1. 获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;

  // 2. 获取最新的版本号
  const lastVersion = await getLatestVersion("@febutler/cli");

  // 3. 做对比，如果当前版本不是最新版本则提示更新
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      `发现新的版本！当前版本 ${currentVersion}， 最新版本 ${lastVersion}`
        .yellow
    );
  }
}

function registryCommands() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .option("-d, --debug", "is open debug mode ?", false)
    .option(
      "-tp, --targetPath [targetPath]",
      "Specify the local debug file path",
      ""
    );

  program
    .command("init <projectName>")
    .description("init the project named <projectName>")
    .option(
      "-f, --force",
      "Force initialization even if a directory named <projectName> exists"
    )
    .action(exec);

  program.on("option:debug", function () {
    console.log("--------------------------------".green);
    console.log(`**   Starting in Debug Mode   **`.green);
    console.log("--------------------------------".green);
    if (this.opts().debug) {
      process.env.LOG_LEVEL = "verbose";
      log.level = "verbose";
    }
  });

  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = this.opts().targetPath;
  });

  // 定义未注册命令的处理
  program.on("command:*", function (args) {
    console.log(`unknown command: ${args[0]}`.red);
    console.log();
    this.outputHelp();
  });

  // 不输入任何命令或选项时，显示帮助信息
  if (process.argv.length < 3) program.help();

  program.parse(process.argv);
}

module.exports = initCli;
