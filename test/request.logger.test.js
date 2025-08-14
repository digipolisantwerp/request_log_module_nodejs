const assert = require('node:assert/strict');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const sinon = require('sinon');
const axios = require('axios');

const { requestlogger } = require('../lib');
const app = require('./helpers/server');
const fetchTest = parseInt( process.version.split('.')[0].split('v')[1], 10) >= 20;

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
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'GET',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
      type: ['application'],
    });
  });
  it('GET /externalcall {} fetch 200', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    if(fetchTest) {
      await global.fetch(
        `http://localhost:${server.address().port}/externalcall`,
        {
          headers: {
            testheader: "testvalue"
          }
        }
      );
      return new Promise((resolve) => {
        setTimeout(() => {
          sinon.assert.calledWith(logspy, {
            request: {
              host: sinon.match(/localhost:[0-9]+/gm),
              path: '/externalcall',
              method: 'GET',
            },
            response: { status: 200, duration: sinon.match.number },
            protocol: 'http:',
            type: ['application'],
          });
          resolve()
        }, 1);
      });
    }
  })
  it('GET /externalcall {} fetch 200 json', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    if(fetchTest) {
      const request = await global.fetch(
        `http://localhost:${server.address().port}/externalcall`,
        {
          headers: {
            testheader: "testvalue"
          }
        }
      );
      const body = await request.json();
      assert.deepStrictEqual(body, { ok: 'ok' })
      return new Promise((resolve) => {
        setTimeout(() => {
          sinon.assert.calledWith(logspy, {
            request: {
              host: sinon.match(/localhost:[0-9]+/gm),
              path: '/externalcall',
              method: 'GET',
            },
            response: { status: 200, duration: sinon.match.number },
            protocol: 'http:',
            type: ['application'],
          });
          resolve()
        }, 1);
      });
    }
  })
  it('GET /externalcall {} fetch 200 text', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    if(fetchTest) {
      const request = await global.fetch(
        `http://localhost:${server.address().port}/externalcall`,
        {
          headers: {
            testheader: "testvalue"
          }
        }
      );
      const body = await request.text();
      assert.deepStrictEqual(body, '{"ok":"ok"}')
      return new Promise((resolve) => {
        setTimeout(() => {
          sinon.assert.calledWith(logspy, {
            request: {
              host: sinon.match(/localhost:[0-9]+/gm),
              path: '/externalcall',
              method: 'GET',
            },
            response: { status: 200, duration: sinon.match.number },
            protocol: 'http:',
            type: ['application'],
          });
          resolve()
        }, 1);
      });
    }
  })
  it('no callback return res', async () => {
    const options = {
      hostname: 'google.com',
      port: 443,
      path: '/',
      method: 'GET',
    };
    const req = https.request(options);
    req.end();
    assert.deepStrictEqual(req.constructor.name, 'ClientRequest')
  });
  it('url of type URL', async () => {
    const options = {
      port: 443,
      path: '/',
      method: 'GET',
    };
    const req = https.request(new URL('https://google.be'), options);
    req.end();
    assert.deepStrictEqual(req.constructor.name, 'ClientRequest')
  });
  it('url of type URL localhost', async () => {
    delete require.cache[require.resolve('http')];

    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    async function get(url) {
      return new Promise((resolve, reject) => {
        http.get(url, (res) => {
          res.on('data', () => {
          });
          res.on('end', () => {
            console.log('Response ended: ');
            resolve('ok');
          });
        }).on('error', (err) => {
          console.log('Error: ', err.message);
          reject(err);
        });
      });
    }
    await get(new URL(`http://localhost:${server.address().port}/externalcall`));
    sinon.assert.calledWith(logspy, {
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
      type: ['application'],
    });
  });
  it('url of type string', async () => {
    delete require.cache[require.resolve('http')];

    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    async function get(url, options) {
      return new Promise((resolve, reject) => {
        http.get(url, options, (res) => {
          res.on('data', () => {
          });
          res.on('end', () => {
            console.log('Response ended: ');
            resolve('ok');
          });
        }).on('error', (err) => {
          console.log('Error: ', err.message);
          reject(err);
        });
      });
    }
    await get(`http://localhost:${server.address().port}/externalcall`, {}, () => {});
    sinon.assert.calledWith(logspy, {
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
      type: ['application'],
    });
  });
  it('url of type string with query should not log query by default', async () => {
    delete require.cache[require.resolve('http')];

    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    async function get(url, options) {
      return new Promise((resolve, reject) => {
        http.get(url, options, (res) => {
          res.on('data', () => {
          });
          res.on('end', () => {
            console.log('Response ended: ');
            resolve('ok');
          });
        }).on('error', (err) => {
          console.log('Error: ', err.message);
          reject(err);
        });
      });
    }
    await get(`http://localhost:${server.address().port}/externalcall?page=1`, {}, () => {});
    sinon.assert.calledWith(logspy, {
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
      },
      response: { status: 200, duration: sinon.match.number },
      protocol: 'http:',
      type: ['application'],
    });
  });
  it('GET /externalcall?page=1 {} should not log query 200', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    await axios.get(`http://localhost:${server.address().port}/externalcall?page=1`);
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.any,
      },
      protocol: 'http:',
    });
  });
  it('GET /externalcall { logRequestSearchParams: true } should log query 200', async () => {
    const logger = requestlogger({ logRequestSearchParams: true });
    const logspy = sandbox.spy(logger, 'log');
    await axios.get(`http://localhost:${server.address().port}/externalcall?page=1`);
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall?page=1',
        method: 'GET',
      },
      response: {
        status: 200,
        duration: sinon.match.any,
      },
      protocol: 'http:',
    });
  });

  it('url of type string error', async () => {
    delete require.cache[require.resolve('http')];

    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    async function get(url, options) {
      return new Promise((resolve, reject) => {
        http.get(url, options, (res) => {
          res.on('data', () => {
          });
          res.on('end', () => {
            console.log('Response ended: ');
            resolve('ok');
          });
        }).on('error', (err) => {
          console.log('Error: ', err.message);
          reject(err);
        });
      });
    }
    try {
      await get(`http://localhost:${server.address().port}/externalcall`, {}, () => {});
    } catch (e) {
      console.log('e', e);
    }
    sinon.assert.calledWith(logspy, {
      request: {
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
      },
      response: {
        status: sinon.match.any,
        duration: sinon.match.number,
      },
      protocol: 'http:',
      type: ['application'],
    });
  });
  it('GET /externalcall {} error', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    try {
      await axios.get('http://localhost:1234/error');
    } catch {
      sinon.assert.calledWith(logspy, {
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
    } catch {
      sinon.assert.calledWith(logspy, {
        type: ['application'],
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
    } catch {
      sinon.assert.calledWith(logspy, {
        type: ['application'],
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
  it('GET /externalcall fetch { logResponsePayload: true } 200', async () => {
    const logger = requestlogger({ logResponsePayload: true });
    const logspy = sandbox.spy(logger, 'log');
    if(fetchTest) {
      const response = await global.fetch(`http://localhost:${server.address().port}/externalcall`);
      await response.json();
      return sinon.assert.calledWith(logspy, {
        type: ['application'],
        request: {
          host: sinon.match(/localhost:[0-9]+/gm),
          path: '/externalcall',
          method: 'GET',
        },
        response: {
          payload: {"ok":"ok"},
          status: 200,
          duration: sinon.match.any,
        },
        protocol: 'http:',
      });
    }
  });
  it('GET /externalcall fetch text { logResponsePayload: true } 200', async () => {
    const logger = requestlogger({ logResponsePayload: true });
    const logspy = sandbox.spy(logger, 'log');
    if(fetchTest) {
      const response = await global.fetch(`http://localhost:${server.address().port}/externalcall`);
      await response.text();
      return sinon.assert.calledWith(logspy, {
        type: ['application'],
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
    }
  });
  it('POST /externalcall {} 200', async () => {
    const logger = requestlogger();
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
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
      request: {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          myheader: 'header',
          'Accept-Encoding': sinon.match.any,
          'User-Agent': sinon.match(/axios\/*/gm),
          'Content-Length': sinon.match.any,
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
  it('POST /externalcall dgp-correlation { _no_correlation_ fallback }', async () => {
    const logger = requestlogger({
      logResponsePayload: true,
      logRequestHeaders: true,
      logRequestPayload: true,
      logResponseHeaders: true,
      correlationIdfallback: '_no_correlation_',
    });
    const logspy = sandbox.spy(logger, 'log');
    await axios.post(`http://localhost:${server.address().port}/externalcall`, { param: 'paramval' }, {
      headers: {
      },
    });
    sinon.assert.calledWith(logspy, {
      type: ['application'],
      correlationId: '_no_correlation_',
      request: {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Accept-Encoding': sinon.match.any,
          'User-Agent': sinon.match(/axios\/*/gm),
          'Content-Length': sinon.match.any,
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        payload: '{"param":"paramval"}',
        method: 'POST',
      },
      response: {
        headers: sinon.match.any,
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
          'Accept-Encoding': sinon.match.any,
          'User-Agent': sinon.match(/axios\/*/gm),
          'Content-Length': sinon.match.any,
        },
        host: sinon.match(/localhost:[0-9]+/gm),
        path: '/externalcall',
        payload: '{"param":"paramval"}',
        method: 'POST',
      },
      response: {
        headers: sinon.match.any,
        payload: '{"ok":"ok"}',
        status: 200,
        duration: sinon.match.number,
      },
      protocol: 'http:',
    });
  });
  it('POST /externalcall dgp-correlation { alloptions, specific headers }', async () => {
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
