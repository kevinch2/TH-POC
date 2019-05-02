// Initializes the `order` service on path `/order`
const createService = require('feathers-mongodb');
const hooks = require('./order.hooks');
var amqp = require('amqplib/callback_api');

module.exports = function (app) {
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/order', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('order');

  // KHC - for this POC don't need to connect
  mongoClient.then(db => {
    service.Model = db.collection('order');
  });

  var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
  amqp.connect(amqp_url, (err0, conn) => {
    if(err0) {
      throw(err0);
    }

    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      var queue = 'orderQueue';
      var ex = 'orders';
      ch.assertExchange(ex, 'fanout', {durable:true});
      ch.assertQueue('orderQueue', '', (err, q) => {
        console.log(' [*] Waiting for messages in ' + q.queue + '. To exit press CTRL+C');
        ch.bindQueue(queue, ex, '');

        ch.consume(queue, function(msg) {
          console.log(' [x] Orders2 svc got ' + msg.content.toString() + '.');
        });
      });
    });
  });

  service.on('created', data => {
    console.log('Order service got created event');
  });

  service.hooks(hooks);
};
