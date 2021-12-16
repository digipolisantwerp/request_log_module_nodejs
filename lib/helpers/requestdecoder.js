const getHost = (options) => {
  let host = `${options.hostname}`;
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
};
