const IG_API_KEY = process.env.IG_API_KEY;
const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

class PositionManager {
  constructor() {

  }

  executeDirective(tradeMessage) {
    switch(tradeMessage.instruction) {
      case 'amend':
        return amendPosition(tradeMessage);
        break;
      case 'close':
        return closePosition(tradeMessage);
        break;
      default:
        return logSender.log("Error: unknown position instruction", true);
    }
  }

  amendPosition(tradeMessage) {

  }

  closePosition(tradeMessage) {

  }

  findPosition(tradeMessage) {
    
  }

}

module.exports = PositionManager;
