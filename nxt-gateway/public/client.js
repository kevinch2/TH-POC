/* global io */

// Create a websocket connecting to our Feathers server
const socket = io('http://srv1.faintllc.com:3030');

/* good for debugging, can see all events being fired
var onevent = socket.onevent;
socket.onevent = function (packet) {
    var args = packet.data || [];
    onevent.call (this, packet);    // original call
    packet.data = ["*"].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
};

socket.on('*', (event, data) => {
  console.log(event);
  console.log(data);
});
*/

// Listen to new orders being created
socket.on('orders created', order => {
  console.log('Someone created an order', order);
});

socket.emit('create', 'orders', {
  firstname: faker.name.firstName(),
  lastname: faker.name.lastName(),
  email: faker.internet.email()
}, (error, result) => {
  if (error) throw error
  socket.emit('find', 'orders', (error, orderList) => {
    if (error) throw error
    console.log('Current orders', orderList);
  });
});