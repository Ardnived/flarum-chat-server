
const REDIS = require('redis');

var priv = {
	client: null,
};

var pub = {
	connect: function(port) {
		priv.client = REDIS.createClient(port);

		// TODO: Remove this test code.
		//priv.client.flushall();

		priv.client.on("error", function(error) {
			console.error("  DATA  ", "Redis Error", error);
		});

		console.log("  DATA  ", "Connected on port", port);
	},

	add_subscription: function(user_id, room_id) {
		priv.client.sadd("subscribers-"+room_id, user_id);
		priv.client.sadd("subscriptions-"+user_id, room_id);

		console.log("  DATA  ", "Added", user_id, "to", "subscribers-"+room_id);
		console.log("  DATA  ", "Added", room_id, "to", "subscriptions-"+user_id);
	},

	remove_subscription: function(user_id, room_id) {
		priv.client.srem("subscribers-"+room_id, user_id);
		priv.client.srem("subscriptions-"+user_id, room_id);

		console.log("  DATA  ", "Removed", user_id, "from", "subscribers-"+room_id);
		console.log("  DATA  ", "Removed", room_id, "from", "subscriptions-"+user_id);
	},

	get_subscribers: function(room_id, callback) {
		priv.client.smembers("subscribers-"+room_id, function(error, results) {
			if (error) {
				console.error(error);
			} else {
				console.log("  DATA  ", "Got", "subscribers-"+room_id, "=", results);
				callback(results);
			}
		});
	},

	get_subscriptions: function(user_id, callback) {
		priv.client.smembers("subscriptions-"+user_id, function(error, results) {
			if (error) {
				console.error(error);
			} else {
				console.log("  DATA  ", "Got", "subscriptions-"+user_id, "=", results);
				callback(results);
			}
		});
	},

	add_history: function(room_id, data) {
		console.log("Adding History", data);
		var time = data.date.getTime() / 1000;
		priv.client.zadd("history-"+room_id, time, JSON.stringify(data));
	},

	get_history: function(room_id, since, callback) {
		var result_handler = function(error, results) {
			if (error) {
				console.error(error);
			} else {
				for (var k in results) {
					results[k] = JSON.parse(results[k]);
				}

				callback(results);
			}
		};

		if (since == null) {
			priv.client.zrange("history-"+room_id, 0, -1, result_handler);
		} else {
			var time = since.getTime() / 1000;
			priv.client.zrangebyscore("history-"+room_id, time, "+inf", result_handler);
		}
	},

	get_all_history: function(room_ids, since, until, callback) {
		var batch = priv.client.batch();

		for (var i = room_ids.length - 1; i >= 0; i--) {
			if (since == null) {
				batch.zrange("history-"+room_ids[i], 0, -1);
			} else {
				console.log(since, until)
				since = (since == null ? "-inf" : since.getTime() / 1000);
				until = (until == null ? "+inf" : until.getTime() / 1000);
				batch.zrangebyscore("history-"+room_ids[i], since, until);
			}
		};

		batch.exec(function(error, histories) {
			if (error) {
				console.error(error);
			} else {
				var results = [];

				for (var i = histories.length - 1; i >= 0; i--) {
					for (var n = histories[i].length - 1; n >= 0; n--) {
						results.push(JSON.parse(histories[i][n]));
					}
				}

				callback(results);
			}
		})
	},
};

module.exports = pub;
