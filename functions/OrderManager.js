const IG_API_KEY = process.env.IG_API_KEY;
const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

class OrderManager {
  constructor() {

  }

  executeDirective(tradeMessage) {
    switch(tradeMessage.instruction) {
      case 'create':
        return createOrder(tradeMessage);
        break;
      case 'amend':
        return amendOrder(tradeMessage);
        break;
      case 'cancel':
        return cancelOrder(tradeMessage);
        break;
      default:
        return logSender.log("Error: unknown order instruction", true);
    }

  }

  createOrder(tradeMessage) {
    return;
  }

  amendOrder(tradeMessage) {
    return;
  }

  cancelOrder(tradeMessage) {
    return;
  }

  findOrder(tradeMessage) {
    return;
  }
}

module.exports = OrderManager;
