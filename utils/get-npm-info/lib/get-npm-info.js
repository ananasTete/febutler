"use strict";

const axios = require("axios");
const urlJoin = require("url-join");
const semver = require("semver");

// 通过 Npm API 获取指定包的信息
function getNpmInfo(npmName, registry) {
  if (!npmName) return null;
  registry = registry || getDefaultRegistry();

  // url 拼接
  const url = urlJoin(registry, npmName);

  // 发送请求
  return axios
    .get(url)
    .then((res) => {
      if (res.status === 200) return res.data;
      return null;
    })
    .catch((err) => {
      return Promise.reject(err);
    });
}

function getDefaultRegistry(isOriginal = false) {
  // 原生 npm API 地址和对应的淘宝源的地址
  return isOriginal
    ? "https://registry.npmjs.org/"
    : "https://registry.npmmirror.com/";
}

// 获取指定包的所有版本
async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}

// 获取指定包的最新版本
async function getLastVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  versions.sort((a, b) => semver.gt(b, a));
  return versions[0];
}

module.exports = { getNpmInfo, getNpmVersions, getLastVersion };
