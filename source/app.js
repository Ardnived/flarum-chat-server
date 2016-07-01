
const UUID = require('uuid4');
const HTTP = require("http");
const CONFIG = require('../config.js');
const SERVER = require('./server.js');
const DATA = require('./data.js');
const USERS = require('./users.js');
const ROOMS = require('./rooms.js');

SERVER.start(CONFIG.socket.port);
DATA.connect(CONFIG.redis.port);

SERVER.on('initialize', function(client_id, data) {
	console.log("Attempting authorization.")

	var request = HTTP.request({
		hostname: CONFIG.flarum.hostname,
		port: CONFIG.flarum.port,
		path: CONFIG.flarum.authentication_path,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	}, function(res) {
		if (res.statusCode == 200) {
			if (data.since != null) {
				data.since = new Date(data.since);
			}

			if (data.until != null) {
				data.until = new Date(data.until);
			}

			USERS.initialize(data.username, client_id, data.since, data.until);
			/* TODO: Use this if we need the userId or token.
			res.setEncoding('utf8');
			res.on('data', function(body) {
				console.log("Got data", body);
			});
			*/
		} else {
			SERVER.reject(client_id, {
				code: res.statusCode,
				message: "Could not authenticate: "+res.statusMessage,
			});
			SERVER.commit();
		}
	});

	request.on('error', function(error) {
		SERVER.reject(client_id, error);
		SERVER.commit();
	})

	request.write(JSON.stringify({
		identification: data.username,
		password: data.password,
	}));

	request.end();
});

SERVER.on('disconnect', function(client_id) {
	USERS.destroy(client_id);
});

SERVER.on('invite', function(client_id, data) {
	if (typeof(data.room_id) == 'undefined') {
		data.room_id = ROOMS.create();
		var user_name = USERS.get_by_client_id(client_id).name;
		ROOMS.subscribe(data.room_id, user_name);
	}

	if ('users' in data) {
		var users = data.users.split(',');

		for (var i = users.length - 1; i >= 0; i--) {
			var username = users[i].trim();
			var user = USERS.get_by_name(username);

			if (username != "") {
				ROOMS.subscribe(data.room_id, username);

				if (user != null) {
					SERVER.send(user.client_id, {
						action: 'invite',
						room_id: data.room_id,
					});
				}
			}
		};
	}
});

SERVER.on('leave', function(client_id, data) {
	var user_name = USERS.get_by_client_id(client_id).name;
	ROOMS.unsubscribe(data.room_id, user_name);
});

SERVER.on('message', function(client_id, data) {
	if (typeof(data.message) == 'string') {
		var user = USERS.get_by_client_id(client_id);

		ROOMS.broadcast(data.room_id, {
			action: 'message',
			room_id: data.room_id,
			message: data.message,
			date: data.date,
			user_id: user.client_id,
			username: user.name,
		});
	} else {
		console.log("Ignoring message of type " + typeof(data.message));
	}
});
