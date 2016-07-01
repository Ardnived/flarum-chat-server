
const SERVER = require('./server.js');
const DATA = require('./data.js');

var priv = {
	usersByName: {},
	usersById: {},
};

var pub = {
	initialize: function(user_name, client_id, since, until) {
		var user = {
			client_id: client_id,
			name: user_name,
		};

		priv.usersByName[user_name] = user;
		priv.usersById[client_id] = user;
		console.log("  USERS ", "Created", user);

		DATA.get_subscriptions(user_name, function(room_ids) {
			SERVER.send(client_id, {
				action: 'initialize',
				room_ids: room_ids,
			});

			DATA.get_all_history(room_ids, since, until, function(history) {
				SERVER.send(client_id, history);
				SERVER.commit();
			});
		});
	},

	destroy: function(client_id) {
		if (client_id in priv.usersById) {
			var user = priv.usersById[client_id];
			delete priv.usersByName[user.name];
			delete priv.usersById[user.client_id];
			console.log("  USERS ", "Destroyed", client_id);
		}
	},

	get_by_client_id: function(client_id) {
		console.log("  USERS ", "Got", priv.usersById[client_id], "with id", client_id);
		return priv.usersById[client_id];
	},

	get_by_name: function(user_name) {
		console.log("  USERS ", "Got", priv.usersByName[user_name], "with name", user_name);
		return priv.usersByName[user_name];
	},
};

module.exports = pub;
