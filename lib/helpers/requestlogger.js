const log = require('@digipolis/log');
const { picklog } = require('./picklog');

const createLogger = (config) => {
  const logger = log(console, {
    type: 'log',
    override: false,
    ...config,
  });
  logger.reqlog = (logmessage) => {
    logger.log(picklog(config, logmessage));
  };

  return logger;
};

const logRequest = (logger, correlationId, request, response, protocol) => (payload) => {
  logger.reqlog({
    correlationId,
    request,
    response: {
      ...response,
      payload,
    },
    protocol,
  });
}

module.exports = {
  logRequest,
  createLogger,
}
