const qs = require('qs');
const AWS = require('aws-sdk');
const twilio = require('twilio');
const TradeMessage = require('./TradeMessage.js');
const LogSender = require('./LogSender.js');
const logSender = new LogSender();

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_PHONE = process.env.SERVICE_PHONE;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ALERT_PHONE_NUMBER = process.env.ALERT_PHONE_NUMBER;
const ORDER_EVENT = process.env.ORDER_EVENT;
const POSITION_EVENT = process.env.POSITION_EVENT;

module.exports.post = (event, context, callback) => {

  //Return 204 to Twilio
  callback(null, {
      statusCode: '204' // No content
  });

  logSender.log(event.body);

  console.log(event.headers);

  var data = qs.parse(event.body);
  var signature = event.headers['X-Twilio-Signature'];
  if ( !signature ) {
    return logSender.log("Error: No Twilio signature in SMS request");
  }

  // var token = TWILIO_AUTH_TOKEN;

  if ( !twilio.validateRequest(TWILIO_AUTH_TOKEN,
          signature, 'https://96l8kgny31.execute-api.eu-west-1.amazonaws.com/dev/sms', data)) {
    return logSender.log("Error: fake Twilio SMS request received");
  }
  console.log("validation complete");

  const recvdBy = data['To'];
  const sender = data['From'];
  const message = data['Body'];
  const valid_senders = SERVICE_PHONE.split(",");

  // 2017-05-24: sometimes the senders phone number includes 44 other times not, moved
  //             secrets entry to be an array of valid senders
  // if ( !(sender == SERVICE_PHONE || sender == ALERT_PHONE_NUMBER) ) {
  //   return logSender.log("Error: message triggered from unknown number", true);
  // }

  if ( !valid_senders.includes(sender) ) {
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

  console.log("Trade Messages Constructed: "+tradeMessages);
  // I hate javascript
  function pubCallback(error) {
    if (error) {
      return logSender.log("Error: cannot send SNS notification "+error, true);
    }
  }
  // send an event for each directive in the message
  const sns = new AWS.SNS({region:'eu-west-1'});

  // condense into a single event with multiple instructions for each entity type
  var orderMessages = [];
  var positionMessages = [];

  for ( var i=0; i < tradeMessages.length; i++ ) {
    if ( tradeMessages[i].entity == 'order' ) {
      orderMessages.push(tradeMessages[i]);
    } else if ( tradeMessages[i].entity == 'position' ) {
      positionMessages.push(tradeMessages[i]);
    } else {
      return logSender.log("Error: unknown entity type in parsed SMS", true);
    }
  }

  if ( orderMessages.length > 0 ) {
    console.log("Sending Order Messages: "+orderMessages);
    const eventBody = {
      time: new Date().toUTCString(),
      escalate: "no",
      body: JSON.stringify(orderMessages)
    };

    const event = ORDER_EVENT;
    const params = {
      Message: JSON.stringify(eventBody),
      TopicArn: 'arn:aws:sns:eu-west-1:248211596106:'+event, // yeah TODO: find a way to obtain aws id
    };

    sns.publish(params, pubCallback);
  }

  if ( positionMessages.length > 0 ) {
    console.log("Sending Position Messages: "+positionMessages);
    const eventBody = {
      time: new Date().toUTCString(),
      escalate: "no",
      body: JSON.stringify(positionMessages)
    };

    const event = POSITION_EVENT;
    const params = {
      Message: JSON.stringify(eventBody),
      TopicArn: 'arn:aws:sns:eu-west-1:248211596106:'+event, // yeah TODO: find a way to obtain aws id
    };

    sns.publish(params, pubCallback);
  }

};
