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
    const query = urlObj.search ? urlObj.search : undefined;
    return {
      host: getHost(urlObj),
      path: urlObj.pathname.split(query)[0],
    };
  }
  return {
    headers: options.headers,
    host: getHost(options),
    path: options.path.split(options.search)[0],
    method: options.method,
    payload: body,
    search: options.search,
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
