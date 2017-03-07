    

var reconnectCounter = 0;

//
// Instantiate the AWS SDK and configuration objects.  The AWS SDK for 
// JavaScript (aws-sdk) is used for Cognito Identity/Authentication, and 
// the AWS IoT SDK for JavaScript (aws-iot-device-sdk) is used for the
// WebSocket connection to AWS IoT and device shadow APIs.
// 
var AWS = awsrequire('aws-sdk');
var AWSIoTData = awsrequire('aws-iot-device-sdk');
console.log('Loaded AWS SDK for JavaScript and AWS IoT SDK');

//
// Remember our current subscription topic here.
//
var currentlySubscribedTopic = mapTopic !== null ? mapTopic.toLowerCase() : 'map_topic';

//
// Create a client id to use when connecting to AWS IoT.
//
var clientId = 'mqtt-explorer-' + (Math.floor((Math.random() * 100000) + 1));

AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: config.AWS_POOLID
});

const mqttClient = AWSIoTData.device({
    //
    // Set the AWS region we will operate in.
    //
    region: AWS.config.region,
    //
    // Use the clientId created earlier.
    //
    clientId: clientId,
    //
    // Connect via secure WebSocket
    //
    protocol: 'wss',
    //
    // Set the maximum reconnect time to 8 seconds; this is a browser application
    // so we don't want to leave the user waiting too long for reconnection after
    // re-connecting to the network/re-opening their laptop/etc...
    //
    maximumReconnectTimeMs: 8000,
    //
    // Enable console debugging information (optional)
    //
    debug: false,
    //
    // IMPORTANT: the AWS access key ID, secret key, and sesion token must be 
    // initialized with empty strings.
    //
    accessKeyId: '',
    secretKey: '',
    sessionToken: ''
});

//
// Attempt to authenticate to the Cognito Identity Pool.  Note that this
// example only supports use of a pool which allows unauthenticated 
// identities.
//
window.mqttConnectionHandler = function() {
    
    var cognitoIdentity = new AWS.CognitoIdentity();
    AWS.config.credentials.get(function(err, data) {
        if (!err) {
            console.log('retrieved identity: ' + AWS.config.credentials.identityId);
            var params = {
                IdentityId: AWS.config.credentials.identityId
            };
            cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
                if (!err) {
                    //
                    // Update our latest AWS credentials; the MQTT client will use these
                    // during its next reconnect attempt.
                    //
                    mqttClient.updateWebSocketCredentials(data.Credentials.AccessKeyId, data.Credentials.SecretKey, data.Credentials.SessionToken, 21600000);

                    setTimeout(function(){ 
                        //mqttClient.end(true);
                        setTimeout(function(){  
                            window.mqttConnectionHandler(); 
                        }, 10000); 
                    }, 3420000); // after 57 minute, re-establish credentials (socket is only open for 60 mins)

                } else {
                    console.log('error retrieving credentials: ' + err);
                    alert('error retrieving credentials: ' + err);
                }
            });
        } else {
            console.log('error retrieving identity:' + err);
            alert('error retrieving identity: ' + err);
        }
    });
}
window.mqttConnectionHandler();

//
// Connect handler; 
// Subscribe to lifecycle events on the first connect event.
//
window.mqttClientConnectHandler = function() {
    console.log('connect');
    reconnectCounter = 0;
    //
    // Subscribe to our current topic.
    //
    mqttClient.subscribe(currentlySubscribedTopic);
};
//
// Reconnect handler;
//
window.mqttClientReconnectHandler = function() {
    console.log('reconnect');
    reconnectCounter++;
    if (reconnectCounter > 5) {
        //alert('Connection to Alexa lost. The page will reload.');
        location.reload();
    }
};
//
// Utility function to determine if a value has been defined.
//
window.isUndefined = function(value) {
    return typeof value === 'undefined' || typeof value === null;
};
//
// Message handler for lifecycle events; 
// connect/disconnect.
//
window.mqttClientMessageHandler = function(topic, payload) {
    console.log('message: ' + topic + ':' + payload.toString());
    var jsonPayload = JSON.parse(payload);
    console.log(jsonPayload);

    // call to the map
    mapFunctions.callMapFunction(jsonPayload);
};
window.mqttUnSubReSubHandler = function(topic) {
    if (topic.toLowerCase() != currentlySubscribedTopic.toLowerCase()) {
        console.log('unsubscribe / re-subscribe');
        mqttClient.unsubscribe(currentlySubscribedTopic);
        currentlySubscribedTopic = topic.toLowerCase();
        mqttClient.subscribe(currentlySubscribedTopic);
    }
};
//
// Install connect/reconnect event handlers.
//
mqttClient.on('connect', window.mqttClientConnectHandler);
mqttClient.on('reconnect', window.mqttClientReconnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);
