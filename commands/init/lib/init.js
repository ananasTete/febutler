"use strict";

module.exports = init;

function init(projectName, args) {
  // console.log(projectName, args, this, this.opts());
  console.log(projectName, process.env.CLI_TARGET_PATH);
}
