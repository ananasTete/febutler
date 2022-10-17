"use strict";

module.exports = { verifyDataType, getDataType };

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
