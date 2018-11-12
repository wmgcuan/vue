export default function proxy(_data, vm) {
  Object.keys(_data).forEach(key => {
    Object.defineProperty(vm, key, {
      enumerable: false,
      configurable: true,
      get: function() {
        return vm._data[key]
      },
      set: function(newVal) {
        vm._data[key] = newVal
      }
    })
  })
}
