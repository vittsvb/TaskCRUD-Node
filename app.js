'use strict';

var express = require('express'),
	cors = require('cors'),
	server = require('http').createServer(app),
	passport = require('passport'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	GoogleStrategy = require('passport-google-oauth2').Strategy,
	MongoClient = require('mongodb').MongoClient,
	ObjectID = require('mongodb').ObjectID

// Create a new express server
var app = express();

var GOOGLE_CLIENT_ID = "968467371763-7t3j5tckni7981meer9vojrau2l797r1.apps.googleusercontent.com",
	GOOGLE_CLIENT_SECRET = "kY9ANEHyu2lOzIy6i33LN3_P";

// Passport session setup.
passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (obj, done) {
	done(null, obj);
});

// Use the GoogleStrategy within Passport.
passport.use(new GoogleStrategy({
		clientID: GOOGLE_CLIENT_ID,
		clientSecret: GOOGLE_CLIENT_SECRET,
		callbackURL: "http://localhost:3000/auth/google/callback",
		passReqToCallback: true
	},
	function (request, accessToken, refreshToken, profile, done) {
		process.nextTick(function () {
			return done(null, profile);
		});
	}
));

// Configure Express
// Serve the files out of ./public as our main files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
	secret: 'anything',
	saveUninitialized: true,
	resave: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

var collection;
var url = 'mongodb://vittsvb:v1i2t3t4s5@ds259255.mlab.com:59255/taskcrud';
MongoClient.connect(url, (err, database) => {
	collection = database.collection('tasks');
});

app.get('/', function (req, res) {
	res.render('login', {
		user: req.user
	});
});

app.get('/login', function (req, res) {
	res.render('login', {
		user: req.user
	});
});

app.get('/listar', ensureAuthenticated, function (req, res) {
	collection.find().toArray((err, results) => {
		if (err) return console.log(err)
		res.render('listar', {
			data: results,
		})
	})
});

app.get('/criar', ensureAuthenticated, function (req, res) {
	res.render('criar', {
		action: '/criar',
		data: {
			titulo: '',
			desc: '',
			status: '',
			name: req.user.displayName,
		},
		nameDone: req.user.displayName
	});
});

app.post('/criar', ensureAuthenticated, function (req, res) {
	collection.save(req.body, (err, result) => {
		if (err) return console.log(err)
		console.log('saved to database')
		res.redirect('/listar')
	})
});

app.get('/editar/:id', ensureAuthenticated, function (req, res) {
	var id = req.params.id;
	collection.findOne(new ObjectID(id), (err, results) => {
		if (err) return console.log(err)
		res.render('criar', {
			action: '/editar/' + results._id,
			data: results,
			nameDone: req.user.displayName
		})
	})
});

app.post('/editar/:id', ensureAuthenticated, function (req, res) {
	var id = {
		_id: ObjectID(req.params.id)
	}
	var newValues = {
		titulo: req.body.titulo,
		desc: req.body.desc,
		prioridade: req.body.prioridade,
		status: req.body.status,
		name: req.body.name,
		nameDone: req.body.nameDone
	}
	collection.updateOne(id, newValues, (err, results) => {
		if (err) return console.log(err)
		res.redirect('/listar');
	})
});

app.get('/deletar/:id', function (req, res) {
	var id = {
		_id: ObjectID(req.params.id)
	}
	collection.deleteOne(id, (err, results) => {
		if (err) return console.log(err)
		res.redirect('/listar');
	})
});

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

// GET /auth/google
app.get('/auth/google', passport.authenticate('google', {
	scope: [
       'https://www.googleapis.com/auth/plus.login',
       'https://www.googleapis.com/auth/plus.profile.emails.read']
}));

// GET /auth/google/callback
app.get('/auth/google/callback',
	passport.authenticate('google', {
		successRedirect: '/listar',
		failureRedirect: '/login'
	}));

const port = 3000;
// Start server on the specified port and binding host
app.listen(port, '0.0.0.0', function () {
	// Print a message when the server starts listening
	console.log("Server starting on localhost:" + port);
});

// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
}

module.exports = app;