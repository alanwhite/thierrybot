const qs = require('qs');
const TradeMessage = require('./TradeMessage.js');
const LogSender = require('./LogSender.js');
const logSender = new LogSender();

const SERVICE_PHONE = process.env.SERVICE_PHONE;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ALERT_PHONE_NUMBER = process.env.ALERT_PHONE_NUMBER;
const ORDER_EVENT = process.env.ORDER_EVENT;
const POSITION_EVENT = process.env.POSITION_EVENT;

module.exports.post = (event, context, callback) => {

  //Return 200 to Twilio
  callback(null, {
      statusCode: '204' // No content
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

  if ( !(sender == SERVICE_PHONE || sender == ALERT_PHONE_NUMBER) ) {
    return logSender.log("Error: message triggered from unknown number", true);
  }

  if ( recvdBy != TWILIO_PHONE_NUMBER) {
    return logSender.log("Error: message received via unknown number", true);
  }
    // we have a valid message
  logSender.log(message, true);

  var tradeMessages = TradeMessage.parse(message);
  if ( !Array.isArray(tradeMessages) || tradeMessages.length < 1 ) {
    return logSender.log("Error: cannot understand text message", true);
  }

  // send an event for each directive in the message
  const sns = new AWS.SNS({region:'eu-west-1'});
  for ( var i=0; i < tradeMessages.length; i++ ) {

    const eventBody = {
      time: new Date().toUTCString(),
      escalate: "no",
      body: tradeMessages[i]
    };

    const event = tradeMessages[i].entity = 'order' ? ORDER_EVENT : POSITION_EVENT;
    const params = {
      Message: JSON.stringify(eventBody),
      TopicArn: 'arn:aws:sns:eu-west-1:248211596106:'+event, // yeah TODO: find a way to obtain aws id
    };

    sns.publish(params, (error) => {
      if (error) {
        return logSender.log("Error: cannot send SNS notification "+error, true);
      }
    });
  }

};
