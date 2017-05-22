const async = require("async");

const OrderManager = require("../functions/OrderManager.js");
const om = new OrderManager();

const PositionManager = require("../functions/PositionManager.js");
const pm = new PositionManager();

const TradeMessage = require("../functions/TradeMessage.js");

var sellMsg = new TradeMessage();
sellMsg.instruction = "create";
sellMsg.entity = "order";
sellMsg.direction = "sell";
sellMsg.atPrice = 7500;
sellMsg.stopPrice = 7600;
sellMsg.limitPrice = 7200;
sellMsg.confidence = "70%";

var amendMsg = new TradeMessage();
amendMsg.instruction = "amend";
amendMsg.entity = "order";
amendMsg.direction = "sell";
amendMsg.atPrice = 7700;
amendMsg.stopPrice = 7800;
amendMsg.limitPrice = 7300;

var cancelMsg = new TradeMessage();
cancelMsg.instruction = "cancel";
cancelMsg.entity = "order";
cancelMsg.direction = "sell";
cancelMsg.atPrice = 7700;

// mind and open a short position before doing this
var cancelPosn = new TradeMessage();
cancelPosn.instruction = "close";
cancelPosn.entity = "position";
cancelPosn.direction = "sell";
cancelPosn.atPrice = 7700;

async.series([
  function(callback) {
    var test1 = [ sellMsg ];
    console.log("\nlaunching initial sell order creation test\n");
    om.processMessage(test1, callback);
  },
  function(callback) {
    var test2 = [ amendMsg ];
    console.log("\nlaunching amend sell order test\n");
    om.processMessage(test2, callback);
  },
  function(callback) {
    var test3 = [ cancelMsg ];
    console.log("\nlaunching cancel sell order test\n");
    om.processMessage(test3, callback);
  },
  function(callback) {
    var test4 = [ sellMsg ];
    console.log("\nlaunching second sell order creation test\n");
    om.processMessage(test4, callback);
  },
  function(callback) {
    var test5 = [ cancelMsg, sellMsg ];
    console.log("\nlaunching cancel sell order & replace test\n");
    om.processMessage(test5, callback);
  },
  function(callback) {
    var test3 = [ cancelMsg ];
    console.log("\nlaunching cancel sell order test (cleanup)\n");
    om.processMessage(test3, callback);
  },
  function(callback) {
    var test6 = [ cancelPosn ];
    console.log("\nlaunching close position test\n");
    pm.processMessage(test6, callback);
  }
], (err, result) => {
  console.log(err);
  console.log(result);
});
