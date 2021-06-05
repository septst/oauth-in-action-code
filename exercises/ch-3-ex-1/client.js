var express = require("express");
var request = require("sync-request");
var url = require("url");
var qs = require("qs");
var querystring = require('querystring');
var cons = require('consolidate');
var randomstring = require("randomstring");
var __ = require('underscore');
__.string = require('underscore.string');

var app = express();

app.engine('html', cons.underscore);
app.set('view engine', 'html');
app.set('views', 'files/client');

// authorization server information
var authServer = {
	authorizationEndpoint: 'http://localhost:9001/authorize',
	tokenEndpoint: 'http://localhost:9001/token'
};

// client information
var client = {
	"client_id": "oauth-client-1",
	"client_secret": "oauth-client-secret-1",
	"redirect_uris": ["http://localhost:9000/callback"]
};

//Protected Resource Information
var protectedResource = 'http://localhost:9002/resource';

var state = null;

var access_token = null;
var scope = null;

app.get('/', function (req, res) {
	res.render('index', { access_token: access_token, scope: scope });
});

app.get('/authorize', function (req, res) {

	state = randomstring.generate();

	let authorizeUrl = buildUrl(authServer.authorizationEndpoint, {
		response_type: "code",
		client_id: client.client_id,
		redirect_uri: client.redirect_uris[0],
		state: state
	});


	console.log("rediect ", authorizeUrl);
	res.redirect(authorizeUrl);
});

app.get('/callback', function (req, res) {
	let code = req.query.code;

	if (req.query.state !== state) {
		console.log('State DOES NOT MATCH: expected %s got %s', state, req.query.state);
		res.render('error', { error: 'State value did not match' });
		return;
	}

	let headers = {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'Basic ' + encodeClientCredentials(client.client_id, client.client_secret)
	};

	let form_data = qs.stringify({
		grant_type: 'authorization_code',
		code: code,
		redirect_uri: client.redirect_uris[0]
	});

	console.log('Requesting access token for code %s', code);
	let tokenResponse = request('POST', authServer.tokenEndpoint, {
		body: form_data,
		headers: headers
	});


	if (tokenResponse.statusCode >= 200 && tokenResponse.statusCode < 300) {
		let responseBody = JSON.parse(tokenResponse.getBody());
		access_token = responseBody.access_token;
		console.log(`Token => ${access_token}`);
		res.render('index', { access_token: access_token, scope: scope });
	} else {
		res.render('error', { error: `Unable to fetch token. The error code is ${tokenResponse.statusCode}` });
	}

});

app.get('/fetch_resource', function (req, res) {

	console.log("Access Token =>", access_token);
	if (!access_token) {
		res.render('error', { error: "Missing Token error" });
		return;
	}

	let headers = {
		'Authorization': 'Bearer ' + access_token
	};

	let resource = request('POST', protectedResource, { headers: headers });

	if (resource.statusCode >= 200 && resource.statusCode < 300) {
		var body = JSON.parse(resource.getBody());
		res.render('data', { resource: body });
		return;
	} else {
		res.render('error', { error: 'Server returned response code: ' + resource.statusCode });
		return;
	}
});

var buildUrl = function (base, options, hash) {
	var newUrl = url.parse(base, true);
	delete newUrl.search;
	if (!newUrl.query) {
		newUrl.query = {};
	}
	__.each(options, function (value, key, list) {
		newUrl.query[key] = value;
	});
	if (hash) {
		newUrl.hash = hash;
	}

	return url.format(newUrl);
};

var encodeClientCredentials = function (clientId, clientSecret) {
	return Buffer.from(querystring.escape(clientId) + ':' + querystring.escape(clientSecret)).toString('base64');
};

app.use('/', express.static('files/client'));

var server = app.listen(9000, 'localhost', function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('OAuth Client is listening at http://%s:%s', host, port);
});

