

'use strict';
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers'),
    config = require('./config');

var APP_ID = config.APP_ID;
var skillContext = {};

/**
 * MapperStatus is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var MapperStatus = function () {
    AlexaSkill.call(this, APP_ID);
    skillContext.needMoreHelp = false;
};


// Extend AlexaSkill
MapperStatus.prototype = Object.create(AlexaSkill.prototype);
MapperStatus.prototype.constructor = MapperStatus;

eventHandlers.register(MapperStatus.prototype.eventHandlers, skillContext);
intentHandlers.register(MapperStatus.prototype.intentHandlers, skillContext);

module.exports = MapperStatus;

