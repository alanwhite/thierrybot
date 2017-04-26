
// wrap aws pub/sub SNS event receiver
module.exports.notifyPurchase = (event) => {
  const msg = event.Records[0].Sns.Message;

  console.log(msg.time + "; " + msg.body);



};
