const sinon = require('sinon');
const axios = require('axios');
const chai = require('chai');
chai.use(require('chai-json-schema'));
const logschema = require('./data/logschema.json');
const app = require('./helpers/server');

const { expect } = chai;

chai.use(require('chai-json-schema'));

describe('middleware:', () => {
  let server;
  let sandbox;
  let logspy;
  let clock;

  beforeEach((done) => {
    sandbox = sinon.createSandbox();
    logspy = sandbox.spy(console, 'log');
    done();
  });
  afterEach((done) => {
    sandbox.restore();
    app.stop();
    done();
  });
  it('GET /internalcall {} 200', async () => {
    server = await app.start({
      type: 'json',
    });
    // const logger = requestlogger();
    await axios.get(`http://localhost:${server.address().port}/internalcall`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      correlationId: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/internalcall',
        method: 'GET',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http',
    });
  });
  it('GET /internalcall {} 200 silent', async () => {
    server = await app.start({
      type: 'silent',
    });
    await axios.get(`http://localhost:${server.address().port}/internalcall`);
    sinon.assert.calledOnceWithExactly(logspy, sinon.match(/Express server listening on port/));
  });
  it('GET /internalcall { logResponsePayload: true } 200', async () => {
    server = await app.start({ type: 'json', logResponsePayload: true });
    await axios.get(`http://localhost:${server.address().port}/internalcall`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      correlationId: sinon.match.any,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/internalcall',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.number,
        payload: '{"ok":"ok"}',
      },
      protocol: 'http',
    });
  });
  it('GET /internalcall?query=true { logRequestSearchParams: true } 200', async () => {
    server = await app.start({ type: 'json', logRequestSearchParams: true });
    await axios.get(`http://localhost:${server.address().port}/internalcall?query=true`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      correlationId: sinon.match.any,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/internalcall?query=true',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.number,
      },
      protocol: 'http',
    });
  });
  it('GET /internalcall?query=true { logRequestSearchParams: false } (default) 200', async () => {
    server = await app.start({ type: 'json', logRequestSearchParams: false });
    await axios.get(`http://localhost:${server.address().port}/internalcall?query=true`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      correlationId: sinon.match.any,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/internalcall',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.number,
      },
      protocol: 'http',
    });
  });
  it('GET /write { logResponsePayload: true } 200', async () => {
    server = await app.start({ type: 'json', logResponsePayload: true });
    await axios.get(`http://localhost:${server.address().port}/write`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      correlationId: sinon.match.any,
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/write',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.number,
        payload: 'writewritewrite',
      },
      protocol: 'http',
    });
  });
  it('GET /internalcall { alloptions } 200', async () => {
    server = await app.start({
      type: 'json',
      logResponsePayload: true,
      logRequestHeaders: true,
      logRequestPayload: true,
      logResponseHeaders: true,
    });
    await axios.get(`http://localhost:${server.address().port}/internalcall`);
    sinon.assert.calledWith(logspy, {
      timestamp: sinon.match.any,
      type: ['application'],
      level: 'INFO',
      correlationId: sinon.match.any,
      request: {
        headers: {
          accept: 'application/json, text/plain, */*',
          'user-agent': sinon.match(/axios\/*/gm),
          'accept-encoding': sinon.match.any,
          host: sinon.match(/localhost:[0-9]+/gm),
          connection: sinon.match.any,
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/internalcall',
        method: 'GET',
        payload: {},
      },
      response: {
        headers: {
          'x-powered-by': 'Express',
          'content-type': 'application/json; charset=utf-8',
          'content-length': '11',
          etag: sinon.match.any,
        },
        status: 200,
        duration: sinon.match.number,
        payload: '{"ok":"ok"}',
      },
      protocol: 'http',
    });
  });
  it('GET /internalcall { alloptions } 200 timing', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'json',
      logResponsePayload: true,
      logRequestHeaders: true,
      logRequestPayload: true,
      logResponseHeaders: true,
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    const result = {
      timestamp: new Date().toISOString(),
      type: ['application'],
      level: 'INFO',
      correlationId: 'dgpheadervalue',
      request: {
        headers: {
          accept: 'application/json, text/plain, */*',
          'dgp-correlation': 'dgpheadervalue',
          'user-agent': sinon.match(/axios\/*/gm),
          'accept-encoding': sinon.match.any,
          host,
          connection: sinon.match.any,
        },
        host,
        path: '/internalcall',
        method: 'GET',
        payload: {},
      },
      response: {
        headers: {
          'x-powered-by': 'Express',
          'content-type': 'application/json; charset=utf-8',
          'content-length': '11',
          etag: 'W/"b-2F/2BWc0KYbtLqL5U2Kv5B6uQUQ"',
        },
        status: 200,
        duration: 0,
        payload: '{"ok":"ok"}',
      },
      protocol: 'http',
    };
    expect(result).to.be.jsonSchema(logschema);
    sinon.assert.calledWith(logspy, result);
    clock.restore();
  });
  it('GET /internalcall { alloptions & headers } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'json',
      logResponsePayload: true,
      logRequestHeaders: ['dgp-correlation'],
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    const result = {
      timestamp: new Date().toISOString(),
      type: ['application'],
      level: 'INFO',
      correlationId: 'dgpheadervalue',
      request: {
        headers: {
          'dgp-correlation': 'dgpheadervalue',
        },
        host,
        path: '/internalcall',
        method: 'GET',
        payload: {},
      },
      response: {
        headers: { 'x-powered-by': 'Express' },
        status: 200,
        duration: 0,
        payload: '{"ok":"ok"}',
      },
      protocol: 'http',
    };
    expect(result).to.be.jsonSchema(logschema);
    sinon.assert.calledWith(logspy, result);
    clock.restore();
  });
  it('GET /internalcall { alloptions & headers & type } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestHeaders: ['dgp-correlation'],
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        correlationId: 'dgpheadervalue',
        request: {
          headers: { 'dgp-correlation': 'dgpheadervalue' },
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
  it('GET /internalcall { logRequestHeaders & correlationIdLocation } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
      correlationIdLocation: 'id',
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        correlationId: 'reqid',
        request: {
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
  it('GET /internalcall { logRequestHeaders & correlationIdfallback 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
      correlationIdfallback: '_no_correlation_',
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        correlationId: '_no_correlation_',
        request: {
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
  it('GET /internalcall { logRequestHeaders & correlationIdLocation(nested) & fallback } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
      correlationIdLocation: 'info.empty',
      correlationIdfallback: '_no_correlation_',
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        correlationId: '_no_correlation_',
        request: {
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
  it('GET /internalcall { logRequestHeaders & correlationIdLocation(nested) } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
      correlationIdLocation: 'info.id',
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        correlationId: 'reqinfoid',
        request: {
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
  it('GET /internalcall { logRequestHeaders & correlationIdLocation(nested.wrong) } 200', async () => {
    clock = sinon.useFakeTimers(Date.now());
    server = await app.start({
      type: 'text',
      logResponsePayload: true,
      logRequestPayload: true,
      logResponseHeaders: ['x-powered-by'],
      correlationIdLocation: 'this.path.is.wrong.id',
    });
    const host = `localhost:${server.address().port}`;
    await axios.get(
      `http://${host}/internalcall`,
      {
        headers: {
          'Dgp-Correlation': 'dgpheadervalue',
        },
      },
    );
    sinon.assert.calledWith(
      logspy,
      'INFO:',
      new Date().toISOString(),
      {
        request: {
          host,
          path: '/internalcall',
          method: 'GET',
          payload: {},
        },
        response: {
          headers: { 'x-powered-by': 'Express' },
          status: 200,
          duration: 0,
          payload: '{"ok":"ok"}',
        },
        protocol: 'http',
        type: ['application'],
      },
    );
    clock.restore();
  });
});
