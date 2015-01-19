var fs = require('fs');
var restify = require('restify');
var bitcoin = require('bitcoinjs-lib');
var mysql = require('mysql');
var openpgp = require('openpgp');

var config = require('./config');
var encryptKey;
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
	pool.query('SELECT btc_address FROM users WHERE username = ? AND authkey = ?', [userName, authKey], function(err, rows) {
		if(err || rows.length != 1) {
			cb(err, null);
		}
		if(rows.length == 1) {
			var address = rows[0].btc_address;
			if(!address) {
				createKey(userName, authKey, cb);
			} else {
				cb(null, address);
			}
		}
	})
}

function createKey(userName, authKey, cb) {
	var btcKey = bitcoin.ECKey.makeRandom();
	var keyWIF = btcKey.toWIF();
	var address = formatAddress(btcKey);
	pool.query('UPDATE users SET btc_address = ? WHERE username = ? AND authkey = ?', [address, userName, authKey], function(err, result) {
		if(err || result.affectedRows != 1) {
			cb(err, null);
		}
		else if(result.affectedRows == 1) {
			var encryptedMessage = openpgp.encryptMessage(encryptKey.keys, keyWIF.toString()).then(function(message) {
				fs.writeFile(userName + '.key.asc', message, { flag: 'w+' }, function(err) {
					if(err) {
						cb(err, null);
					} else {
						cb(null, address);
					}
				})
			}).catch(function(err) {
				cb(err, null);
			});
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

	server.listen(3001, '127.0.0.1', function() {
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
	var pgpKey = fs.readFileSync(config.pgpKey);
	encryptKey = openpgp.key.readArmored(pgpKey.toString('utf-8'));
}

main();
