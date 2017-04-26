const app = require('koa')()
const monitor = require('../index.js')
app.use(monitor(server, {path: '/status', port: 3000}))

app.use(function *() {
  if (this.path === '/') {
    this.body = 'Hello World'
  }
})
