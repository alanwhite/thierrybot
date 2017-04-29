class TradeMessage {
  constructor() {
    this.serial = 0;
    this.instruction = "none";
    this.entity = "none";
    this.direction = "none";
    this.instrument = "IX.D.FTSE.DAILY.IP";
    this.atPrice = 0;
    this.limitPrice = 0;
    this.stopPrice = 0;
    this.confidence = 0;
  }

  // parses plain text instruction and returns a TradeMessage if valid, else null
  static parse(text) {
    var tradeMessages = [];

    if ( typeof text != 'string' ) {
      console.log("Error parsing text: no string supplied");
      return;
    }

    var sentences = text.split(".");
    if ( sentences.length < 2 ) {
      console.log("Error parsing text: incorrect number of sentences");
      return;
    }

    var header = sentences[0].split(" ");
    if ( header.length != 3 ) {
      console.log("Error parsing text: invalid header");
      return;
    }

    if ( header[1] != 'intraday' || header[2] != 'alert') {
      console.log("Error parsing text: not an intraday alert");
      return;
    }

    for ( var i = 1; i < sentences.length; i++ ) {
      const tradeMessage = new TradeMessage();

      const words = sentences[i].split(/[ ,()]+/).filter(Boolean);

      // console.log(sentences[i]);
      // console.log(words);

      switch(words[0]) {

        case 'We':
          switch(words[1]) {
            case 'buy':
              tradeMessage.instruction = 'create';
              tradeMessage.entity = 'order';
              tradeMessage.direction = 'buy';
              tradeMessage.atPrice = Number(words[6]);
              tradeMessage.limitPrice = Number(words[8]);
              tradeMessage.stopPrice = Number(words[11]);
              tradeMessage.confidence = words[13];
              tradeMessages.push(tradeMessage);
              break;
            case 'sell':
              tradeMessage.instruction = 'create';
              tradeMessage.entity = 'order';
              tradeMessage.direction = 'sell';
              tradeMessage.atPrice = Number(words[6]);
              tradeMessage.limitPrice = Number(words[8]);
              tradeMessage.stopPrice = Number(words[11]);
              tradeMessage.confidence = words[13];
              tradeMessages.push(tradeMessage);
              break;
            case 'remain':
              tradeMessage.instruction = 'amend';
              tradeMessage.entity = 'position';
              tradeMessage.direction = words[2] == 'long' ? 'buy' : 'sell';
              tradeMessage.limitPrice = Number(words[8]);
              tradeMessage.stopPrice = Number(words[11]);
              // console.log(words);
              tradeMessages.push(tradeMessage);
              break;
            default:
              console.log("Error parsing instruction: invalid verb after 'We'");
              return;
          }
          break;

        case 'Cancel':
          tradeMessage.instruction = 'cancel';
          tradeMessage.entity = 'order';
          tradeMessage.direction = words[3];
          tradeMessage.atPrice = words[4] == 'FTSE' ? Number(words[8]) : Number(words[5]);
          tradeMessages.push(tradeMessage);
          break;

        case 'Move':
          if ( words[1] == 'limit' ) {
            tradeMessage.instruction = 'amend';
            tradeMessage.entity = 'order';
            tradeMessage.direction = words[4];
            tradeMessage.atPrice = Number(words[9]);
            tradeMessage.limitPrice = Number(words[11]);
            tradeMessage.stopPrice = Number(words[14]);
            tradeMessage.confidence = words[16];
            tradeMessages.push(tradeMessage);
          } else if ( words[1] == 'stop') {
            tradeMessage.instruction = 'amend';
            tradeMessage.entity = 'position';
            tradeMessage.limitPrice = Number(words[10]);
            tradeMessage.stopPrice = Number(words[4]);
            tradeMessages.push(tradeMessage);
          } else {
            console.log("Error parsing instruction: invalid subject after 'Move'");
            return;
          }
          break;

        case 'Close':
          tradeMessage.instruction = 'close';
          tradeMessage.entity = 'position';
          tradeMessage.direction = words[1] == 'long' ? 'buy' : 'sell';
          tradeMessage.atPrice = Number(words[6]);
          tradeMessages.push(tradeMessage);
          break;

        default:
          console.log("Error parsing instruction: invalid word 1");
          return;
      }

      // validate entries
      if (
        isNaN(tradeMessage.atPrice) ||
        isNaN(tradeMessage.limitPrice) ||
        isNaN(tradeMessage.stopPrice) ) {
          console.log("Error parsing instruction: non-numeric price");
          return;
      }

      tradeMessage.serial = Date.now();
    }

    return tradeMessages;
  }
}

module.exports = TradeMessage;
