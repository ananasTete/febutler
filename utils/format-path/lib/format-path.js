"use strict";

const path = require("path");

/**
 *   不同的操作系统有不同的路径分隔符,如 macos: /user/bin; win: D:\user\bin，
 * 而 win 中也兼容 / 形似，此方法统一将路径分隔符转为 mac 格式。
 * @param {string} p 路径字符串
 * @returns {string} 返回兼容不同操作系统路径分隔符的路径
 */
function formatPath(p) {
  if (!p || typeof p !== "string") return p;

  // path.sep 为当前操作系统路径使用的分隔符
  return path.sep === "/" ? "/" : p.replace(/\\/g, "/");
}

module.exports = formatPath;
