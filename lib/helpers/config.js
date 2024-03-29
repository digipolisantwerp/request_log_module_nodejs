const { pick } = require('./pick');

const setBooleanValue = (value, defaultValue = false) => {
  if (value !== undefined) {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
  }
  if (defaultValue === 'true' || defaultValue === true) {
    return true;
  }
  return false;
};

const validateConfig = (config) => {
  const filteredConfig = pick(config, [
    'type',
    'correlationIdfallback',
    'correlationIdLocation',
    'logResponse',
    'logResponsePayload',
    'logRequestHeaders',
    'logRequestPayload',
    'logResponseHeaders',
    'logRequestSearchParams',
  ]);
  filteredConfig.logRequestHeaders = setBooleanValue(filteredConfig.logRequestHeaders, false);
  filteredConfig.logRequestPayload = setBooleanValue(filteredConfig.logRequestPayload, false);
  filteredConfig.logResponsePayload = setBooleanValue(filteredConfig.logResponsePayload, false);
  filteredConfig.logResponseHeaders = setBooleanValue(filteredConfig.logResponseHeaders, false);
  filteredConfig.logRequestSearchParams = setBooleanValue(filteredConfig.logRequestSearchParams, false);
  if (config && config.logRequestHeaders && Array.isArray(config.logRequestHeaders)) {
    filteredConfig.pickRequestHeaders = config.logRequestHeaders;
    filteredConfig.logRequestHeaders = true;
  }
  if (config && config.logResponseHeaders && Array.isArray(config.logResponseHeaders)) {
    filteredConfig.pickResponseHeaders = config.logResponseHeaders;
    filteredConfig.logResponseHeaders = true;
  }

  return filteredConfig;
};

module.exports = {
  validateConfig,
  setBooleanValue,
};
