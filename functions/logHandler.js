const LogManager = require('./LogManager.js');
const logManager = new LogManager();

// wrap aws pub/sub SNS event receiver
module.exports.notify = (event) => {
  const msg = event.Records[0].Sns.Message;

  const message = JSON.parse(msg);
  console.log(message.time + "; " + message.body);

  logManager.logMessage(message);


};
