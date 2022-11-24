"use strict";
const { spawn: cpSpawn } = require("child_process");

/**
 * @param {*} data
 * @param {string} type 如 'String' 或 'string'
 * @returns {boolean} 返回 data 是否为 type 类型的布尔值
 */
function verifyDataType(data, type) {
  // 首字符转为大写（全部转为小写，再把第一个转为大写）
  type = type.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());

  const result = Object.prototype.toString.call(data); // 会得到形如 "[object, String]"的字符串
  return result.includes(type);
}

/**
 *
 * @param {*} data
 * @returns {string} 返回 data 的数据类型，如 'Number', 'String'
 */
function getDataType(data) {
  const result = Object.prototype.toString.call(data);
  return result.split(" ")[1].replace("]", "");
}

function spinnerStart(msg = "Loading", spinnerString = "|/-\\") {
  const Spinner = require("cli-spinner").Spinner;

  const spinner = new Spinner(`${msg}.... %s`);
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}

// 封装方法处理windows和macos与linux之间使用 spawn 执行 node模块上的差别
function spawnExec(command, args, options) {
  const win32 = process.platform === "win32";

  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;

  // windows: spawn('cmd', ['/c', 'node', '-e', code], options])
  // macos/linux: spawn('node', ['-e', code], options])
  return cpSpawn(cmd, cmdArgs, options || {});
}

function spawnExecAsync(cmd, args, options) {
  return new Promise(function (resolve, reject) {
    const p = spawnExec(cmd, args, options);
    p.on("error", (e) => {
      reject(e);
    });
    p.on("exit", (c) => {
      resolve(c);
    });
  });
}

module.exports = {
  verifyDataType,
  getDataType,
  spinnerStart,
  spawnExec,
  spawnExecAsync,
};
