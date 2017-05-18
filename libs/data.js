/**
 * Setters and getters for the schedule data.
 */

/**
 * Looks for the next person by date by making calls to get().
 *
 * @return see get()
 */
function getNext() {
  var next;
  var date = new Date();

  date.setDate(date.getDate() + (1 + 7 - date.getDay()) % 7);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);

  // We'll try the next four Mondays.
  for (var i=0; i < 4; i++) {
    next = getUsers(Date.parse(date));

    if (next != null) {
      break;
    }
    else {
      date.setDate(date.getDate() + 7);
    }
  }

  return next;
}

/**
 * Return the users associated with a given "next" value.
 *
 * @param {int} date
 *        A UNIX timecode.
 *
 * @return {array}
 *         An array containing usernames.
 */
function getUsers(date) {
  var jsonfile = require('jsonfile');
  var dataFile = 'data/schedule.json';
  var data = jsonfile.readFileSync(dataFile);

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].next == date) {
      return data.schedule[i].users;
    }
  }

  return null;
}

/**
 * Return the "next" value for a given user.
 *
 * @param {string} user
 *        A username.
 *
 * @return {int}
 *         A UNIX timecode.
 */
function getDate(user) {
  var jsonfile = require('jsonfile');
  var dataFile = 'data/schedule.json';
  var data = jsonfile.readFileSync(dataFile);

  for (var i=0; i < data.schedule.length; i++) {
    if (data.schedule[i].users.indexOf(user) > -1) {
      return data.schedule[i].next;
    }
  }

  return null;
}

module.exports = {
  getNext: getNext,
  getUsers: getUsers,
  getDate: getDate,
};
