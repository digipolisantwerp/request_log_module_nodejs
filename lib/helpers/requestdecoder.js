const { URL } = require('url');

const getHost = (options) => {
  let host = `${options.hostname || options.host}`;
  if (options.port) host += `:${options.port}`;
  return host;
};

function makeUrl(url) {
  if (url.constructor.name === 'URL') return url;
  return new URL(url);
}

const getRequestParams = (options, body = '', url = false) => {
  if (!options && url) {
    const urlObj = makeUrl(url);
    return {
      host: getHost(urlObj),
      path: urlObj.pathname,
    };
  }
  return {
    headers: options.headers,
    host: getHost(options),
    path: options.path,
    method: options.method,
    payload: body,
  };
};

const getProtocol = (options, url = false) => {
  if (!options && url) {
    const { protocol } = makeUrl(url);
    return protocol;
  }
  return options.protocol;
};

module.exports = {
  getRequestParams,
  getHost,
  getProtocol,
};
