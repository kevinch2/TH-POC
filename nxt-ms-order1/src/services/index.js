const order = require('./order/order.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(order);
};
