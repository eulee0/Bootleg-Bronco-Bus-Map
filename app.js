var express = require ('express')
var AWS = require ('aws-sdk');
var chokidar = require ('chokidar')
var fs = require ('fs')
AWS.config.loadFromPath('./config.json');
var s3 = new AWS.S3();

var myBucket = 'cs499hack1';
var app = express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
  res.send ('Welcome to Bootleg Dropbox v0.0.0.1')
})

app.get('/list', function(req, res){
	var params = {
	  Bucket: myBucket
	};
	s3.listObjects (params, 	function(err, data){
	  for(var i = 0; i < data.Contents.length; i++) {
	  	data.Contents[i].Url = 'https://s3-us-west-2.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
	  }
	  res.send(data.Contents);
	});
});

var watcher = chokidar.watch('/home/ec2-user/bootlegDropbox', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

var log = console.log.bind(console);
// Add event listeners.
watcher
  .on('add', function (path){
    console.log (path + ' has been uploaded');
    uploadtoS3(path);
  })
  .on('change', function (path){
    console.log (path + ' has been altered');
    uploadtoS3(path);
  })
  .on('unlink', function(path){
    console.log (path + " has been removed");
    removefromS3(path);
  });

function uploadtoS3(filePath) {
  fs.readFile(filePath, function(err, data) {
    params = {Bucket: myBucket, Key: filePath, Body: data, ACL: "public-read"};
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log (err)
      } else {
        console.log("Uploaded to " + myBucket, data);
        }
      });
    });
  }

function removefromS3(filePath) {
  fs.readFile (filePath, function (err, data) {
    params = {Bucket: myBucket, Key: filePath };
    s3.deleteObject(params, function(err, data) {
      if (err) {
        console.log (err)
      } else {
        console.log ("Deleted from " + myBucket, data);
      }
    });
  });
}

app.listen (3000, function () {
  console.log('Your app is listening on port 3000!')
})
