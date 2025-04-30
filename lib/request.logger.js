const http = require('http');
const https = require('https');
const url = require('node:url');
const { createLogger, logRequest } = require('./helpers/requestlogger');
const startTimer = require('./helpers/requesttimer');
const { getRequestParams, getProtocol } = require('./helpers/requestdecoder');
const { validateConfig } = require('./helpers/config');

const httpModules = [http, https];
const httpMethods = ['request', 'get'];

module.exports = (config) => {
  const validatedConfig = validateConfig(config);
  const logger = createLogger(validatedConfig);
  let original = global.fetch;
  global.fetch = async (requestUrl, options) => {
    const parsedUrl = url.parse(requestUrl);
    let correlationId;
    if (options && options.headers) {
      correlationId = options.headers['Dgp-Correlation'] || options.headers['dgp-correlation'] || validatedConfig.correlationIdfallback;
    }

    const timer = startTimer();
    const response = await original(requestUrl, options)
    const duration = timer.getDuration();
    const req = {
      headers: options?.headers || undefined,
      host: parsedUrl.host,
      path: parsedUrl.path,
      method: options?.method || 'GET',
      payload: options?.body || undefined,
      search: parsedUrl.search,
    };
    const res = {
      status: response.status,
      duration,
    };
    const log = logRequest(logger, correlationId, req, res, parsedUrl.protocol );
    let logged = false;
    if (validatedConfig.logResponsePayload) {
      const json = () =>
        response
          .clone()
          .json()
          .then((data) => {
            log(data);
            logged = true;
            return (data)
          });
      const text = () =>
        response
          .clone()
          .text()
          .then((data) => {
            log(data);
            logged = true;
            return (data)
          });
      // Response is not parsed json/text
      setTimeout(() => {
        if(!logged) log();
      }, 1)
      response.json = json;
      response.text = text;
    } else {
      log();
    }
    return response;
  }

  httpModules.forEach((httpModule) => {
    httpMethods.forEach((httpMethod) => {
      let original = httpModule[httpMethod];
      // check if already wrapped
      if (httpModule[`${httpMethod}_original`]) original = httpModule[`${httpMethod}_original`];
      httpModule[`${httpMethod}_original`] = original;

      httpModule[httpMethod] = (...args) => {
        let url;
        let options;
        let callback;
        let originalParams = [];
        if (args[0].constructor.name === 'URL' || typeof args[0] === 'string') {
          [url] = args;
          originalParams = [url];
          if (typeof args[1] === 'object') {
            originalParams.push(args[1]);
          }
          if (typeof args[1] === 'function') {
            callback = args[1];
          }
          if (typeof args[2] === 'function') {
            callback = args[2];
          }
        } else {
          [options, callback] = args;
          originalParams = [options];
        }
        const timer = startTimer();
        const request = original(...originalParams, (res) => {
          let responsebody = '';
          // only collect if response is required
          if (validatedConfig.logResponsePayload) {
            res.on = new Proxy(res.on, {
              apply(target, thisArg, arg) {
                const [key, fn] = arg;
                if (key === 'data') {
                  arg[1] = new Proxy(fn, {
                    apply(target2, thisArg2, arg2) {
                      responsebody += arg2[0];
                      target2.apply(thisArg2, arg2);
                    },
                  });
                }
                target.apply(thisArg, arg);
              },
            });
          }
          // Log response
          res.on('end', () => {
            let correlationId;
            if (options && options.headers) {
              correlationId = options.headers['Dgp-Correlation'] || options.headers['dgp-correlation'] || validatedConfig.correlationIdfallback;
            }
            // not all tcp sockets are http
            if (res.req.socket && res.req.socket._httpMessage) {
              logger.reqlog({
                correlationId,
                request: getRequestParams(options, res.req.socket._httpMessage.requestbody, url),
                response: {
                  headers: res.headers,
                  payload: responsebody,
                  status: res.statusCode,
                  duration: timer.getDuration(),
                },
                protocol: getProtocol(options, url),
              });
            }
          });
          if (callback && typeof callback === 'function') {
            return callback(res);
          }
          return res;
        });
        // This puts the requestbody on res.socket._httpMessage
        request.requestbody = undefined;

        // Log Error
        request.on('error', (err) => {
          let correlationId;
          if (options && options.headers) {
            correlationId = options.headers['Dgp-Correlation'] || options.headers['dgp-correlation'];
          }
          logger.reqlog({
            correlationId,
            request: getRequestParams(options, request.requestbody, url),
            response: {
              status: err.message,
              duration: timer.getDuration(),
            },
            protocol: getProtocol(options, url),
          });
        });

        // Request payload
        request.write = new Proxy(request.write, {
          apply(target, thisArg, arg) {
            if (validatedConfig.logRequestPayload) request.requestbody = arg[0].toString();
            target.apply(thisArg, arg);
          },
        });
        return request;
      };
    });
  });

  return logger;
};
