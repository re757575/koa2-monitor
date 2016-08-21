const app = require('koa')()
const http = require('http')
const monitor = require('../index.js')
const server = http.createServer(app.callback())
app.use(monitor(server, {path: '/status'}))

app.use(function *() {
  if (this.path === '/') {
    this.body = 'Hello World';
  }
})

server.listen(6001)
