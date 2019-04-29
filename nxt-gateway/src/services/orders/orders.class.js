/* eslint-disable no-unused-vars */
var amqp = require('amqplib/callback_api');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup (app) {
    this.app = app;
    this.fulfillmentService = app.service('ms/fulfillment');

    // RabbitMQ setup
    var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
    this.rmqConn = null;
    this.orderXName = 'orders';
    this.orderExchangeChannel = null;
    this.orderResponseXName = 'ordersResponse';
    this.orderResponseQName = 'ordersResponseToGWQueue';
    this.orderResponseChannel = null;
    amqp.connect(amqp_url, (err0, conn) => {
      if(err0) {
        throw(err0);
      }
    
      this.rmqConn = conn;

      //Set this up a a publisher to the exhange b/t gateway and Fulfillment service
      this.rmqConn.createChannel((err, ch) => {
        ch.assertExchange(this.orderXName, 'fanout', {durable:true});
        this.orderExchangeChannel = ch;
        console.log(' [*] GW publishing to the %s exchange', this.orderResponseXName);
      });

      //Set this up as a consumer of the exchange b/t orders orchestrator and gateway
      this.rmqConn.createChannel((err, ch) => {
        ch.assertExchange(this.orderResponseXName, 'fanout', {durable:true});
        ch.assertQueue(this.orderResponseQName, '', (err, q) => {
          ch.bindQueue(this.orderResponseQName, this.orderResponseXName, '');
          ch.consume(this.orderResponseQName, (msg) => {
            ch.ack(msg);
            var obj = JSON.parse(msg.content.toString());
            if(obj.msgType == 'orderCreateResponse') {
              if(obj.msgStatus == 'success') {
                console.log('  [X] GW:  order created:  ' + msg.content.toString());
              } else if (obj.msgStatus == 'failure') {
                console.log('  [X] GW:  order creation failed for:  ' + msg.content.toString());
              }
            }
            
          }, {noAck:false});
        });
        this.orderResponseChannel = ch;
      });
      console.log(' [*] GW is a is subscribed to the %s exchange', this.orderResponseXName);
    });

  }


  async find (params) {
    return [];
  }

  async get (id, params) {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  async create (data, params) {

    // @TODO split account data and order data
    //const account = await this.accountService.create(data);
    //data.account_id = account._id;

    
    var msg = JSON.stringify(data);
    this.orderExchangeChannel.publish('orders', '', Buffer.from(msg));

//    const order = await this.orderService.create(data);
    
//    return order;
  }

  async update (id, data, params) {
    return data;
  }

  async patch (id, data, params) {
    return data;
  }

  async remove (id, params) {
    return { id };
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
