import proxy from '../observer/proxy'
import observe from '../observer/observer'
import Compile from '../observer/compile'

function Vue(options) {
  this._data = options.data
  this.methods = options.methods
  this.mounted = options.mounted
  this.el = options.el

  this.init = function() {
    // 代理 data
    proxy(this._data, this)
    // 监听 data
    observe(this._data, this)
    const compile = new Compile(this.el, this)
    // 生命周期其实就是在完成一些操作后调用的函数,
    // 所以有些属性或者实例在一些 hook 里其实还没有初始化，
    // 也就拿不到相应的值
    this.callHook('mounted')
  }

  this.callHook = function(lifecycle) {
    this[lifecycle]()
  }

  this.init()
}

export default Vue
