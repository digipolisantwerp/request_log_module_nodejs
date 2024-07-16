const express = require('express');
const axios = require('axios');

const { requestMiddleware, requestlogger } = require('../lib');

let server;
let app;

requestlogger({
  type: 'json',
  logRequestSearchParams: true,
});

function initializeExpress() {
  app = express();
  app.use(express.json());
  app.use(requestMiddleware({
    type: 'json',
    logRequestSearchParams: true,
  }));
  app.get('/internalcall', (req, res) => res.json({ ok: 'ok' }));
  app.post('/internalcall', (req, res) => res.json({ ok: 'ok' }));
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
    server = app.listen(2000, () => {
      console.log(`Express server listening on port ${server.address().port}`);
      return resolve(server);
    });
  });
}

async function start() {
  try {
    initializeExpress();
    const startedapp = await startListening();
    await axios.get('http://localhost:2000?page=1').catch(() => {});
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

start();
