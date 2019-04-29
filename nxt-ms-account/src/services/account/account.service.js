// Initializes the `account` service on path `/account`
const createService = require('feathers-mongodb');
const hooks = require('./account.hooks');
var amqp = require('amqplib/callback_api');

module.exports = function (app) {
  const paginate = app.get('paginate');
  const mongoClient = app.get('mongoClient');
  const options = { paginate };

  // Initialize our service with any options it requires
  app.use('/account', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('account');

  mongoClient.then(db => {
    service.Model = db.collection('account');
  });

  service.on('created', data => {
    console.log('Acct service got created event');
  });


  service.hooks(hooks);

  var orchToAccountQName = 'orchToAccountQueue';
  var orchToAccountChannel = null;
  var accountToOrchQName = 'accountToOrchQueue';
  var accountToOrchChannel = null;

  var amqp_url = 'amqp://yvtsrovv:yEZ_sKFTVMbuX31nctaCLp_8V_lajLzI@clam.rmq.cloudamqp.com/yvtsrovv';
  amqp.connect(amqp_url, (err0, conn) => {
    if(err0) {
      throw(err0);
    }

    conn.createChannel((err1, ch) => {
      if(err1) {
        throw(err1);
      }

      console.log(' [*] Account is comsuming messages from %s.', orchToAccountQName);

      // Orch to account channel
      ch.assertQueue(orchToAccountQName);
      ch.consume(orchToAccountQName, function(msg) {
        ch.ack(msg);

        var obj = JSON.parse(msg.content.toString());

        if(obj.msgType == 'accountDetailRequest') {
          service.emit('find', msg);
        }
        
      }, {noAck:false});
      orchToAccountChannel = ch;
    });

    // Account to orch channel
    conn.createChannel((err1, ch) => {
      ch.assertQueue(accountToOrchQName);
      accountToOrchChannel = ch;
    });

  });


  service.on('find', data => {
    console.log('  [X] Account detail request:  ' + data.content.toString());

    newdata = JSON.parse(data.content.toString());
    newdata.msgType = 'accountDetailRequestResponse';
    newdata.acctId = 77;

    console.log('  [X] Account responding with:  ' + JSON.stringify(newdata));
    accountToOrchChannel.sendToQueue(accountToOrchQName, Buffer.from(JSON.stringify(newdata)));
  });
};
