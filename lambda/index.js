
'use strict';
var MapperStatus = require('./mapperStatus');

exports.handler = function (event, context) {

	var mapperStatus = new MapperStatus();
    mapperStatus.execute(event, context);
	
};
