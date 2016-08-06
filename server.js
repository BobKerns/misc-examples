
var express = require('express');
var app = express();
var child_process = require('child_process');
var toString = require('stream-to-string');
var log = require('./log.js');

app.get('/', (req, res) => res.send("Hello, World"));

function runCmd(cmd, ...args) {
    return new Promise((accept, reject) => {
	log.info("Running %s, %j", cmd, args)
	let proc = child_process.execFile(cmd, args);
	proc.stdout.on('error', e => {
	    log.error("IO Error: , %s", e.stack);
	    reject(e);
	});
	let out = toString(proc.stdout);
	proc
	    .on('error', reject)
	    .on('exit', (code, signal) => {
		if (code === 0) {
		    log.info("Status %s, %j = %d", cmd, args, code)
		    accept(out);
		} else if (signal) {
		    log.error("Signal %s, %j = %s", cmd, args, signal)
		    reject(new Error(signal));
		} else {
		    log.error("Signal %s, %j = %d", cmd, args, code)
		    reject(new Error(cmd + " Exited with code " + code));
		}
	    });
    })
}

function sendErr(res) {
    return err => res.sendStatus(503, err.stack);
}

function sendText(res) {
    return txt => res.end(txt, "UTF-8");
}

function sendJson(res) {
    return json => res.json(json);
}

app.get('/ls/txt', (req, res) => {
    runCmd('/bin/ls', '-l')
	.then(sendText(res), sendErr(res));
});

app.get('/ls/json', (req, res) => {
    runCmd('/bin/ls', '-l')
	.then(x => ({status: "OK", result: x.split(/\n+/g)}))
	.catch(err => ({status: "ERROR", message: err.message}))
        .then(sendJson(res), sendErr(res));
});


var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  log.info("Example app listening at http://%s:%s", host, port)

});

