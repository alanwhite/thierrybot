const IG = require('./IG.js');
const async = require('async');

const ig = new IG(process.env.IGKEY,process.env.IGUSER,process.env.IGPASS,true);


function getAllOrders(callback) {
  ig.workingOrders((err,data) => {
    if ( err ) {
      console.error(err);
      return callback(err,data);
    }

    callback(err,data);
  });
};

function cancelOrder(dealId, callback) {
  ig.deleteOrder(dealId, (err,data) => {
    callback(err,data);
  });
};

function cancelAllOrders(callback) {
  getAllOrders((err,data) => {
    if ( err ) {
      console.error("Error retrieving working orders: "+err);
      return callback(err,data);
    }

    var orderList = data.workingOrders;
    async.each( orderList, function(order, callback) {
      console.log("Deal ID: "+order.workingOrderData.dealId+
                  ", Epic: "+order.workingOrderData.epic);
      cancelOrder(order.workingOrderData.dealId, (err, data) => {
        if ( err )
          callback(err);
        else {
          console.log("Order "+data.dealReference+" cancelled");
          ig.confirms(data.dealReference, (err,data) => {
            if ( err )
              callback(err);
            else {
              console.log("Confirm "+data.dealId+" dealStatus "+data.dealStatus+" status "+data.status);
              callback();
            }
          });
        }
      });
    }, function(err){
      if ( err )
        console.log("Error produced "+err);
      else {
        console.log("All orders cancelled");
        callback();
      }
    });
  });
};

async.waterfall([

  // first log in to IG
  function(callback) {
    console.log("Logging in to IG ...");
    ig.login((err,data) => {
      if ( err )
        callback(err);
      else {
        console.log("Logged in successfully, account balance is £"+data.accountInfo.balance);
        callback();
      }
    });
  },

  // then get the current FTSE price
  function(callback) {
    console.log("Obtaining current FTSE 100 price");
    ig.markets("IX.D.FTSE.DAILY.IP", (err,data) => {
      if ( err )
        callback(err);
      else {
        console.log("Current FTSE 100 Daily price is "+data.snapshot.bid);
        callback(err,data.snapshot.bid);
      }
    });
  },

  // then place a sell order 100 points above
  function(price, callback) {
    console.log("Placing sell order at "+(price+100));
    var options = {
      epic: "IX.D.FTSE.DAILY.IP",
      expiry: "DFB",
      direction: "SELL",
      size: 2,
      level: price+100,
      type: "LIMIT",
      currencyCode: "GBP",
      timeInForce: "GOOD_TILL_CANCELLED",
      guaranteedStop: "false",
      stopDistance: 100,
      limitDistance: 100
    };

    ig.createOrder(options,(err,data) => {
      if ( err ) {
        callback(err);
      } else {
        dealReference = data.dealReference;
        console.log("Order created with reference "+data.dealReference);
        callback(err, data.dealReference);
      }
    });
  },

  // then check the confirm for the order
  function(dealReference, callback) {
    ig.confirms(dealReference, (err,data) => {
      if ( err ) {
        console.error("Confirms fails: "+err);
        callback(err);
      } else {
        console.log("Confirm "+data.dealId+" dealStatus "+data.dealStatus+" status "+data.status);
        callback(); // not passing anything to next stage
      }
    });
  },

  // as it says ...
  cancelAllOrders,

  // then logout
  function(callback) {
    ig.logout((err,data) => {
      if ( err && err != 204 ) {
        console.error("Logout "+err);
        callback(err);
      } else {
        console.log("Logged out OK");
        callback(null);
      }
    });
  }

], (err, result) => {
  if ( err ) {
    console.error("Error "+err);
  } else {
    // console.log("Results "+result);
  }
});
