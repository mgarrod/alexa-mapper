# alexa-mapper


# website

install node.js and npm and make bundle (https://github.com/aws/aws-iot-device-sdk-js):

In order for the browser application to be able to authenticate and connect to AWS IoT, you'll need to configure a Cognito Identity Pool. In the Amazon Cognito console, use Amazon Cognito to create a new identity pool, and allow unauthenticated identities to connect. Obtain the PoolID constant. Make sure that the policy attached to the unauthenticated role has permissions to access the required AWS IoT APIs. More information about AWS IAM roles and policies can be found here.

https://github.com/npm/npm

http://iconof.com/blog/how-to-install-setup-node-js-on-amazon-aws-ec2-complete-guide/#installNode

git clone https://github.com/aws/aws-iot-device-sdk-js.git
cd aws-iot-device-sdk-js

sudo npm install -g browserify

export AWS_SERVICES=cognitoidentity

npm run-script browserize

cp browser/aws-iot-sdk-browser-bundle.js to directory of web app

change line 1: require to awsrequire (avoid dojo library conflicts)

uglify it: https://skalman.github.io/UglifyJS-online/


Tomcat, User Specific:
yum install tomcat8-webapps tomcat8-admin-webapps
https://dzone.com/articles/setting-ssl-tomcat-5-minutes

chmod +x startup.sh


#alexa

Use app creds https://sellercentral.amazon.com/gp/homepage.html/ for alexa account linking

https://login.amazon.com/website

https://sellercentral.amazon.com/gp/homepage.html/ (***** change url in here)

https://developer.amazon.com/iba-sp/web-settings/view.html?showDeleted=false&identityAppFamilyId=amzn1.application.858b3f35d1cf449d8e214f8dd920054c

https://www.hackster.io/awshome/awshome-home-automation-using-rpi-alexa-iot-a3d3dc

https://developer.amazon.com/public/apis/engage/login-with-amazon/docs/customer_profile.html

https://api.amazon.com/user/profile?access_token=



#lambda

lambda examples: https://github.com/amzn/alexa-skills-kit-js
	(based on https://github.com/amzn/alexa-skills-kit-js/tree/master/samples/scoreKeeper)

	https://github.com/alexa

http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/IotData.html
forum: https://forums.aws.amazon.com/message.jspa?messageID=699922


#admin sites:

AWS Alexa: https://developer.amazon.com/edw/home.html#/skills/list

AWS Lambda: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions?display=list

AWS IoT: https://console.aws.amazon.com/iotv2/home?region=us-east-1#/dashboard

AWS IAM: https://console.aws.amazon.com/iam/home?region=us-east-1#/roles/

AWS Cognito: https://console.aws.amazon.com/cognito/home?region=us-east-1#


#reference sites

JS API:
https://github.com/mqttjs/MQTT.js/blob/master/README.md
https://github.com/aws/aws-iot-device-sdk-js

AWS Node.js examples: https://github.com/awslabs/aws-iot-examples

AWS docs:
http://docs.aws.amazon.com/iot/latest/developerguide/protocols.html

EASY WAY to GET STARTED:
https://console.aws.amazon.com/iotv2/home?region=us-east-1#/connectdevice/



