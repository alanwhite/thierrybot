var expect = require("chai").expect;
var TradeMessage = require("../functions/TradeMessage.js");

describe("Trade Message", () => {
  it("converts the SMS text to close a short position to a structured object", () => {
    var directives = TradeMessage.parse("15:59 intraday alert. Close short on FTSE 100 cash (7335)");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('close');
    expect(directives[0].entity).to.equal('position');
    expect(directives[0].atPrice).to.equal(7335);
  });

  it("idenitifies non-numeric number in the SMS text", () => {
    var directives = TradeMessage.parse("15:59 intraday alert. Close short on FTSE 100 cash (YUGH)");
    expect(directives).not.to.be.an('array');
    // expect(directives.length).to.equal(1);
    // expect(directives[0].instruction).to.equal('close');
    // expect(directives[0].entity).to.equal('position');
    // expect(directives[0].atPrice).to.equal(7335);
  });

  it("converts the SMS text to close a long position to a structured object", () => {
    var directives = TradeMessage.parse("09:39 intraday alert. Close long on FTSE 100 cash (7283)");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('close');
    expect(directives[0].entity).to.equal('position');
    expect(directives[0].atPrice).to.equal(7283);
  });

  it("converts the SMS text to open a buy order to a structured object", () => {
    var directives = TradeMessage.parse("08:15 intraday alert. We buy FTSE 100 cash at 7285, target 7350, stop loss 7245, confidence 70%");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('create');
    expect(directives[0].entity).to.equal('order');
    expect(directives[0].direction).to.equal('buy');
    expect(directives[0].atPrice).to.equal(7285);
  });

  it("converts the SMS text to open a sell order to a structured object", () => {
    var directives = TradeMessage.parse("08:09 intraday alert. We sell FTSE 100 cash at 7390, target 7320, stop loss 7430, confidence 60%");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('create');
    expect(directives[0].entity).to.equal('order');
    expect(directives[0].direction).to.equal('sell');
    expect(directives[0].atPrice).to.equal(7390);
  });

  it("converts the SMS text to cancel a buy order to a structured object", () => {
    var directives = TradeMessage.parse("17:52 intraday alert. Cancel order to buy FTSE 100 cash at 7100");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('cancel');
    expect(directives[0].entity).to.equal('order');
    expect(directives[0].direction).to.equal('buy');
    expect(directives[0].atPrice).to.equal(7100);
  });

  it("converts the SMS text to amend a sell order to a structured object", () => {
    var directives = TradeMessage.parse("08:09 intraday alert. Move limit order to sell FTSE 100 cash to 7325, target 7260, stop loss 7365, confidence 60%");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('amend');
    expect(directives[0].entity).to.equal('order');
    expect(directives[0].direction).to.equal('sell');
    expect(directives[0].atPrice).to.equal(7325);
  });

  it("converts the SMS text to amend a buy position to a structured object", () => {
    var directives = TradeMessage.parse("08:13 intraday alert. We remain long on FTSE 100 cash, target 7400, stop loss 7330");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('amend');
    expect(directives[0].entity).to.equal('position');
    expect(directives[0].direction).to.equal('buy');
    expect(directives[0].stopPrice).to.equal(7330);
    expect(directives[0].limitPrice).to.equal(7400);
  });

  it("converts the SMS text to amend a position to a structured object", () => {
    var directives = TradeMessage.parse("12:42 intraday alert. Move stop loss to 7265 on FTSE 100 cash, target 7330");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(1);
    expect(directives[0].instruction).to.equal('amend');
    expect(directives[0].entity).to.equal('position');
    expect(directives[0].stopPrice).to.equal(7265);
    expect(directives[0].limitPrice).to.equal(7330);
  });

  it("converts the SMS text with multiple instructions to an of structured objects", () => {
    var directives = TradeMessage.parse("10:38 intraday alert. Cancel order to sell at 7390. We buy FTSE 100 cash at 7355, target 7415, stop loss 7315, confidence 70%");
    expect(directives).to.be.an('array');
    expect(directives.length).to.equal(2);
    expect(directives[0].instruction).to.equal('cancel');
    expect(directives[0].entity).to.equal('order');
    expect(directives[0].direction).to.equal('sell');
    expect(directives[0].atPrice).to.equal(7390);
    expect(directives[1].instruction).to.equal('create');
    expect(directives[1].entity).to.equal('order');
    expect(directives[1].direction).to.equal('buy');
    expect(directives[1].atPrice).to.equal(7355);
  });


});
