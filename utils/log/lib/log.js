"use strict";

const npmlog = require("npmlog");

npmlog.addLevel("success", 2000, { fg: "green", bold: true });

npmlog.heading = "febutler";
npmlog.headingStyle = { fg: "cyan" };

npmlog.level = process.env.LOG_LEVEL || "info";

module.exports = npmlog;
