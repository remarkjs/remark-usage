'use strict'

var prefix = './'

module.exports = relativeModule

function relativeModule(moduleId) {
  return moduleId.slice(0, 2) === prefix ? moduleId : prefix + moduleId
}
