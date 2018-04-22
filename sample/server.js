const Koa = require('koa');
const monitor = require('../index.js');
const app = new Koa();

app.use(monitor({ path: '/status', port: 3003 }));

app.use(ctx => {
  if (ctx.path === '/') {
    ctx.body = 'Hello Koa';
  }
});

app.listen(3000);
