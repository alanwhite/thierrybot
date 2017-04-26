const AWS = require('aws-sdk');
const ACTIVITY_LOG = process.env.ACTIVITY_LOG;

class LogManager {
  constructor() {
    this.simpledb = new AWS.SimpleDB();
  }

  logMessage(message) {
    this.createActivityLogEntry(message, (error) => {});
    if ( message.escalate == "sms") {
      this.sendSMS(message.time + "; " + message.body);
    }
  }

  sendSMS(message) {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    const notifyPhoneNumber = process.env.ALERT_PHONE_NUMBER;
    const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken);

    const sms = {
      to: notifyPhoneNumber,
      body: message,
      from: twilioPhoneNumber,
    };

    twilioClient.messages.create(sms, (error, data) => {
      if ( error ) {
        console.log('error sending sms '+error);
      }
    });
  }

  // logs received message to the activity log database
  createActivityLogEntry(message, callback) {
    var params = {
      DomainName: ACTIVITY_LOG,
      ItemName: message.time,
      Attributes: [
      {
        Name: 'log',
        Value: message.body, /* required */
        Replace: false
      }]
    };

    this.simpledb.putAttributes(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        return callback(err);
      }

      console.log(data);
      return callback(null);
    });
  }

}

module.exports = LogManager;
