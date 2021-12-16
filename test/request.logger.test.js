const sinon = require('sinon');
const axios = require('axios');
const chai = require('chai');

const { requestlogger } = require('../lib');
const app = require('./helpers/server');

chai.use(require('chai-json-schema'));

describe('Requestlog:', () => {
  let server;
  let sandbox;

  beforeEach((done) => {
    sandbox = sinon.createSandbox();
    app.start().then((application) => {
      server = application;
      done();
    }).catch((e) => done(e));
  });
  afterEach((done) => {
    sandbox.restore();
    app.stop();
    done();
  });
  it('GET /externalcall {} 200', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    await axios.get(`http://localhost:${server.address().port}/externalcall`);
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: undefined,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'GET',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
    });
  });
  it('GET /externalcall {} error', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    try {
      await axios.get('http://localhost:1234/error');
    } catch (e) {
      sinon.assert.calledWith(logspy, {
        correlationId: undefined,
        request: {
          host: sinon.match(/localhost:[0-9]+/gm),
          path: '/error',
          method: 'GET',
        },
        response: {
          status: sinon.match.any,
          duration: sinon.match.number,
        },
        protocol: 'http:',
        type: ['application'],
      });
    }
  });
  it('GET https://www.google.com/notfound {}', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    try {
      await axios.get('https://www.google.com/notfound');
    } catch (e) {
      sinon.assert.calledWith(logspy, {
        type: ['application'],
        correlationId: undefined,
        request: {
          host: 'www.google.com',
          path: '/notfound',
          method: 'GET',
        },
        response: { status: 404, duration: sinon.match.number },
        protocol: 'https:',
      });
    }
  });
  it('GET https://superfakedomain.fakextention/externalcall ERROR', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    try {
      await axios.get('https://superfakedomain.fakextention/externalcall');
    } catch (e) {
      sinon.assert.calledWith(logspy, {
        type: ['application'],
        correlationId: undefined,
        request: {
          host: 'superfakedomain.fakextention',
          path: '/externalcall',
          method: 'GET',
        },
        response: { status: 'getaddrinfo ENOTFOUND superfakedomain.fakextention', duration: sinon.match.number },
        protocol: 'https:',
      });
    }
  });
  it('GET /externalcall { logResponsePayload: true } 200', async () => {
    const logger = requestlogger({ logResponsePayload: true });
    const logspy = sandbox.spy(logger, 'log');
    await axios.get(`http://localhost:${server.address().port}/externalcall`);
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: undefined,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'GET',
      },
      response: {
        payload: '{"ok":"ok"}',
        status: 200,
        duration: sinon.match.any,
      },
      protocol: 'http:',
    });
  });
  it('POST /externalcall {} 200', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: undefined,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'POST',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
    });
  });
  it('POST /externalcall default { logRequestPayload: true }', async () => {
    const logger = requestlogger({ logRequestPayload: true });
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: undefined,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        payload: '{"param":"paramval"}',
        method: 'POST',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
    });
  });
  it('POST /externalcall default { logRequestHeaders: true }', async () => {
    const logger = requestlogger({ logRequestHeaders: true });
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' }, {
      headers: {
        myheader: 'header',
      },
    });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: undefined,
      request: {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          myheader: 'header',
          'User-Agent': 'axios/0.24.0',
          'Content-Length': 20,
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'POST',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
    });
  });
  it('POST /externalcall dgp-correlation {}', async () => {
    const logger = requestlogger({});
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' }, {
      headers: {
        'dgp-correlation': 'correlationid',
      },
    });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: 'correlationid',
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'POST',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
    });
  });
  it('POST /externalcall dgp-correlation { alloptions }', async () => {
    const logger = requestlogger({
      logResponsePayload: true,
      logRequestHeaders: true,
      logRequestPayload: true,
      logResponseHeaders: true,
    });
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' }, {
      headers: {
        'dgp-correlation': 'correlationid',
      },
    });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: 'correlationid',
      request: {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'dgp-correlation': 'correlationid',
          'User-Agent': 'axios/0.24.0',
          'Content-Length': 20,
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        payload: '{"param":"paramval"}',
        method: 'POST',
      },
      response: {
        headers: {
          'x-powered-by': 'Express',
          'content-type': 'application/json; charset=utf-8',
          'content-length': '11',
          etag: sinon.match.any,
          date: sinon.match.any,
          connection: 'close',
        },
        payload: '{"ok":"ok"}',
        status: 200,
        duration: sinon.match.number,
      },
      protocol: 'http:',
    });
  });
  it('POST /externalcall dgp-correlation { alloptions }', async () => {
    const logger = requestlogger({
      logResponsePayload: true,
      logRequestHeaders: ['dgp-correlation'],
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
    });
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' }, {
      headers: {
        'dgp-correlation': 'correlationid',
      },
    });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: 'correlationid',
      request: {
        headers: {
          'dgp-correlation': 'correlationid',
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        payload: '{"param":"paramval"}',
        method: 'POST',
      },
      response: {
        headers: {
          'x-powered-by': 'Express',
        },
        payload: '{"ok":"ok"}',
        status: 200,
        duration: sinon.match.number,
      },
      protocol: 'http:',
    });
  });
});
