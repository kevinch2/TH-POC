const account = require('./account/account.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(account);
};
