# TH-POC

Each top-level directory represents a different application. Each application is designed to be run in a separate terminal. You run them by navigating to the app's directory (i.e., one level down) and typing "npm start", with the exception of the orchestrator, which is run by navigating to nxt-ms-orchestrator and typing, "node orchestrator.js". Even though there is some MongoDB integration, so you have to have it installed for this to work.

The POC works like this:

The gateway publishes the order data to the "Orders" exchange.
The fullfillment service is subscribed to the queue bound to that exchange; it picks up the message.
The fulfillment service decides whether the order is fulfillable (right now, this is just a random choice). A. If it is fullfillable, it publishes the order data onto the queue that the orchestrator is subscribed to. Goto 4. B. If it is not fulfillable, it publishes a orderCreateResponse event onto the ordersResponse exchange, which the gateway is subscribed to. It has a message type of "failure", and a message indiciating that the order cannot be fulfilled.
The orchestrator publishes an accountDetailRequest message to the queue that the account service is subscribed to.
The account service processes this message, firing off a "find" event. It adds a hardcoded account ID of 77 to the request data, and publishes an "accountDetailResponse" message to a queue that the orchestrator is subscribed to.
The orchestrator publishes the order request, now augmented with account details, to the queue that the order service is subscribed to.
The order service receives the message and fires off a "Create" event. The order service publishes an "orderCreateResponse" message with "success" as the message type onto a queue that the orchestrator is subscribed to.
The orchestrator publishes the message it just received onto an exchange ("ordersResponse") that the gateway is subscribed to.
In order to see it in action, post an order to "localhost:3030". IIRC, there are not any required fields. An example of a POST body order I used for testing is:

id=7&sku=ABC-123-DEF-4567&qty=6&total=99.00&acctEmail=test%40test.com
Note that all the apps use a free RabbitMQ server that I set up. You should still be able to use the queues, but logging into the UI to see the exchanges, queus, connection, etc. requires my personal credentials. I'd reccomend you swap out my URL for one that you set up yourself.

I was figuring things out as I went along, so I may not have made the best choices w.r.t the style and places I put functionality. Feel free to criticize & make suggestions.
