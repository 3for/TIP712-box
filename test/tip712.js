const wait = require('./helpers/wait');
const chalk = require('chalk');
const TIP712 = artifacts.require('./TIP712.sol');

// The following tests require TronBox >= 4.1.x
// and Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart)

contract('TIP712', function (accounts) {
  before(async function () {
    TIP712Sign = await TIP712.deployed();
    if (accounts.length < 3) {
      // Set your own accounts if you are not using Tron Quickstart
    }
  });

  it('should verify that there are at least three available accounts', async function () {
    if (accounts.length < 3) {
      console.log(
        chalk.blue(
          '\nYOUR ATTENTION, PLEASE.]\nTo test TIP712 you should use Tron Quickstart (https://github.com/tronprotocol/docker-tron-quickstart) as your private network.\nAlternatively, you must set your own accounts in the "before" statement in "test/tip712.js".\n'
        )
      );
    }
    assert.isTrue(accounts.length >= 3);
  });
});
