const OrderManager = require("./OrderManager.js");

// wrap aws pub/sub SNS event receiver
module.exports.notify = (event) => {
  const msg = event.Records[0].Sns.Message;
  console.log(msg);

  const om = new OrderManager();
  om.processMessage(msg, (err,data) => {});

};
