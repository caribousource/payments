var restify = require('restify');
var bitcoin = require('bitcoinjs-lib');
var mysql = require('mysql');

var config = require('./config');
var pool;
function webGetAddress(req, res, next) {
	var userName = req.params.user;
	var authKey = req.params.authKey;
	/* this only listens to localhost, but ... */
	if(userName.match(/[^a-zA-Z0-9]/)) {
		res.send(JSON.stringify({error: 'invalid username'}));
		next();
	}
	if(authKey.match(/[^a-zA-Z0-9]/)) {
		res.send(JSON.stringify({error: 'invalid authkey'}));
		next();
	}

	getAddress(userName, authKey, function(err, address) {
		if(err || !address) {
			res.send(JSON.stringify({error: 'unable to get address'}));
			next();
		}
		else {
			res.send(JSON.stringify({address: address}));
			next();
		}
	});
}

function getAddress(userName, authKey, cb) {
	pool.query('SELECT btckey FROM users WHERE username = ? AND authkey = ?', [userName, authKey], function(err, rows) {
		if(err || rows.length != 1) {
			cb(err, null);
		}
		if(rows.length == 1) {
			var keyWIF = rows[0].btckey;
			if(!keyWIF) {
				createKey(userName, authKey, cb);
			} else {
				var btcKey = bitcoin.ECKey.fromWIF(keyWIF);
				var address = formatAddress(btcKey);
				cb(null, address);
			}
		}
	})
}

function createKey(userName, authKey, cb) {
	var btcKey = bitcoin.ECKey.makeRandom();
	var keyWIF;
	var keyWIF = btcKey.toWIF();
	var address = formatAddress(btcKey);
	pool.query('UPDATE users SET btckey = ? WHERE username = ? AND authkey = ?', [keyWIF, userName, authKey], function(err, result) {
		if(err || result.affectedRows != 1) {
			cb(err, null);
		}
		else if(result.affectedRows == 1) {
			cb(err, address);
		}
	});
}

function formatAddress(keyWIF) {
	if(config.testnet) {
		return keyWIF.pub.getAddress(bitcoin.networks.testnet).toString();
	} else {
		return keyWIF.pub.getAddress().toString();
	}
}

function main() {
	var server = restify.createServer();
	server.get('/address/:user/:authKey', webGetAddress);

	server.listen(3001, function() {
		console.log('%s listening at %s', server.name, server.url);
	});
	pool = mysql.createPool({
		host: config.mysqlHost,
		socketPath: config.mysqlSocketPath,
		port: config.mysqlPort,
		user: config.mysqlUsername,
		password: config.mysqlPassword,
		database: config.mysqlDatabase,
	});
}

main();
