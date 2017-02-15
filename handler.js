'use strict';

var request = require('request');
var AWS = require('aws-sdk');

AWS.config.update({
    region: "us-west-2"
});

var docClient = new AWS.DynamoDB.DocumentClient({
    region: "us-west-2"
});
var table = "BroncoBus";

module.exports.fetch = (event, context, callback) => {
    // fetchBusTimes(event.pathParameters.name, callback);
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
            message: "Bus time has been fetched"
        }),
    };

    fetchBusTimes();
    callback(null, response);
}

module.exports.scan = (event, context, callback) => {
    scanBusTimes(callback);
};

function fetchBusTimes() {
    request('https://rqato4w151.execute-api.us-west-1.amazonaws.com/dev/info', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            var items = JSON.parse(body);
            for (var i = 0; i < items.length; ++i) {
                console.log(items[i]);
                putItem(items[i].id, items[i].logo, items[i].lat, items[i].lng, items[i].route);
            }
        } else {
            console.error("Thing don't work");
        }
    });
}

function putItem(id, logo, lat, lng, route) {
    var params = {
        TableName: table,
        Item: {
            "id": id,
            "logo": logo,
            "lat": lat,
            "lng": lng,
            "route": route,
            "timestamp": Date.now(),
        }
    };

    console.log("Adding new bus...");
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add bus. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added bus:", JSON.stringify(data, null, 2));
        }
    });
}

function scanBusTimes(callback) {
    var params = {
        TableName: table,
    };

    docClient.scan(params, function(err, data) {
        if (err) {
            console.error("Unable to scan. Error:", JSON.stringify(err, null, 2));
            if (callback) {
                const responseErr = {
                    statusCode: 500,
                    headers: {
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify({
                        'err': err
                    }),
                };
                callback(null, responseErr);
            }
        } else {
            data.Items.forEach(function(item) {
                console.log(item);
            });
            if (callback) {
                const responseOk = {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: JSON.stringify(data.Items)
                };
                callback(null, responseOk);
            }
        }
    });
}
