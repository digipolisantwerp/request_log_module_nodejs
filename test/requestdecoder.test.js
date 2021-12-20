const chai = require('chai');

const { getHost } = require('../lib/helpers/requestdecoder');

describe('requestdecoder:', () => {
  it('getHost', async () => {
    chai.expect(getHost({ host: 'host' })).to.eql('host');
  });
});
