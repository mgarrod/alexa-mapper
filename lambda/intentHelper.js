/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var AWS = require('aws-sdk');
var config = require('./config');
//var http = require('https');

var intentHelper = (function () {
    var panGreenlist = {
        UP:1,
        DOWN:1,
        LEFT:1,
        RIGHT:1
    };

    var zoomGreenlist = {
        IN:1,
        OUT:1
    };

    var iotdata = new AWS.IotData({endpoint: config.IOT_ENDPOINT});
    
    return {
        
        getPanValue: function (recognizedPan) {
            if (!recognizedPan) {
                return undefined;
            }
            
            if (panGreenlist[recognizedPan.toUpperCase()] === undefined) {
                return undefined;
            }
            return recognizedPan;
        },

        getZoomValue: function (recognizedZoom) {
            if (!recognizedZoom) {
                return undefined;
            }
            
            if (zoomGreenlist[recognizedZoom.toUpperCase()] === undefined) {
                return undefined;
            }
            return recognizedZoom;
        },

        publishToIotTopic: function (params) {
            var pub = iotdata.publish(params).promise();
            return pub;
        },

        // getUserId: function (accessToken, amazonResponseCallback) {
            
        //     http.get("https://api.amazon.com/auth/o2/tokeninfo?access_token=" + accessToken, function (res) {
                
        //         var amazonResponseString = '';

        //         if (res.statusCode != 200) {
        //             amazonResponseCallback(new Error("Non 200 Response"));
        //         }

        //         res.on('data', function (data) {
        //             amazonResponseString += data;
        //         });

        //         res.on('end', function () {
        //             var amazonResponseObject = JSON.parse(amazonResponseString);

        //             if (amazonResponseObject.error) {
        //                 amazonResponseCallback(new Error(amazonResponseObject.error.message));
        //             } else {
        //                 amazonResponseCallback(null, amazonResponseObject);
        //             }
        //         });
        //     }).on('error', function (e) {
        //         amazonResponseCallback(new Error(e.message));
        //     });
        // },

        // example of setting a thing shadow. Not used on this one
        setThingShadow: function (params) {
            iotdata.updateThingShadow(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
        }
        
    };
})();
module.exports = intentHelper;
