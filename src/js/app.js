import TronWeb from 'tronweb';
import { tip712SigConfig } from "./tip712-config.js"
import Trx from '@ledgerhq/hw-app-trx';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

var contractAddress
let tronWeb
const path = "44'/195'/0'/0/0";
var ledgerHardwareAddress
var ledgerApp

try {
  contractAddress = tip712SigConfig.contractAddress
  tronWeb = new TronWeb.TronWeb({
    fullHost: tip712SigConfig.fullHost,
    privateKey: tip712SigConfig.privateKey
  })
} catch (err) {
  alert('The app looks not configured. Please run `npm run migrate`')
}

/* input: const data = {
    "from": {
        "name": "Cow",
        "wallet": "0xCD2A3D9F938E13CD947EC05ABC7FE734DF8DD826",
        "trcTokenId": "1002000"
    },
    "to": {
        "name": "Bob",
        "wallet": "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        "trcTokenArr": ["1002000", "1002000"]
    },
    "contents": "Hello, Bob!",
    "tAddr": [
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    ],
    "trcTokenId": "1002000",
    "trcTokenArr": ["1002000", "1002000"]
};
run: autoTransform(data);
result:
[
  ["Cow","0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","1002000"],
  ["Bob","0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",["1002000","1002000"]],
  "Hello, Bob!",
  ["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"],
  "1002000",
  ["1002000","1002000"]
] */
function autoTransform(input) {
  // Handle null or undefined
  if (input === null || input === undefined) return input;

  // Handle arrays
  if (Array.isArray(input)) {
    return input.map(item => autoTransform(item));
  }

  // Handle objects (structs)
  if (typeof input === "object") {
    const result = [];
    for (const key of Object.keys(input)) {
      result.push(autoTransform(input[key]));
    }
    return result;
  }

  // Return primitive values as-is
  return input;
}

/**
 * Parse a 65-byte hex signature into r, s, v components
 * Pads with leading zeros if the signature is too short
 * Keeps 0x prefix
 * 
 * @param {string} sig - Signature hex string, e.g. "0x..." or without "0x"
 * @returns {object} - { r: string, s: string, v: number }
 */
function parseSignature(sig) {
    // Remove 0x prefix if present
    let prefix = "";
    if (sig.startsWith("0x")) {
        sig = sig.slice(2);
        prefix = "0x";
    } else {
      prefix = "0x";
    }

    // Ensure the signature has exactly 130 hex chars (65 bytes)
    if (sig.length < 130) {
        // Pad the start with zeros
        sig = sig.padStart(130, "0");
    }

    // r: first 32 bytes (64 hex chars)
    const r = prefix + sig.slice(0, 64);

    // s: next 32 bytes (64 hex chars)
    const s = prefix + sig.slice(64, 128);

    // v: last byte (2 hex chars)
    let v = parseInt(sig.slice(128, 130), 16);

    // Tron/Ethereum compatibility:
    // if v is 0 or 1, convert to 27/28
    if (v < 27) v += 27;

    return { r, s, v };
}

async function initLedger(path) {
  let transport, app, address;
  try {
    transport = await TransportWebHID.create();
    app = new Trx(transport);
    address = await app.getAddress(path);
    console.log(address);
  } catch (err) {
    alert('initLedger error:' + err)
  }
  console.log("address:", address);
  return { transport, app, address };
}

/**
 * Build a valid EIP-712 typedData object
 * EIP712Domain definition is fixed and injected internally
 *
 * @param {Object} domain  - Domain values (name, version, chainId, verifyingContract)
 * @param {Object} types   - Custom types only (DO NOT include EIP712Domain)
 * @param {Object} message - Message data
 * @param {string} [primaryType] - Optional explicit primaryType
 * @returns {Object} EIP-712 typedData
 */
function buildTypedData(domain, types, message, primaryType) {
  if (!domain || !types || !message) {
    throw new Error("domain, types and message are required");
  }

  // Fixed EIP712Domain definition (per spec)
  const EIP712_DOMAIN_TYPE = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" }
  ];

  // Auto-detect primaryType if not provided
  if (!primaryType) {
    const typeNames = Object.keys(types);

    if (typeNames.length === 0) {
      throw new Error("types must contain at least one custom type");
    }

    // Try to find the type that best matches message keys
    primaryType =
      typeNames.find((type) => {
        const fields = types[type].map((f) => f.name);
        return Object.keys(message).every((k) => fields.includes(k));
      }) || typeNames[typeNames.length - 1];
  }

  if (!types[primaryType]) {
    throw new Error(`primaryType "${primaryType}" not found in types`);
  }

  return {
    domain,
    primaryType,
    types: {
      EIP712Domain: EIP712_DOMAIN_TYPE,
      ...types
    },
    message
  };
}


