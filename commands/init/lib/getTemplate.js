const request = require("@febutler/request");

function getTemplateList() {
  return request({
    method: "GET",
    url: "template"
  })
}

module.exports = getTemplateList;