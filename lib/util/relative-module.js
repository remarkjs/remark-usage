const prefix = './'

export function relativeModule(moduleId) {
  return moduleId.slice(0, 2) === prefix ? moduleId : prefix + moduleId
}
