# koa2-monitor

Simple, self-hosted module based on Socket.io and Chart.js to report realtime server metrics for koa@2.js-based node servers.

![Monitoring Page](http://i.imgur.com/AHizEWq.gif "Monitoring Page")

## Installation & setup 
1. Run `npm install koa2-monitor --save`
2. Before any other middleware add following line:
```javascript
const monitor = require('koa-monitor')
// then after
app.use(monitor({path: '/status', port: 3003}))
```
3. Run server and go to `/status`

## Options

Monitor can be configured by passing options(second argument) object into `monitor` constructor.

Default config:
```
path: '/status',
port: 3003,
spans: [{
  interval: 1,     // Every second
  retention: 60    // Keep 60 datapoints in memory
}, {
  interval: 5,     // Every 5 seconds
  retention: 60
}, {
  interval: 15,    // Every 15 seconds
  retention: 60
}]

```

For an example koa server, check out `sample/server.js'

## License

[MIT License](https://opensource.org/licenses/MIT) © Daniel V.

Forked from [koa-monitor](https://github.com/capaj/koa-monitor)
