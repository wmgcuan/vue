/*!
 * Vue.js v1.0.0
 * (c) 2014-2018 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Vue = factory());
}(this, (function () { 'use strict';

function proxy(_data, vm) {
  Object.keys(_data).forEach(function (key) {
    Object.defineProperty(vm, key, {
      enumerable: false,
      configurable: true,
      get: function() {
        return vm._data[key]
      },
      set: function(newVal) {
        vm._data[key] = newVal;
      }
    });
  });
}

var Dep = function Dep() {
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.notify = function notify () {
  this.subs.forEach(function (sub) { return sub.update(); });
};

Dep.target = null;

var Observer = function Observer(data) {
  this.data = data;
  this.init();
};

Observer.prototype.init = function init () {
  this.walk();
};

Observer.prototype.walk = function walk () {
    var this$1 = this;

  Object.keys(this.data).forEach(function (key) {
    this$1.defineReactive(key, this$1.data[key]);
  });
};

Observer.prototype.defineReactive = function defineReactive (key, val) {
  var dep = new Dep();
  var observeChild = observe(val);
  Object.defineProperty(this.data, key, {
    enumerable: true,
    configurable: true,
    get: function get() {
      if (Dep.target) {
        dep.addSub(Dep.target);
      }
      return val
    },
    set: function set(newVal) {
      if (newVal === val) {
        return
      }
      val = newVal;
      dep.notify();
      observe(newVal);
    }
  });
};

function observe(value, vm) {
  if (!value || typeof value !== 'object') {
    return false
  }
  return new Observer(value)
}

var Watcher = function Watcher(vm, exp, cb) {
  this.vm = vm;
  this.exp = exp;
  this.cb = cb;
  this.value = this.get();
};

Watcher.prototype.get = function get () {
  Dep.target = this;
  var value = this.vm._data[this.exp.trim()];
  Dep.target = null;
  return value
};

Watcher.prototype.update = function update () {
  var newVal = this.vm._data[this.exp.trim()];
  if (this.value !== newVal) {
    this.value = newVal;
    this.cb.call(this.vm, newVal);
  }
};

var nodeType = {
  isElement: function isElement(node) {
    return node.nodeType === 1
  },
  isText: function isText(node) {
    return node.nodeType === 3
  }
};

var updater = {
  text: function text(node, val) {
    node.textContent = val;
  }
  // 还有 model 啥的，但实际都差不多
};

var Compile = function Compile(el, vm) {
  this.vm = vm;
  this.el = document.querySelector(el);
  this.fragment = null;
  this.init();
};

Compile.prototype.init = function init () {
  if (this.el) {
    this.fragment = this.nodeToFragment(this.el);
    this.compileElement(this.fragment);
    this.el.appendChild(this.fragment);
  }
};

Compile.prototype.nodeToFragment = function nodeToFragment (el) {
  var fragment = document.createDocumentFragment();
  var child = el.firstChild;

  // 将原生节点转移到 fragment
  while (child) {
    fragment.appendChild(child);
    child = el.firstChild;
  }
  return fragment
};

Compile.prototype.compileElement = function compileElement (el) {
    var this$1 = this;

  var childNodes = el.childNodes;[].slice.call(childNodes).forEach(function (node) {
    var reg = /\{\{(.*)\}\}/;
    var text = node.textContent;

    // 根据不同的 node 类型，进行编译，分别编译指令以及文本节点
    if (nodeType.isElement(node)) {
      this$1.compileEl(node);
    } else if (nodeType.isText(node) && reg.test(text)) {
      this$1.compileText(node, reg.exec(text)[1]);
    }

    // 递归的对元素节点进行深层编译
    if (node.childNodes && node.childNodes.length) {
      this$1.compileElement(node);
    }
  });
};

Compile.prototype.compileText = function compileText (node, exp) {
  var value = this.vm[exp.trim()];
  updater.text(node, value);
  new Watcher(this.vm, exp, function (val) {
    updater.text(node, val);
  });
};

Compile.prototype.compileEl = function compileEl (node) {
    var this$1 = this;

  var attrs = node.attributes;
  Object.values(attrs).forEach(function (attr) {
    var name = attr.name;
    if (name.indexOf('v-') >= 0) {
      var exp = attr.value;
      // 只做事件绑定
      var eventDir = name.substring(2);
      if (eventDir.indexOf('on') >= 0) {
        this$1.compileEvent(node, eventDir, exp);
      }
    }
  });
};

Compile.prototype.compileEvent = function compileEvent (node, dir, exp) {
  var eventType = dir.split(':')[1];
  var cb = this.vm.methods[exp];

  if (eventType && cb) {
    node.addEventListener(eventType, cb.bind(this.vm));
  }
};

function Vue(options) {
  this._data = options.data;
  this.methods = options.methods;
  this.mounted = options.mounted;
  this.el = options.el;

  this.init = function() {
    // 代理 data
    proxy(this._data, this);
    // 监听 data
    observe(this._data, this);
    var compile = new Compile(this.el, this);
    // 生命周期其实就是在完成一些操作后调用的函数,
    // 所以有些属性或者实例在一些 hook 里其实还没有初始化，
    // 也就拿不到相应的值
    this.callHook('mounted');
  };

  this.callHook = function(lifecycle) {
    this[lifecycle]();
  };

  this.init();
}

return Vue;

})));
