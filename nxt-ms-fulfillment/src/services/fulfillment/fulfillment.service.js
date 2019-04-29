// Initializes the `fulfillment` service on path `/fulfillment`
const createService = require('feathers-mongodb');
const hooks = require('./fulfillment.hooks');
var amqp = require('amqplib/callback_api');

module.exports = function (app) {
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/fulfillment', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('fulfillment');

  mongoClient.then(db => {
    service.Model = db.collection('fulfillment');
  });

  service.hooks(hooks);

  var orderXName = 'orders'
  var orderQName = 'fulfillmentToOrchQueue';
  var orderChannel = null;
  var orderResponseXName = 'ordersResponse';
  var orderResponseQName = 'ordersResponseToGWQueue';
  var orderResponseChannel = null;
  
  var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
  amqp.connect(amqp_url, (err0, conn) => {
    if(err0) {
      throw(err0);
    }

    // For communication b/t the order exchange and fulfillment service; pub-sub pattern
    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      var queue = 'fulfillmentQueue';
      ch.assertExchange(orderXName, 'fanout', {durable:true});
      ch.assertQueue(queue, '', (err, q) => {
        console.log(' [*] Fulfillment is subscribed to ' + orderXName + ' exchange. To exit press CTRL+C');
        ch.bindQueue(queue, orderXName, '');

        ch.consume(queue, (msg) => {
          ch.ack(msg);
          console.log(' [x] Fulfillment ms svc got ' + msg.content.toString() + '.');
          service.emit('create', msg);
        }, {noAck: false});
      });
    });

    // For communication between fulfillment service and the orders orchestrator; work queue pattern
    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      ch.assertQueue(orderQName, {durable:true});
      orderChannel = ch;
      console.log(' [*] Fulfillment is subscribed to ' + orderQName + ' queue.');
    });


    //For communication back to the gateway
    conn.createChannel((err, ch) => {
      ch.assertExchange(orderResponseXName, 'fanout', {durable:true});
      this.orderResponseChannel = ch;
      console.log(' [*] Fulfillment is publishing to ' + orderResponseXName + ' exchange.')
    }); 
  });

  service.on('create', (data) => {
    var timeout = Math.random() * 3000;
    setTimeout(() => {
      var resp = Math.random() < .67 ? 'success' : 'error';
      if(resp=='success') {
        console.log('  [x] Fulfillment success');

        // Enqueue data onto the order queue
        orderChannel.sendToQueue(orderQName, Buffer.from(data.content));
      } else {
        console.log('  [x] Fulfillment failure');
        newdata = JSON.parse(data.content.toString());
        newdata.msgType = 'orderCreateResponse';
        newdata.msgStatus = 'failure';
        newdata.failureDesc = 'Order is not fulfillable';
        // Enqueue data to the orderResponse queue
        orderChannel.sendToQueue(orderResponseQName, Buffer.from(JSON.stringify(newdata)));
      }
    }, timeout);
    console.log('Order processed (' + (timeout/1000).toFixed(2) + 's)'); 
  });

};
