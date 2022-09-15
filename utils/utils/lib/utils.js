"use strict";

module.exports = { getDataType, checkDataType };

/**
 * @param {String} value 需要检测数据类型的值
 * @return {String} 目标值的数据类型，如 'String', 'Number', 'Boolean'
 */
function getDataType(value) {
  const type = Object.prototype.toString.call(value);
  return type.replace("[object ", "").split("]")[0];
}

/**
 * @param {any} value 需要检测数据类型的值
 * @param {String} type 目标数据类型，如 'String', 'Number', 'Boolean'
 * @return {Boolean} 返回目标值是否为目标数据类型
 */
function checkDataType(value, type) {
  return Object.prototype.toString.call(value).includes(type);
}