var App = {
  tronWebProvider: null,
  contracts: {},
  accounts: [],
  contractAddress: contractAddress,
  privateKey: "0000000000000000000000000000000000000000000000000000000000000001",
  feeLimit: 100000000,
  callValue: 0,
  "abi": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "FROMPERSON_TYPE",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "MAIN_TYPE",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "TOPERSON_TYPE",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_CACHED_CHAIN_ID",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_CACHED_DOMAIN_SEPARATOR",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_CACHED_THIS",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_HASHED_NAME",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_HASHED_VERSION",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "_TYPE_HASH",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "domainSeparatorV4",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "wallet",
                  "type": "address"
                },
                {
                  "internalType": "trcToken",
                  "name": "trcTokenId",
                  "type": "trcToken"
                }
              ],
              "internalType": "struct TIP712.FromPerson",
              "name": "from",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "wallet",
                  "type": "address"
                },
                {
                  "internalType": "trcToken[]",
                  "name": "trcTokenArr",
                  "type": "trcToken[]"
                }
              ],
              "internalType": "struct TIP712.ToPerson",
              "name": "to",
              "type": "tuple"
            },
            {
              "internalType": "string",
              "name": "contents",
              "type": "string"
            },
            {
              "internalType": "address[]",
              "name": "tAddr",
              "type": "address[]"
            },
            {
              "internalType": "trcToken",
              "name": "trcTokenId",
              "type": "trcToken"
            },
            {
              "internalType": "trcToken[]",
              "name": "trcTokenArr",
              "type": "trcToken[]"
            }
          ],
          "internalType": "struct TIP712.Mail",
          "name": "mail",
          "type": "tuple"
        }
      ],
      "name": "getHash",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "hash",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "components": [
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "wallet",
                  "type": "address"
                },
                {
                  "internalType": "trcToken",
                  "name": "trcTokenId",
                  "type": "trcToken"
                }
              ],
              "internalType": "struct TIP712.FromPerson",
              "name": "from",
              "type": "tuple"
            },
            {
              "components": [
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "address",
                  "name": "wallet",
                  "type": "address"
                },
                {
                  "internalType": "trcToken[]",
                  "name": "trcTokenArr",
                  "type": "trcToken[]"
                }
              ],
              "internalType": "struct TIP712.ToPerson",
              "name": "to",
              "type": "tuple"
            },
            {
              "internalType": "string",
              "name": "contents",
              "type": "string"
            },
            {
              "internalType": "address[]",
              "name": "tAddr",
              "type": "address[]"
            },
            {
              "internalType": "trcToken",
              "name": "trcTokenId",
              "type": "trcToken"
            },
            {
              "internalType": "trcToken[]",
              "name": "trcTokenArr",
              "type": "trcToken[]"
            }
          ],
          "internalType": "struct TIP712.Mail",
          "name": "mail",
          "type": "tuple"
        },
        {
          "internalType": "uint8",
          "name": "v",
          "type": "uint8"
        },
        {
          "internalType": "bytes32",
          "name": "r",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "s",
          "type": "bytes32"
        }
      ],
      "name": "verifyMail",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  init: async function () {
    const {transport, app, address} = await initLedger(path);
    if (address !== undefined) {
      ledgerHardwareAddress = address.address;
    }
    console.log("ledgerHardwareAddress:", ledgerHardwareAddress);
    ledgerApp = app;
    console.log("ledgerApp:", ledgerApp);

    this.accounts = [
      tronWeb.address.fromPrivateKey(tip712SigConfig.privateKey)
    ]

    $("#contractAddress").text(tronWeb.address.fromHex(this.contractAddress))
    document.getElementById("signer_address").value = this.accounts[0];
    //this.initData();
    this.bindEvents();
  },

  verifyTIP712Sig: function () {
    var that = this;
    var sender = $("#signer_address").val();
    var value = JSON.parse($("#value").val());
    console.log("value:", value);
    var mail = autoTransform(value);
    console.log("mail:", mail);
    var v = JSON.parse($("#v").val());
    console.log("v:", v);
    var r = $("#r").val();
    console.log("r:", r);
    var s = $("#s").val();
    console.log("s:", s);

    $("#loading").css({display: 'block'});
    $("#verify_sig").attr('disabled', 'disabled');

    this.triggerContract('verifyMail', [sender, mail, v, r, s], function (res)  {
      $("#loading").css({display: 'none'});
      $("#verify_sig").attr('disabled', null);
      $("#result").css({display: 'block'});
      $("#resResult").html(res.toString());
      console.log("verify result:", res);
    });
  },

  getTIP712MessageHash: function () {
    var that = this;

    return new Promise((resolve, reject) => {
      var _value = JSON.parse($("#value").val());
      console.log("_value:", _value);
      var callValArray = autoTransform(_value);
      console.log("callValArray:", callValArray);

      $("#loading").show();
      $("#get_tip712_hash").attr('disabled', true);

      that.triggerContract(
        'getHash',
        [callValArray],
        function (res) {
          $("#loading").hide();
          $("#get_tip712_hash").attr('disabled', null);

          const hash = res.toString();
          $("#TIP712messageHash").html(hash);
          $("#TIP712message").show();
          console.log("hash:", hash);

          resolve(hash);   // keypoint
        }
      );
    });
  },

  signWithTronweb: async function () {
    var that = this;
    try {
      // always getTIP712MessageHash()
      await that.getTIP712MessageHash();

      document.getElementById("signer_address").value = this.accounts[0];
      const domain = JSON.parse($("#domain").val());
      console.log("domain:", domain);
      const types = JSON.parse($("#types").val());
      console.log("types:", types);
      const value = JSON.parse($("#value").val());
      console.log("value:", value);
      // show loading + disable button
      $("#loading").css({display: 'block'});
      $("#sign_with_tronweb").prop('disabled', true);

      // await the signature
      const sig = await tronWeb.trx._signTypedData(domain, types, value);

      // hide loading + enable button
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);

      // show result (inspect the sig shape first)
      console.log("signWithTronweb result:", sig);
      const { r, s, v } = parseSignature(sig);
      // if sig is object, stringify it; if it's a hex string, show directly
      const display = (typeof sig === 'object') ? JSON.stringify(sig, null, 2) : String(sig);
      $("#result").css({display: 'block'});
      $("#resResult").html(display);
      $("#r").val(r.toString());
      $("#s").val(s.toString());
      $("#v").val(v.toString());
      $("#signature").val(sig.toString());

    } catch (err) {
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);
      console.error("Sign failed:", err);
      alert("Signing failed: " + (err.message || err));
    }
  },

  signWithLedgerDevice: async function () {
    var that = this;
    try {
      // always getTIP712MessageHash()
      await that.getTIP712MessageHash();
      
      document.getElementById("signer_address").value = ledgerHardwareAddress;
      const domain = JSON.parse($("#domain").val());
      console.log("domain:", domain);
      const types = JSON.parse($("#types").val());
      console.log("types:", types);
      const value = JSON.parse($("#value").val());
      console.log("value:", value);
      // show loading + disable button
      $("#loading").css({display: 'block'});
      $("#sign_with_tronweb").prop('disabled', true);

      const typedData = buildTypedData(domain, types, value);

      // await the signature
      const sig = await ledgerApp.signTIP712Message(path, typedData);

      // hide loading + enable button
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);

      // show result (inspect the sig shape first)
      console.log("signWithLedgerDevice result:", sig);
      const { r, s, v } = parseSignature(sig);
      // if sig is object, stringify it; if it's a hex string, show directly
      const display = (typeof sig === 'object') ? JSON.stringify(sig, null, 2) : String(sig);
      $("#result").css({display: 'block'});
      $("#resResult").html(display);
      $("#r").val(r.toString());
      $("#s").val(s.toString());
      $("#v").val(v.toString());
      $("#signature").val(sig.toString());

    } catch (err) {
      $("#loading").css({display: 'none'});
      $("#sign_with_tronweb").prop('disabled', false);
      console.error("Sign failed:", err);
      alert("Signing failed: " + (err.message || err));
    }
  },

  getContract: function (address, callback) {
    tronWeb.getContract(address).then(function (res) {
      callback && callback(res);
    });
  },

  triggerContract: async function (methodName, args, callback) {
    console.log(this.contractAddress)
    let myContract = await tronWeb.contract(this.abi, this.contractAddress)

    var callSend = 'send'
    this.abi.forEach(function (val) {
      if (val.name === methodName) {
        callSend = /payable/.test(val.stateMutability) ? 'send' : 'call'
      }
    })

    myContract[methodName](...args)[callSend]({
      feeLimit: this.feeLimit,
      callValue: this.callValue || 0,
    }).then(function (res) {
      console.log(res);
      callback && callback(res);
    })
  },

  initTronWeb: function () {
    /*
     * Replace me...
     */

    return this.initContract();
  },

  initContract: function () {
    /*
     * Replace me...
     */

    return this.bindEvents();
  },

  bindEvents: function () {
    var that = this;
    $(document).on('click', '#verify_sig', function () {
      that.verifyTIP712Sig();
    });

    $(document).on('click', '#get_tip712_hash', function () {
      that.getTIP712MessageHash();
    });

    $(document).on('click', '#sign_with_tronweb', function () {
      that.signWithTronweb();
    });

    $(document).on('click', '#sign_with_ledger', function () {
      that.signWithLedgerDevice();
    });
  },

  markAdopted: function (adopters, account) {
    /*
     * Replace me...
     */
  },

  handleAdopt: function (event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    /*
     * Replace me...
     */
  }
};

$(function () {
  $(window).on("load", function () {
    App.init();
  });
});
