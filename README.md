# MenDen DinnerBot

MenDen DinnerBot is a Slack bot used to post reminders and offer an interface to a house dinner scheduler at The Men Den.

The bot makes use of wit.ai for interpreting user's messages.


### Installation

First install dependencies:

```sh
$ npm install
```

Then copy the contents of .env.example into a new file named .env
You'll then need to enter your Slack and Wit.ai tokens into this file.

After that you'll need to create and place a `schedule.json` file inside the `data` directory. This file will act as the database. It needs to have the following structure:

```json
{
  "schedule":[
      {
          "users":[
              "The name of the user. If it's a slack userID, it'll tag the user in the messages"
          ],
          "next": "unix timecode of when this user group is next on"
      }
  ]
}

```

The app can then be run with a simple

```sh
$ node app.js
```

### Commands

Slack users can execute commands by address the bot in a message. There are three types of commands they can execute:

* Get the date associated with a user or users associated with a date. This can be done by saying things like "When am I on next", "Whose on next week" or "When is John doing dinner again?"
* Skip dinner on a date. This is done by saying things like "Skip the next dinner" or "There's no dinner on the 29th"
* Swap the date of two user groups. This command can be run by saying something like "Swap me and Jonathan".

These commands all rely on Wit.ai properly grabbing the arguments. The `wit.ai` directory contains exported settings from Wit.ai for this bot.
