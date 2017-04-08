require('dotenv').config();

// Server includes
var express = require('express');
var app = express();

// Include the files with all the logic
var webhook = require('./libs/webhook.js');

// Start server.
app.listen(process.env.PORT, function() {
  console.log('Now listening on port ' + this.address().port);
});

webhook.init();
