const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./logger');

const feathers = require('@feathersjs/feathers');
const client = require('@feathersjs/client');
const configuration = require('@feathersjs/configuration');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const socketClient = require('@feathersjs/socketio-client');
const io = require('socket.io-client');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const app = express(feathers());

// Create Microservice Connections
const socketFulfillment = io('http://127.0.0.1:3031');
const clientFulfillment = client().configure(socketClient(socketFulfillment));

// Load app configuration
app.configure(configuration());

// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Create local MS endpoints
//app.use('/ms/account', clientAccount.service('account'));
//app.use('/ms/order', clientOrder.service('order'));
app.use('/ms/fulfillment', clientFulfillment.service('fulfillment'));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());
app.configure(socketio(io => {
  // Registering Socket.io middleware
  io.use((socket, next) => {
  // Exposing a request property to services and hooks
    socket.feathers.clientId = socket.id;
    next();
  });
}));

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());
app.use(express.errorHandler({ logger }));

app.hooks(appHooks);

module.exports = app;
