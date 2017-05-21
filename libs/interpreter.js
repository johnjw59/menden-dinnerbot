/**
 * Handles messages from Wit and builds responses.
 */

var moment = require('moment');
var data = require('./libs/data.js');

/**
 * Starting point of message interpretation.
 * Will figure out how to handle message.
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function interpretMessage(data) {
  var ret = '';

  switch (data.intent[0].value) {
    case 'get':
      ret = handleGet(data);
      break;

    case 'skip':
      ret = handleSkip(data);
      break;

    case 'swap':
      ret = handleSwap(data);
      break;
  }

  return ret;
}

/*******************************
 **     HELPER FUNCTIONS      **
 *******************************/

/**
 * Handle a "get" intent
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleGet(data) {


  return '';
}

/**
 * Handle a "skip" intent
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleSkip(data) {


  return '';
}

/**
 * Handle a "swap" intent
 *
 * @param  {object} data
 *         JSON object from wit.ai.
 *
 * @return {string}
 *         A message to send back to Slack.
 */
function handleSwap(data) {


  return '';
}

module.export = interpretMessage;
