"use strict";

const npmlog = require("npmlog");

npmlog.addLevel("sucess", 2000, { fg: "green", bg: "yellow", bold: true });

npmlog.heading = "febutler";
npmlog.headingStyle = { fg: "cyan" };

npmlog.level = process.env.LOG_LEVEL || "info";

module.exports = npmlog;
