var request = require('request');
var parseString = require('xml2js').parseString;
var AWS = require('aws-sdk');

AWS.config.update({
  region: "us-west-2"
});

'use strict';

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Updated Successfully!',
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.queryBusTime = (event, context, callback) => {
  queryBusTimes(event.pathParameters.name, callback);
};

var docClient = new AWS.DynamoDB.DocumentClient();
var table = "BroncoBusAPI";

function fetchBusTimes() {
  request ('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      parseString(body, function (err, result) {
        //console.dir (result.rss.channel[0].item);
        var items = result.rss.channel[0].item;
        for (var i = 0; i < items.length; i++) {
          console.log (items[i].title[0], items[i].description[0]);
          putItem(items[i].title[0], items[i].description[0]);
        }
      });
    } else {
      console.log("Unable to read given API");
    }
  })
}

function putItem (id, logo, lat, lng, route) {
  var params = {
    TableName:table,
    Item:{
      "BusID": id,
      "logo": logo,
      "lat": lat,
      "lng": lng,
      "route": route,
      "Timestamp": Date.now()
    }
  };

  console.log ("Adding new bus...");
  docClient.put(params, function(err, data) {
    if (err) {
      console.error ("Unable to add bus. Error JSON:", JSON.stringify(err, null, 2));
    } else {
      console.log ("Added bus:", JSON.stringify(data, null, 2));
    }
  });
}

function queryBusTime(bus, res) {
  var params = {
      TableName : table,
      KeyConditionExpression: "#key = :inputName",
      ExpressionAttributeNames:{
          "#key": "bus"
      },
      ExpressionAttributeValues: {
          ":inputName":bus
      }
  };

docClient.query(params, function(err, data) {
  if (err) {
    console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      if (callback) {
        const responseErr = {
          statusCode: 500,
          body: JSON.stringify({'err' : err}),
        };
        callback(null, responseErr);
      }
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
          if (callback) {
            const responseErr = {
              statusCode: 500,
              body: JSON.stringify({'err' : err}),
            };
            callback(null, responseErr);
          }
        }
      });
    }
