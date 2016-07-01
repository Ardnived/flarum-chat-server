
const DAEMON = require("daemonize2");

var daemon = DAEMON.setup({
    main: "./source/app.js",
    name: "yuvachat",
    pidfile: "yuvachat.pid"
});

switch (process.argv[2]) {
    case "start":
        daemon.start();
        break;
    case "stop":
        daemon.stop();
        break;
    default:
        console.log("Usage: [start|stop]");
}
