const app = require('../../src/app');

describe('\'fulfillment\' service', () => {
  it('registered the service', () => {
    const service = app.service('fulfillment');
    expect(service).toBeTruthy();
  });
});
