

class ConfirmThierry {

  sendSMS(message) {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = '+447481337667';
    const notifyPhoneNumber = '+447921098947';
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

}

module.exports = ConfirmThierry;
