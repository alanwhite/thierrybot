const IG = require("./IG.js");
const async = require("async");
const LogSender = require('./LogSender.js');
const logSender = new LogSender();

const IG_API_KEY = process.env.IG_API_KEY;
const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

class OrderManager {
  constructor() {
    this.ig = new IG(process.env.IG_API_KEY,process.env.IG_USERNAME,process.env.IG_PASSWORD);
    console.log("Order Manager IG Object: ");
    console.log(this.ig);
  }

  processMessage(tradeMessages, mainCallback) {
    // const ig = this.ig;

    async.series([
      // first log in
      (callback) => {
        console.log("Logging in ...");
        this.ig.login((err,data) => {
          if ( err )
            callback(err);
          else {
            callback(null);
          }
        });
      },

      // completely execute each instruction in the sequence provided
      (callback) => {
        console.log("Executing instructions ...");
        this.executeInstructions(tradeMessages,callback);
      },

      // then logoff
      (callback) => {
        console.log("Logging out ...");
        this.ig.logout((err,data) => {
          if ( err && err != 204 ) {
            callback(err);
          } else {
            callback(null);
          }
        });
      }

    ], (err, result) => {
      if ( err ) {
        console.error("Error "+err);
        mainCallback(err);
      } else {
        mainCallback(err, result);
      }
    });

  }

  executeInstructions(tradeMessages, cb) {

    const message = JSON.parse(tradeMessages);
    const body = JSON.parse(message.body);

    async.each( body, (tradeMessage, callback) => {
      console.log(tradeMessage);
      switch(tradeMessage.instruction) {
        case 'create':
          this.createOrder(tradeMessage, callback);
          break;
        case 'amend':
          this.amendOrder(tradeMessage, callback);
          break;
        case 'cancel':
          this.cancelOrder(tradeMessage, callback);
          break;
        default:
          // logSender.log("Error: unknown order instruction", true);
          callback(new Error("unknown order instruction"));
      }

    }, function(err) {
      if ( err ) {
        console.log(err);
        logSender.log("Error executing instructions at IG", true);
        cb(err);
      } else {
        cb(null);
      }
    });

  }

  createOrder(tradeMessage, cb) {
    console.log("Creating order ...");
    const direction = tradeMessage.direction.toUpperCase();
    const tradeSize = tradeMessage.confidence == "70%" ? 10 : 3;

    async.waterfall([
      // create order
      (callback) => {
        var options = {
          epic: "IX.D.FTSE.DAILY.IP",
          expiry: "DFB",
          direction: direction,
          size: tradeSize,
          level: tradeMessage.atPrice,
          type: "LIMIT",
          currencyCode: "GBP",
          timeInForce: "GOOD_TILL_CANCELLED",
          guaranteedStop: "false",
          stopLevel: tradeMessage.stopPrice,
          limitLevel: tradeMessage.limitPrice
        };

        this.ig.createOrder(options,(err,data) => {
          if ( err ) {
            console.log("Error in ig.createOrder "+data[0]);
            callback(err);
          } else {
            console.log("Order created with reference "+data.dealReference);
            callback(err, data.dealReference);
          }
        });

      },
      // check confirm
      (dealReference, callback) => {
        this.ig.confirms(dealReference, (err,data) => {
          if ( err ) {
            console.error("Confirms fails: "+err);
            callback(err);
          } else {
            console.log("Confirm "+data.dealId+" dealStatus "+data.dealStatus+" status "+data.status);
            callback(); // not passing anything to next stage
          }
        });
      }
    ], (err, result) => {
      if ( err ) {
        console.error("Error "+err);
        cb(err);
      } else {
        cb();
      }
    } );

  }

  amendOrder(tradeMessage, callback) {
    console.log("Amending order ...");
    this.findOrder(tradeMessage, (err, data ) => {
      if ( err ) {
        console.log("error finding order");
        return callback( err );
      }

      var options = {
        level: tradeMessage.atPrice,
        type: "LIMIT",
        timeInForce: "GOOD_TILL_CANCELLED",
        stopLevel: tradeMessage.stopPrice,
        limitLevel: tradeMessage.limitPrice
      };

      this.ig.amendOrder(data, options,(err,data) => {
        if ( err ) {
          callback(err);
        } else {
          console.log("Order amended with reference "+data.dealReference);
          this.ig.confirms(data.dealReference, (err,data) => {
            if ( err ) {
              console.error("Confirms fails: "+err);
              callback(err);
            } else {
              console.log("Confirm "+data.dealId+" dealStatus "+data.dealStatus+" status "+data.status);
              callback();
            }
          });
        }
      });
    });
  }

  cancelOrder(tradeMessage, callback) {
    console.log("Cancelling order ...");
    this.findOrder(tradeMessage, (err, data ) => {
      if ( err ) {
        return callback( err );
      }

      this.ig.deleteOrder(data, (err, data) => {
        if ( err )
          callback(err);
        else {
          console.log("Order "+data.dealReference+" cancelled");
          this.ig.confirms(data.dealReference, (err,data) => {
            if ( err )
              callback(err);
            else {
              console.log("Confirm "+data.dealId+" dealStatus "+data.dealStatus+" status "+data.status);
              callback();
            }
          });
        }
      });
    });
  }

  // return first dealId that matches a given tradeMessage,
  // only matches epic and direction as tradeMessage may contain new values for prices
  findOrder(tradeMessage, callback) {
    this.ig.workingOrders((err,data) => {
      if ( err ) {
        console.log("error getting list of working orders");
        console.error(err);
        return callback(err,data);
      }

      var orderList = data.workingOrders;
      const listLength = orderList.length;
      for ( var i=0; i<listLength; i++ ) {
        if ( tradeMessage.direction.toUpperCase() == orderList[i].workingOrderData.direction &&
              tradeMessage.instrument == orderList[i].workingOrderData.epic ) {
          console.log("Found "+orderList[i].workingOrderData.dealId);
          return callback(null,orderList[i].workingOrderData.dealId);
        }
      }
      callback(err,null);
    });
  }
}

module.exports = OrderManager;
