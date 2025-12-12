var fs = require('fs')
var path = require('path')
var TIP712 = require('../build/contracts/TIP712')

const tronboxConfig = require('../tronbox').networks;

// Auto detect current network (from TronBox CLI or user-defined env)
const currentNetwork = process.env.TRON_NETWORK || 'nile';

// Load network config dynamically
const netConf = tronboxConfig[currentNetwork];

if (!netConf) {
  throw new Error(`Unknown Tron network: ${currentNetwork}`);
}

// Get network_id
const netId = netConf.network_id;

// Use dynamic network_id instead of hardcoded '3'
const tip712Address = TIP712.networks[netId]?.address;

console.log(`Using network: ${currentNetwork} (id=${netId})`);
console.log('Contract address:', tip712Address);

console.log('The app has been configured.')
console.log('Run "npm run dev" to start it.')

const tip712SigConfig = {
  contractAddress: tip712Address,
  privateKey: netConf.privateKey,
  fullHost: netConf.fullHost
}

fs.writeFileSync(path.resolve(__dirname, '../src/js/tip712-config.js'),`var tip712SigConfig = ${JSON.stringify(tip712SigConfig, null, 2)}`)
