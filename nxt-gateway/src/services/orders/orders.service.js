// Initializes the `orders` service on path `/orders`
const createService = require('./orders.class.js');
const hooks = require('./orders.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/orders', createService(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('orders');

  service.hooks(hooks);



};
