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

  service.hooks(hooks);

  var orchToOrderQName = 'orchToOrderQueue';
  var orchToOrderChannel = null;
  var orderToOrchQName = 'orderToOrchQueue';
  var orderToOrchChannel = null;

  var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
  amqp.connect(amqp_url, (err0, conn) => {
    if(err0) {
      throw(err0);
    }

    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      ch.assertQueue(orchToOrderQName);
      ch.consume(orchToOrderQName, function(msg) {
        ch.ack(msg);
        service.emit('create', msg);
      });
      orchToOrderChannel = ch;
    });

    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      ch.assertQueue(orderToOrchQName);
      orderToOrchChannel = ch;
  
      console.log(" [*] Order is consuming messages from %s.", orchToOrderQName);
    });

  });

  service.on('create', data => {
    console.log('  [X] Order service got created event:  ' + data.content.toString());
    obj = JSON.parse(data.content.toString());
    obj.msgType = 'orderCreateResponse';
    obj.msgStatus = 'success';
    orderToOrchChannel.sendToQueue(orderToOrchQName, Buffer.from(JSON.stringify(obj)));
  });

};
