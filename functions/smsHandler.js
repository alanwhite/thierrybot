
const LogSender = require('./logSender.js');
const logSender = new LogSender();

module.exports.post = (event, context, callback) => {

  //Return 200 to Twilio
  callback(null, {
      statusCode: '200'
  });

  logSender.log(event.body, true);

};
