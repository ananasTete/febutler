"use strict";

module.exports = init;

function init(projectName, args) {
  console.log(projectName, args, this, this.opts());
}
