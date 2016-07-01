
const UUID = require('uuid4');
const USERS = require('./users.js');
const DATA = require('./data.js')
const SERVER = require('./server.js')

var priv = {
	subscriptions: {},
	history: {},
};

var pub = {
	create: function() {
		var room_id = UUID();
		priv.subscriptions[room_id] = [];
		priv.history[room_id] = [];
		return room_id;
	},

	subscribe: function(room_id, user_name) {
		DATA.add_subscription(user_name, room_id);
	},

	unsubscribe: function(room_id, user_name) {
		DATA.remove_subscription(user_name, room_id);
	},

	send_history: function(room_id, client_id, date) {
		var user_name = USERS.get_by_client_id(client_id).name;
		DATA.get_history(room_id, user_name, date, function(results) {
			USERS.send(client_id, history);
		});
	},

	broadcast: function(room_id, payload) {
		DATA.add_history(room_id, payload);

		DATA.get_subscribers(room_id, function(results) {
			console.log("Broadcast to", results);
			for (var i = 0; i < results.length; i++) {
				var user = USERS.get_by_name(results[i]);

				if (user != null) {
					SERVER.send(user.client_id, payload);
				}
			}

			SERVER.commit();
		})
	}
};

module.exports = pub;