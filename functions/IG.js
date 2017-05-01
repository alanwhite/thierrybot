// reworked from an older version of https://github.com/schopenhauer/ig-markets
// which was published via npm. Current version requires ES7 - too new for the world
// and I couldn't get babel to do a good job

// bugs removed from original code:
//  login doesn't work, credentials needed to be JSON stringified
//  post-login didn't work bad this reference with returned tokens - restructured
//  demo_api was declared but no way to use it without changing the code
//  logout didn't work as delete method not defined
//

var rest = require('restler');

const API = 'https://api.ig.com/gateway/deal/';
const DEMO_API = 'https://demo-api.ig.com/gateway/deal/';


/**
 * Constructor
 *
 * @param {string} key - Your IG Markets account key.
 * @param {string} identifier - Your IG Markets username.
 * @param {string} password - Your IG Markets password.
 */

class IG {
  constructor(key, identifier, password, demo) {
    this.key = key;
    this.identifier = identifier;
    this.password = password;
    this.token = '';
    this.cst = '';
    this.ighost = API;
    if ( demo )
      this.ighost = DEMO_API;
  };

  /**
   * Make a HTTP(S) request.
   *
   * @param {string} method - The HTTP method used.
   * @param {string} action - The action path appended to URL.
   * @param {string} data - The data passed to HTTP request.
   * @param {integer} version - The version number passed to header.
   * @param {callback} callback - The callback parameter.
   */

   _request(method, action, data, version, callback) {
     const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json; charset=UTF-8',
        'Version': 2,
        'X-IG-API-KEY': this.key,
        'X-SECURITY-TOKEN': this.token,
        'CST': this.cst
    };

    headers['Version'] = version;
    const url = this.ighost + action;

    switch (method) {
      case 'post':
        rest.postJson(url, data, {headers: headers}).on('complete', function (data, res) {
          callback(null, data);
        });
        break;

      case 'get':
        rest.json(url, data, {headers: headers}).on('complete', function (data, res) {
          callback(null, data);
        });
        break;

      case 'delete':
        rest.del(url, data, {headers: headers}).on('complete', function (data, res) {
          callback(null, data);
        });
        break;

      default:
        return callback(new Error('Error: HTTP method not defined, please review API call'));
    }
  };

  /**
   * Account
   *
  */

  // Creates a trading session, obtaining session tokens for subsequent API access
  login(callback) {
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json; charset=UTF-8',
      'Version': 1,
      'X-IG-API-KEY': this.key
    };

    const credentials = {
      'identifier': this.identifier,
      'password': this.password
    };

    rest.postJson(this.ighost + 'session', credentials, {headers: headers}).on('complete', (data, res) => {
      this.cst = res.headers['cst'];
      this.token = res.headers['x-security-token'];
      callback(null,data);
    });

  };

  // Creates a trading session, obtaining session tokens for subsequent API access
  sessionEncryptionKey(callback) {
    this._request('post', 'session/encryptionKey', null, 1, callback);
  };

  // Log out of the current session
  logout(callback) {
    this._request('delete', 'session', null, 1, callback);
  };

  // Returns a list of accounts belonging to the logged-in client
  accounts(callback) {
    this._request('get', 'accounts', null, 1, callback);
  };

  // Returns the account activity history.
  accountHistory(callback) {
    this._request('get', 'history/activity', null, 3, callback);
  };

  // Returns the transaction history. By default returns the minute prices within the last 10 minutes.
  accountTransactions(callback) {
    this._request('get', 'history/transactions', null, 2, callback);
  };

  /**
   * Dealing
   *
   */

  // Returns all open positions for the active account.
  positions(callback) {
    this._request('get', 'positions', null, 2, callback);
  };

  // Returns all open sprint market positions for the active account.
  positionsSprintMarkets(callback) {
    this._request('get', 'positions/sprintmarkets', null, 2, callback);
  };

  // Returns all open working orders for the active account.
  workingOrders(callback) {
    this._request('get', 'workingorders', null, 2, callback);
  };

  /**
   * Markets
   *
   */

  // Returns all markets matching the search term.
  findMarkets(keyword, callback) {
    this._request('get', 'markets?searchTerm=' + keyword, null, 1, callback);
  };

  // Returns historical prices for a particular instrument.
  // By default returns the minute prices within the last 10 minutes.
  prices(epic, callback) {
    this._request('get', 'prices/' + epic, null, 3, callback);
  };

  /**
   * Watchlists
   *
   */

  // Returns all watchlists belonging to the active account.
  watchlists(callback) {
    this._request('get', 'watchlists', null, 1, callback);
  };

}

module.exports = IG;
