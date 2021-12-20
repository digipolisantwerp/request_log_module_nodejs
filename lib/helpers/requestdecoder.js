const getHost = (options) => {
  let host = `${options.hostname || options.host}`;
  if (options.port) host += `:${options.port}`;
  return host;
};

const getRequestParams = (options, body = '') => ({
  headers: options.headers,
  host: getHost(options),
  path: options.path,
  method: options.method,
  payload: body,
});

module.exports = {
  getRequestParams,
  getHost,
};
