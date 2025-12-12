const TIP712 = artifacts.require('./TIP712.sol');

module.exports = function (deployer) {
  deployer.deploy(TIP712);
};
