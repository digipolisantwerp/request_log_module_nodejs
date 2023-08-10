const http = require('http');
const https = require('https');
const createLogger = require('./helpers/requestlogger');
const startTimer = require('./helpers/requesttimer');
const { getRequestParams, getProtocol } = require('./helpers/requestdecoder');
const { validateConfig } = require('./helpers/config');

const httpModules = [http, https];
const httpMethods = ['request', 'get'];

module.exports = (config) => {
  const validatedConfig = validateConfig(config);
  const logger = createLogger(validatedConfig);

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
