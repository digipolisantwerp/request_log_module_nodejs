const assert = require('node:assert/strict');
const { getHost } = require('../lib/helpers/requestdecoder.js');

describe('requestdecoder:', () => {
  it('getHost', async () => {
    assert.equal(getHost({ host: 'host' }), 'host');
  });
});
