const http = require('http');
const https = require('https');
const createLogger = require('./helpers/requestlogger');
const startTimer = require('./helpers/requesttimer');
const { getRequestParams } = require('./helpers/requestdecoder');
const { validateConfig } = require('./helpers/config');

const httpModules = [http, https];

module.exports = (config) => {
  const validatedConfig = validateConfig(config);
  const logger = createLogger(validatedConfig);

  httpModules.forEach((httpModule) => {
    let original = httpModule.request;
    // check if already wrapped
    if (httpModule.original) original = httpModule.original;
    httpModule.original = original;

    httpModule.request = (options, callback) => {
      const timer = startTimer();

      const request = original(options, (res) => {
        let responsebody = '';
        // only collect if response is required
        if (validatedConfig.logResponsePayload) {
          res.on('data', (chunk) => { responsebody += chunk; });
        }
        // Log response
        res.on('end', () => {
          logger.reqlog({
            correlationId: options.headers?.['Dgp-Correlation'] || options.headers?.['dgp-correlation'],
            request: getRequestParams(options, res.socket._httpMessage.requestbody),
            response: {
              headers: res.headers,
              payload: responsebody,
              status: res.statusCode,
              duration: timer.getDuration(),
            },
            protocol: options.protocol,
          });
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
        logger.reqlog({
          correlationId: options.headers?.['Dgp-Correlation'] || options.headers?.['dgp-correlation'],
          request: getRequestParams(options, request.requestbody),
          response: {
            status: err.message,
            duration: timer.getDuration(),
          },
          protocol: options.protocol,
        });
      });

      // Request payload
      request.write = new Proxy(request.write, {
        apply(target, thisArg, args) {
          if (validatedConfig.logRequestPayload) request.requestbody = args[0].toString();
          target.apply(thisArg, args);
        },
      });
      return request;
    };
  });

  return logger;
};
