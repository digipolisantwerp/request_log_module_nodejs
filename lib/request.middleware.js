const createLogger = require('./helpers/requestlogger');
const { validateConfig } = require('./helpers/config');
const startTimer = require('./helpers/requesttimer');

module.exports = (config) => {
  const validatedConfig = validateConfig(config);
  const logger = createLogger(validatedConfig);

  return (req, res, next) => {
    const timer = startTimer();
    let responsebody = '';

    if (validatedConfig.logResponsePayload) {
      res.write = new Proxy(res.write, {
        apply(target, thisArg, args) {
          responsebody += args[0].toString();
          target.apply(thisArg, args);
        },
      });
    }

    res.end = new Proxy(res.end, {
      apply(target, thisArg, args) {
        if (validatedConfig.logResponsePayload && args[0]) responsebody += args[0].toString();

        logger.reqlog({
          correlationId: req.headers['Dgp-Correlation'] || req.headers['dgp-correlation'],
          request: {
            headers: req.headers,
            host: req.get('host'),
            path: req.originalUrl,
            method: req.method,
            payload: req.body,
          },
          response: {
            headers: res.getHeaders(),
            status: res.statusCode,
            duration: timer.getDuration(),
            payload: responsebody,
          },
          protocol: req.protocol,
        });
        target.apply(thisArg, args);
      },
    });

    return next();
  };
};
