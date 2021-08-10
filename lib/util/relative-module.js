const prefix = './'

/**
 * @param {string} moduleId
 * @returns {string}
 */
export function relativeModule(moduleId) {
  return moduleId.slice(0, 2) === prefix ? moduleId : prefix + moduleId
}
