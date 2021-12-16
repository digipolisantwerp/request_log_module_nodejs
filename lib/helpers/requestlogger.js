const log = require('@digipolis/log');
const { picklog } = require('./picklog');

module.exports = (config) => {
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
