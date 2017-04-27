const AWS = require('aws-sdk');
const LOG_EVENT = process.env.LOG_EVENT;

class LogSender {
  constructor() {
    this.sns = new AWS.SNS({region:'eu-west-1'});
  }

  // construct event with message and publish via SNS
  log(message, sms) {

    const eventBody = {
      time: new Date().toUTCString(),
      escalate: "no",
      body: message
    };

    if ( sms ) {
      if ( sms === true ) {
        eventBody.escalate = "sms";
      }
    }

    const params = {
      Message: JSON.stringify(eventBody),
      TopicArn: 'arn:aws:sns:eu-west-1:248211596106:'+LOG_EVENT, // yeah TODO: find a way to obtain aws id
    };

    this.sns.publish(params, function(error) {
      if (error) {
        console.log(error);
      }
    });

  }
}

module.exports = LogSender;
