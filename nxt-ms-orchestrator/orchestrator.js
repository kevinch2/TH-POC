var amqp = require('amqplib/callback_api');

console.log('started');

var fulfillToOrchQName = 'fulfillmentToOrchQueue'
var fulfillToOrchChannel = null;
var orchToAccountQName = 'orchToAccountQueue';
var orchToAccountChannel = null;
var orchToOrderQName = 'orchToOrderQueue';
var orchToOrderChannel = null;
var orchToTransQName = 'orchToTransactionQueue';
var orchTOTransChannel = null;
var accountToOrchQName = 'accountToOrchQueue';
var accountToOrchChannel = null;
var orderToOrchQName = 'orderToOrchQueue';
var orderToOrchChannel = null;
var orchToGatewayQName = 'orchToGatewayQueue';
var orchToGatewayChannel = null;
var orderResponseXName = 'ordersResponse';

var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
amqp.connect(amqp_url, (err0, conn) => {
  if(err0) {
    throw(err0);
  }

    conn.createChannel((err1, ch) => {
    if(err1) {
      throw(err1);
    }
    
    //Fulfillment to Orchestrator channel
    ch.assertQueue(fulfillToOrchQName, '', (err, q) => {
      console.log(' [*] Orchestrator comsuming messages from ' + q.queue + '.');
    });

    ch.consume(fulfillToOrchQName, (msg) => {
      console.log('  [x] Orchestrator received from Fulfillment:  ' + msg.content.toString() + '.');
      ch.ack(msg);

      newdata = JSON.parse(msg.content.toString());
      newdata.msgType = 'accountDetailRequest';

      // Enqueue account detail request onto the orch-to-account queue
      orchToAccountChannel.sendToQueue(orchToAccountQName, Buffer.from(JSON.stringify(newdata)));
    }, {noAck: false});
      
    fulfillToOrchChannel = ch;
  });
  
  //Orchestrator to account channel:
  conn.createChannel((err1, ch) => {
    if(err1) {
      throw(err1);
    }
        
    ch.assertQueue(orchToAccountQName, '', (err, q) => {
      console.log(' [*] Orchestrator publishing to ' + q.queue + '.');
      orchToAccountChannel = ch;
    }, {noAck:false});

  });

  //Orchestrator to order channel:
  conn.createChannel((err1, ch) => {
    if(err1) {
      throw(err1);
    }
        
    ch.assertQueue(orchToOrderQName, '', (err, q) => {
      console.log(' [*] Orchestrator publishing to ' + q.queue + '.');
      orchToOrderChannel = ch;
    });
  });

  //Orchestrator to transaction channel:
  conn.createChannel((err1, ch) => {
    if(err1) {
      throw(err1);
    }
        
    ch.assertQueue(orchToTransQName, '', (err, q) => {
      console.log(' [*] Orchestrator publishing to ' + q.queue + '.');
      orchToTransChannel = ch;
    });
  });

  //Account to orchestrator channel:
  conn.createChannel((err1, ch) => {
    ch.assertQueue(accountToOrchQName, '', (err, q) => {
      console.log(' [*] Orchestrator publishing to ' + q.queue + '.');
      accountToOrchChannel = ch;
    });

    ch.consume(accountToOrchQName, (msg) => {
      console.log('  [X] Orchestrator received from account service:  ' + msg.content.toString());
      ch.ack(msg);
      obj = JSON.parse(msg.content.toString());

      if(obj.msgType == 'accountDetailRequestResponse') {
        obj.msgType = 'orderCreateRequest';
        orchToOrderChannel.sendToQueue(orchToOrderQName, Buffer.from(JSON.stringify(obj)));
        console.log('  [X] Orchestrator sent to order queue:  ' + JSON.stringify(obj));
      } 
    });
  });

  // Order to orchestrator channel
  conn.createChannel((err1, ch) => {
    ch.assertQueue(orderToOrchQName, '', (err, q) => {
      console.log(' [*] Orchestrator publishing to ' + q.queue + '.');
      orderToOrchChannel = ch;
    });

    ch.consume(orderToOrchQName, (msg) => {
      ch.ack(msg);
      obj = JSON.parse(msg.content.toString());

      if (obj.msgType == 'orderCreateResponse') {
        console.log('  [X] Orchestrator received from Order service:  ' + obj.msgStatus);
        if(obj.msgStatus == 'success') {
          orchToGatewayChannel.publish(orderResponseXName, '', Buffer.from(msg.content.toString()));
        }
      }
    });
  });
  
  //Orchestrator to gateway channel:
  conn.createChannel((err1, ch) => {
    if(err1) {
      throw(err1);
    }

    ch.assertExchange(orderResponseXName, 'fanout', {durable:true});
    orchToGatewayChannel = ch;
    console.log(' [*] Orchestrator publishing to ' + orderResponseXName);
  });

  console.log('To exit press CTRL-C.');
});


