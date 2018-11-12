const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const replace = require('rollup-plugin-replace')
const flow = require('rollup-plugin-flow-no-whitespace')
const version = process.env.VERSION || require('../package.json').version
const weexVersion = '1.0.0'

const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}

const opts = {
  entry: resolve('core/instance/index.js'),
  dest: resolve('dist/vue.js'),
  format: 'umd',
  env: 'production',
  alias: { he: './entity-decoder' },
  banner:
    '/*!\n' +
    ' * Vue.js v' +
    version +
    '\n' +
    ' * (c) 2014-' +
    new Date().getFullYear() +
    ' Evan You\n' +
    ' * Released under the MIT License.\n' +
    ' */'
}

const configs = [
  {
    input: opts.entry,
    external: opts.external,
    plugins: [
      replace({
        __WEEX__: !!opts.weex,
        __WEEX_VERSION__: weexVersion,
        __VERSION__: version
      }),
      flow(),
      buble(),
      alias(Object.assign({}, aliases, opts.alias))
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || 'Vue'
    }
  }
]

build(configs)

function build(builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    buildEntry(builds[built])
      .then(() => {
        built++
        if (built < total) {
          next()
        }
      })
      .catch(function logError(e) {
        console.log(e)
      })
  }

  next()
}
function buildEntry(config) {
  const output = config.output
  const { file } = output

  return rollup
    .rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ code }) => {
      return write(file, code)
    })
}
function write(dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report(extra) {
      console.log(
        blue(path.relative(process.cwd(), dest)) +
          ' ' +
          getSize(code) +
          (extra || '')
      )
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}
function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}
function blue(str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
