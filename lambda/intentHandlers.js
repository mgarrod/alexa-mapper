/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var intentHelper = require('./intentHelper');

var registerIntentHandlers = function (intentHandlers, skillContext) {

    intentHandlers.TiltCameraIntent = function (intent, session, response) {

        if (!intent.slots.Degree.value) {
            response.ask('What angle would you like to tilt the camera? Say, angle of, followed by a number');
            return;
        }

        var payload = {
            function: 'tiltTo',
            values: [
                intent.slots.Degree.value
            ]
        };
        
        // payload.function = 'tiltTo';
        // payload.values = [];
        // payload.values[0] = intent.slots.Degree.value;

        intentHandlers.publishToIotTopic(session, response, payload, 'tilt of ' + intent.slots.Degree.value + ' degrees sent to the map');

    };

    intentHandlers.ChangeHeadingIntent = function (intent, session, response) {

        if (!intent.slots.Degree.value) {
            response.ask('What heading would you like to send the camera? Say, heading of, followed by a number');
            return;
        }
        
        var payload = {
            function: 'headingTo',
            values: [
                intent.slots.Degree.value
            ]
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'heading of ' + intent.slots.Degree.value + ' sent to the map');

    };

    intentHandlers.MoveMapIntent = function (intent, session, response) {
        
        var intentValue = undefined;
        
        if (intent.slots.PanDirection.value !== undefined) {
            intentValue = intentHelper.getPanValue(intent.slots.PanDirection.value);

            if (!intentValue) {
                response.ask('sorry, I did not hear the command correctly, please say that again', 'Please say the action again');
                return;
            }

            var payload = {
                function: 'panTo',
                values: [
                    intentValue
                ]
            };

            intentHandlers.publishToIotTopic(session, response, payload, 'pan ' + intentValue + ' sent to the map');

        }
        else if (intent.slots.ZoomDirection.value !== undefined) {
            intentValue = intentHelper.getZoomValue(intent.slots.ZoomDirection.value);

            if (!intentValue) {
                response.ask('sorry, I did not hear the command correctly, please say that again', 'Please say the action again');
                return;
            }

            var intentToPass = intentValue=='in' ? 1 : -1;

            var payload = {
                function: 'zoomTo',
                values: [
                    intentToPass
                ]
            };

            intentHandlers.publishToIotTopic(session, response, payload, 'zoom ' + intentValue + ' sent to the map');

        }
        
    };

    intentHandlers.ZoomtoPlaceIntent = function (intent, session, response) {
        
        if (!intent.slots.Place.value && !intent.slots.Country.value) {
            response.ask('Where would you like to go? Say, locate, followed by a place or country');
            return;
        }

        var payload = {
            function: 'goToPlace',
            values: [
                intent.slots.Place.value,
                intent.slots.Country.value
            ]
        };
        
        var messge = !intent.slots.Place.value ? intent.slots.Country.value : intent.slots.Place.value;

        intentHandlers.publishToIotTopic(session, response, payload, 'locate ' + messge + ' sent to the map');

    };

    intentHandlers.ResetMapIntent = function (intent, session, response) {
        
        var payload = {
            function: 'resetMap',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'reset sent to the map');

    };

    intentHandlers.CurrentLocationIntent = function (intent, session, response) {
        
        var payload = {
            function: 'currentLocation',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'current location sent to the map');

    };

    intentHandlers.ViewShedIntent = function (intent, session, response) {
        
        var payload = {
            function: 'viewShed',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'calculate view shed sent to the map');

    };

    intentHandlers.RemoveGraphicsIntent = function (intent, session, response) {
        
        var payload = {
            function: 'removeAllGraphics',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'remove all graphics sent to the map');
        
    };

    intentHandlers.SpinTheGlobeIntent = function (intent, session, response) {
        
        var payload = {
            function: 'spinTheGlobe',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'spin the globe sent to the map');
        
    };

    intentHandlers.StopAnimationIntent = function (intent, session, response) {
        
        var payload = {
            function: 'stopAnimation',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'pause animation sent to the map');
        
    };

    intentHandlers.BufferPointIntent = function (intent, session, response) {
        
        if (!intent.slots.Distance.value) {
            response.ask('How many feet would you like to buffer the point? Say, buffer, followed by a number in feet');
            return;
        }

        var payload = {
            function: 'bufferPoint',
            values: [
                intent.slots.Distance.value
            ]
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'buffer the point ' + intent.slots.Distance.value + ' feet sent to the map');
        
    };

    intentHandlers.FlyByIntent = function (intent, session, response) {
        
        if (!intent.slots.City.value) {
            response.ask('What city would you like to fly over? Say, fly over, followed by a city');
            return;
        }

        var payload = {
            function: 'flyBy',
            values: [
                intent.slots.City.value
            ]
        };
        
        intentHandlers.publishToIotTopic(session, response, payload, 'fly over for ' + intent.slots.City.value + ' sent to the map');

    };

    intentHandlers.ShakeTheMapIntent = function (intent, session, response) {
        
        var payload = {
            function: 'shakeTheMap',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'earthquake initiated');

    };

    intentHandlers.ShitchToStarWarsIntent = function (intent, session, response) {
        
        var payload = {
            function: 'switchToStarWars',
            values: [],
            dontStopAnimation: true
        };

        var speechOutput = {
            speech: "<speak>That's no moon... it's a space station. "
                + "<audio src='https://s3.amazonaws.com/mapperdata/ImperialMarch.mp3'/>"
                + "</speak>",
            type: 'SSML'
        }

        intentHandlers.publishToIotTopic(session, response, payload, speechOutput);

    };

    intentHandlers.ShowHurricaneIntent = function (intent, session, response) {
        
        var payload = {
            function: 'showHurricane',
            values: []
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'showing hurricanes in the atlantic');

    };

    intentHandlers.ServiceAreaIntent = function (intent, session, response) {
        
        if (!intent.slots.Minutes.value) {
            response.ask('How many minutes would you like to drive? Say, drive time of, followed by a number');
            return;
        }

        var payload = {
            function: 'showServiceAreas',
            values: [
                intent.slots.Minutes.value
            ]
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'drive time of ' + intent.slots.Minutes.value + ' minutes sent to the map');
        
    };

    intentHandlers.ShowHelpIntent = function (intent, session, response) {
        
        var payload = {
            function: 'showHelp',
            values: [],
            dontStopAnimation: true
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'showing available commands');

    };

    intentHandlers.CloseHelpIntent = function (intent, session, response) {
        
        var payload = {
            function: 'closeHelp',
            values: [],
            dontStopAnimation: true
        };

        intentHandlers.publishToIotTopic(session, response, payload, 'closing help');

    };

    intentHandlers.LostTopicIntent = function (intent, session, response) {
  
        if (session.user === undefined || session.user.accessToken === undefined) {
            response.tellWithLinkAccount('Account linking is required for this command. Please use the companion app to enter a topic.');
        }
        else {

            var mapTopicSplit = session.user.accessToken.split('');
            var spellOutTopic = '';
            for (var x=0;x < mapTopicSplit.length; x++) {
                var char = mapTopicSplit[x];
                char = char == '_' ? 'underscore' : char == '-' ? 'dash' :  char;
                spellOutTopic += char + '. ';
            }

            response.tellWithCard('your topic is, ' + spellOutTopic + ' your topic has also been sent to a card on the companion app.','Lost Topic','Your Web Map Topic: ' + session.user.accessToken);
        }

    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        
        response.ask('Web Map skill is used in conjunction with a web map at, w w w dot alexamap dot net. After entering a topic at, w w w dot alexamap dot net, you will be able to control the map by issuing commands. If you have already set up a topic, you can ask Web Map to open help to show all available commands currently suported. Do you need help retrieving your topic? Is so, ask Web Map for your topic.');

    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        
        response.tell('Web Map command stopped.');

    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        
        response.tell('Web Map command canceled.');

    };

    intentHandlers.publishToIotTopic = function(session, response, payload, tellMessage) {

        if (session.user === undefined || session.user.accessToken === undefined) {
            response.tellWithLinkAccount('Account linking is required for this command. Please use the companion app to enter a topic.');
        }
        else {
            var params = {
                // debug
                //topic: 'map_topic',
                topic: session.user.accessToken.toLowerCase(),
                payload: JSON.stringify(payload),
                qos: 0
            };
            var topicResponse = intentHelper.publishToIotTopic(params);
            topicResponse.then(function(data) {
                response.tell(tellMessage);
            }).catch(function(err) {
                response.tell('Command failed to send to the map.');
            });
        }

        // if (session.user === undefined || session.user.accessToken === undefined) {
        //     response.tellWithLinkAccount('Account linking is required for this command. Please use the companion app to authenticate.');
        // }
        // else {
        //     intentHelper.getUserId(session.user.accessToken, function amazonResponseCallback(err, amazonResponse) {
            
        //         if (err) {
        //             response.tellWithLinkAccount('Account linking is required for this command. Please use the companion app to authenticate.');
        //         } else {
        //             var params = {
        //                 // debug
        //                 //topic: 'map_topic',
        //                 topic: 'map_topic_' + amazonResponse.user_id,
        //                 payload: JSON.stringify(payload),
        //                 qos: 0
        //             };
        //             var topicResponse = intentHelper.publishToIotTopic(params);
        //             topicResponse.then(function(data) {
        //                 response.tell(tellMessage);
        //             }).catch(function(err) {
        //                 response.tell('Command failed to send to the map.');
        //             });
        //         }

        //     });
        // }

    };

};
exports.register = registerIntentHandlers;
