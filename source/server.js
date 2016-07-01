
const UTIL = require('util');
const SOCKET = require('socket.io');

var priv = {
	clients: {},
	callbacks: {},
	queue: {},

	on_connection: function(client) {
		console.log("Got connection");
		priv.clients[client.id] = client;

		client.on('message', function(payload) {
			console.log(payload.action+" from "+client.id+": "+JSON.stringify(payload));

			if (typeof payload == 'object' && !UTIL.isArray(payload)) {
				if (payload.action in priv.callbacks) {
					payload.date = new Date();

					priv.callbacks[payload.action](client.id, payload);
					pub.commit();
				} else {
					pub.reject(client.id, "Unrecognized action: "+payload.action);
					console.log("Unrecognized action from client: " + payload.action);
				}
			} else {
				pub.reject(client.id, "Invalid input "+JSON.stringify(payload));
			}
		});

		client.on('error', function(error) {
			console.error(error.stack);
		});

		client.on('disconnect', function() {
			if ('disconnect' in priv.callbacks) {
				priv.callbacks['disconnect'](client.id);
				pub.commit();
			}
		});

		if ('connect' in priv.callbacks) {
			priv.callbacks['connect'](client.id);
			pub.commit();
		}
	},
};

var pub = {
	start: function(port) {
		SOCKET(port).on('connect', priv.on_connection);
		console.log("Waiting for connections...");
	},

	commit: function() {
		console.log("  SERVER", "Commit messages", priv.queue);

		for (client_id in priv.queue) {
			if (client_id in priv.clients) {
				priv.clients[client_id].emit('message', priv.queue[client_id]);
			}
		}

		priv.queue = {};
	},

	reject: function(client_id, message) {
		pub.send(client_id, {
			action: 'rejected',
			message: message,
		})
	},

	send: function(client_id, payload) {
		console.log("Send to "+client_id+": "+JSON.stringify(payload));

		if (!UTIL.isArray(payload)) {
			payload = [payload];
		}

		if (client_id in priv.queue) {
			priv.queue[client_id].push.apply(priv.queue[client_id], payload);
		} else {
			priv.queue[client_id] = payload;
		}
	},

	on: function(action, callback) {
		priv.callbacks[action] = callback;
	},
};

module.exports = pub;
