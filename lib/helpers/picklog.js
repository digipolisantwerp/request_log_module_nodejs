const { pick } = require('./pick');

const picklog = (config, log) => {
  const pickedlog = { ...log };

  if (!config.logResponseHeaders && pickedlog.response) delete pickedlog.response.headers;
  if (!config.logResponsePayload && pickedlog.response) delete pickedlog.response.payload;
  if (!config.logRequestHeaders && pickedlog.request) delete pickedlog.request.headers;
  if (!config.logRequestPayload && pickedlog.request) delete pickedlog.request.payload;
  if (config.logRequestSearchParams && pickedlog.request && pickedlog.request.search) {
    pickedlog.request.path += pickedlog.request.search;
  }
  delete pickedlog.request.search;
  if (pickedlog.correlationId === undefined) delete pickedlog.correlationId;

  if (Array.isArray(config.pickRequestHeaders) && pickedlog.request) {
    pickedlog.request.headers = pick(pickedlog.request.headers, config.pickRequestHeaders);
  }
  if (Array.isArray(config.pickResponseHeaders) && pickedlog.response) {
    pickedlog.response.headers = pick(pickedlog.response.headers, config.pickResponseHeaders);
  }
  pickedlog.type = ['application'];

  return pickedlog;
};

module.exports = {
  picklog,
};
