
var since = null;
var client;
var rooms = [];

function connect(server, username, password) {
	console.log("Connecting to "+server)
	client = new window.io("http://"+server);

	client.on("connect", function() {
		// Do nothing right now.
		console.log("Connected to server");

		console.log("Initializing", {
			action: 'initialize',
			username: username,
			password: password,
			since: since,
		});

		client.emit('message', {
			action: 'initialize',
			username: username,
			password: password,
			since: since,
		});
	});

	client.on("disconnect", function() {
		since = new Date();
	});

	client.on("message", function(dataset) {
		console.log("Got "+JSON.stringify(dataset));

		if (!Array.isArray(dataset)) {
			dataset = [dataset];
		}

		for (var i = dataset.length - 1; i >= 0; i--) {
			var data = dataset[i];

			switch (data.action) {
			case 'initialize':
				if (typeof(data.room_ids) !== 'undefined' && data.room_ids.length > 0) {
					for (var n = data.room_ids.length - 1; n >= 0; n--) {
						join_room(data.room_ids[n]);
					}
				}

				break;
			case 'message':
				join_room(data.room_id);
				print_message(data.message, data.username, data.room_id);
				break;
			case 'invite':
				join_room(data.room_id, message);
				break;
			case 'rejected':
				console.log(data);
				break;
			default:

			}
		};
	});
}

function print_message(message, username, room_id) {
	jQuery("#history-"+room_id).append("<li><strong>"+username+"</strong>: "+message+"</li>");
}

function join_room(room_id, history) {
	if (rooms.indexOf(room_id) == -1) {
		rooms.push(room_id);

		jQuery("#rooms").append("<option value=\""+room_id+"\">Room "+room_id+"</option>");
		var element = jQuery("#history").clone();
		element.attr('id', "history-"+room_id);
		element.insertAfter(jQuery("#history"));
		jQuery("#history-"+room_id).append("<li>Joined Room "+room_id+"</li>");
	}
}

jQuery(document).ready(function() {
	jQuery("#connect").click(function() {
		connect(jQuery("#server").val(), jQuery("#username").val(), jQuery("#password").val());
	});

	jQuery("#send").click(function() {
		var room_id = jQuery("#rooms").val();
		var message = jQuery("#message");

		if (room_id != "") {
			client.emit('message', {
				action: 'message',
				room_id: room_id,
				message: message.val(),
			});

			message.val("");
		}
	});

	jQuery("#join").click(function() {
		var users = jQuery("#users");

		client.emit('message', {
			action: 'invite',
			users: users.val(),
		});

		users.val("");
	});
});

console.log("JavaScript Loaded");
