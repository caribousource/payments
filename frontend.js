var hapi = require('hapi');
var server = new hapi.Server();
var http = require('http');
var path = require('path');
var sprintf = require('util').format;

server.views({
	engines: {
		html: require('handlebars')
	},
	path: path.join(__dirname, 'templates'),
});

server.connection({port: 3000});

server.route({
	method: 'GET',
	path: '/script/{param}',
	handler: {
		directory: {
			path: 'script'
		}
	}
});

server.route({
	method: 'GET',
	path: '/',
	handler: function(request, response) {
		response.view('index');
	}
});

server.route({
	method: 'GET',
	path: '/address/{userName}/{authKey}',
	handler: function(request, response) {
		var userName = request.params.userName;
		var authKey = request.params.authKey;
		var options = {
			hostname: 'localhost',
			port: 3001,
			path: sprintf('/address/%s/%s', userName, authKey),
			method: 'GET'
		};
		var apiReq = http.request(options, function(apiResponse) {
			apiResponse.on('data', function(chunk) {
				response(chunk.toString('utf-8'));
			})
		});
		apiReq.on('error', function() {
			response('{"address": "error"}');
		});
		apiReq.end();
	}
})

server.start(function() {
	console.log('Server running at:', server.info.uri);
});
