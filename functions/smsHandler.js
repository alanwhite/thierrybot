const qs = require('qs');
const LogSender = require('./logSender.js');
const logSender = new LogSender();

const SERVICE_PHONE = process.env.SERVICE_PHONE;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ALERT_PHONE_NUMBER = process.env.ALERT_PHONE_NUMBER;

module.exports.post = (event, context, callback) => {

  //Return 200 to Twilio
  callback(null, {
      statusCode: '200'
  });

  logSender.log(event.body);

  const data = qs.parse(event.body);
  const recvdBy = data['To'];
  const sender = data['From'];
  const message = data['Body'];

  // console.log("Sender "+sender);
  // console.log("RecvdBy "+recvdBy);
  // console.log("SERVICE_PHONE "+SERVICE_PHONE);
  // console.log("TWILIO_PHONE_NUMBER "+TWILIO_PHONE_NUMBER);
  // console.log("ALERT_PHONE_NUMBER "+ALERT_PHONE_NUMBER);

  if ( sender == SERVICE_PHONE || sender == ALERT_PHONE_NUMBER ) {
    if ( recvdBy == TWILIO_PHONE_NUMBER) {
      // we have a valid message
      logSender.log(message, true);

    } else {
      return logSender.log("Error: message received via unknown number", true);
    }
  } else {
    return logSender.log("Error: message triggered from unknown number", true);
  }

};
