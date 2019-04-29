const fulfillment = require('./fulfillment/fulfillment.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(fulfillment);
};
