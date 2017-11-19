var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;
var fs = require('fs');
var credentials = {
	projectId: '5c9a3355869548e39468ac4a63e2cecd',
	userId: 'd0d83ea0e2a24f078a0f3dd539189e4e',
	password: 'c(6RP4NKn&e3.b8Q',
	region: ObjectStorage.Region.DALLAS
};
const uuidv4 = require('uuid/v4');

var objstorage = new ObjectStorage(credentials);


fs.readFile('app.js', function (err, data) {
	if (err) {
		return console.log(err);
	}
	get_container('CRUD', function (err, container) {
		if (err) return console.log(err)

		upload(container, 'file', data, function (err, data) {
			if (err) return console.log(err)
			console.log("Data created");
			console.log(data);
		})
	})
});

function get_container(name, callback) {
	objstorage.getContainer(name)
		.then(function (container) {
			callback(false, container)
		})
		.catch(function (err) {
			callback(true, null)
		});
}

function upload(container, name, data, callback) {
	container.createObject(uuidv4(), data)
		.then(function (object) {
			callback(false, object)
		})
		.catch(function (err) {
			callback(true, null)
		});
}