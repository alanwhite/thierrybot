const IG = require("./IG.js");
const async = require("async");
const LogSender = require('./LogSender.js');
const logSender = new LogSender();

const IG_API_KEY = process.env.IG_API_KEY;
const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

class PositionManager {
  constructor() {
    this.ig = new IG(process.env.IGKEY,process.env.IGUSER,process.env.IGPASS);
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

    async.each( tradeMessages, (tradeMessage, callback) => {
      switch(tradeMessage.instruction) {
        case 'amend':
          this.amendPosition(tradeMessage, callback);
          break;
        case 'close':
          this.closePosition(tradeMessage, callback);
          break;
        default:
          logSender.log("Error: unknown position instruction", true);
          callback(new Error("unknown position instruction"));
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

  amendPosition(tradeMessage, callback) {
    console.log("Amending order ...");
    this.findPosition(tradeMessage, (err, data ) => {
      if ( err ) {
        console.log("error finding position to amend");
        return callback( err );
      }

      if ( !data ) {
        // no position found to close
        logSender.log("Error: no position found to amend", true);
        return callback( new Error("no position to amend"));
      }

      var options = {
        trailingStop: false,
        stopLevel: tradeMessage.stopPrice,
        limitLevel: tradeMessage.limitPrice
      };

      this.ig.amendPosition(data.dealId, options,(err,data) => {
        if ( err ) {
          callback(err);
        } else {
          console.log("Position amended with reference "+data.dealReference);
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

  closePosition(tradeMessage, callback) {
    console.log("Closing position ...");
    this.findPosition(tradeMessage, (err, data ) => {
      console.log("back from finding position(s)");
      if ( err ) {
        return callback( err );
      }

      if ( !data ) {
        // no position found to close
        logSender.log("Error: no position found to close", true);
        return callback( new Error("no position to close"));
      }

      console.log("attempting to close");
      this.ig.closePosition(data, (err, data) => {
        if ( err ) {
          console.log(data);
          callback(err);
        } else {
          console.log("Position "+data.dealReference+" closed");
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
  findPosition(tradeMessage, callback) {
    this.ig.positions((err,data) => {
      if ( err ) {
        console.log("error getting list of open positions");
        console.error(err);
        return callback(err,data);
      }

      var positionList = data.positions;
      const listLength = positionList.length;
      console.log(positionList);
      for ( var i=0; i<listLength; i++ ) {
        if ( tradeMessage.direction.toUpperCase() == positionList[i].position.direction &&
              tradeMessage.instrument == positionList[i].position.epic ) {
          console.log("Found "+positionList[i].position.dealId);
          var returnValue = {
            dealId: positionList[i].position.dealId,
            size: positionList[i].position.size,
            direction: positionList[i].position.direction,
            orderType: "MARKET"
          };
          return callback(null,returnValue);
        }
      }
      callback(null,null);
    });
  }
}

module.exports = PositionManager;
