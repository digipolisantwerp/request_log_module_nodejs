const express = require('express');
const { requestMiddleware } = require('../../lib');

let server;
let app;

function initializeExpress(config) {
  app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.id = 'reqid';
    req.info = { id: 'reqinfoid' };
    return next();
  });
  app.get('/externalcall', (req, res) => res.json({ ok: 'ok' }));
  app.post('/externalcall', (req, res) => res.json({ ok: 'ok' }));
  app.use(requestMiddleware(config));

  app.get('/internalcall', (req, res) => res.json({ ok: 'ok' }));
  app.get('/write', (req, res) => {
    res.write('write');
    res.write('write');
    res.write('write');
    res.end();
  });

  app.use((err, req, res, next) => {
    console.log('err', err);
    return next(err);
  });
  app.enable('trust proxy');
}

function startListening() {
  return new Promise((resolve) => {
    server = app.listen(undefined, () => {
      console.log(`Express server listening on port ${server.address().port}`);
      return resolve(server);
    });
  });
}

async function start(config) {
  try {
    initializeExpress(config);
    const startedapp = await startListening();
    return startedapp;
  } catch (err) {
    console.log(`Error occured ${err}`);
    return process.exit(1);
  }
}

function stop() {
  server.close();
}

module.exports = {
  start,
  stop,
};
