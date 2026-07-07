import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getHost } from '../lib/helpers/requestdecoder.js'

describe('requestdecoder:', () => {
  test('getHost', async () => {
    assert.equal(getHost({ host: 'host' }), 'host');
  });
});
