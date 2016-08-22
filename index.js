'use strict'

const fs = require('mz/fs')
const path = require('path')
const os = require('os')
const send = require('koa-send')
const pidusage = require('pidusage')
const handlebars = require('handlebars')
let io
let appName
try {
  appName = require('../../package.json').name
} catch (err) {}

const defaultConfig = {
  path: '/status',
  title: appName,
  spans: [{
    interval: 1,
    retention: 60
  }, {
    interval: 5,
    retention: 60
  }, {
    interval: 15,
    retention: 60
  }]
}

const last = function (arr) {
  return arr[arr.length - 1]
}

const gatherOsMetrics = (io, span) => {
  const defaultResponse = {
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    count: 0,
    mean: 0,
    timestamp: Date.now()
  }

  const sendMetrics = (span) => {
    io.emit('stats', {
      os: span.os[span.os.length - 2],
      responses: span.responses[span.responses.length - 2],
      interval: span.interval,
      retention: span.retention
    })
  }

  pidusage.stat(process.pid, (err, stat) => {
    stat.memory = stat.memory / 1024 / 1024 // Convert from B to MB
    stat.load = os.loadavg()
    stat.timestamp = Date.now()

    span.os.push(stat)
    if (!span.responses[0] || last(span.responses).timestamp + (span.interval * 1000) < Date.now()) span.responses.push(defaultResponse)

    if (span.os.length >= span.retention) span.os.shift()
    if (span.responses[0] && span.responses.length > span.retention) span.responses.shift()

    sendMetrics(span)
  })
}

const middlewareWrapper = (app, config) => {
  io = require('socket.io')(app)
  Object.assign(defaultConfig, config)
  config = defaultConfig
  const statusHtmlPage = config.statusHtmlPage || 'node_modules/koa-monitor/index.html'
  const indexHtml = fs.readFileSync(statusHtmlPage, {'encoding': 'utf8'})
  const template = handlebars.compile(indexHtml)

  io.on('connection', (socket) => {
    socket.emit('start', config.spans)
    socket.on('change', function () {
      socket.emit('start', config.spans)
    })
  })

  config.spans.forEach((span) => {
    span.os = []
    span.responses = []
    setInterval(() => gatherOsMetrics(io, span), span.interval * 1000)
  })
  // console.log(config)

  return function*(next) {
    const startTime = process.hrtime()

    if (this.path === config.path) {
      this.body = template(config)
    } else if (this.url === `${config.path}/koa-monitor-frontend.js`) {
      yield send(this, 'node_modules/koa-monitor/koa-monitor-frontend.js')
    } else {
      yield next

      const diff = process.hrtime(startTime)
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6
      const category = Math.floor(this.statusCode / 100)

      config.spans.forEach((span) => {
        const lastResponse = last(span.responses)
        if (lastResponse && lastResponse.timestamp / 1000 + span.interval > Date.now() / 1000) {
          lastResponse[category]++
          lastResponse.count++
          lastResponse.mean = lastResponse.mean + ((responseTime - lastResponse.mean) / lastResponse.count)
        } else {
          span.responses.push({
            '2': category === 2 ? 1 : 0,
            '3': category === 3 ? 1 : 0,
            '4': category === 4 ? 1 : 0,
            '5': category === 5 ? 1 : 0,
            count: 1,
            mean: responseTime,
            timestamp: Date.now()
          })
        }
      })
    }
  }
}

module.exports = middlewareWrapper
