const PositionManager = require("./PositionManager.js");

// wrap aws pub/sub SNS event receiver
module.exports.notify = (event) => {
  const msg = event.Records[0].Sns.Message;
  console.log(msg);

  const pm = new PositionManager();
  pm.processMessage(msg, (err,data) => {});

};
