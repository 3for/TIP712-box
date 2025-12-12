# tip712-box

Verify 'TIP712' signature in solidity with Tronbox.

```
git clone https://github.com/3for/TIP712-box
cd TIP712-box
cp sample-env .env
# set correspoding PRIVATE_KEY_NILE and TRON_NETWORK=nile in .env file
tronbox compile
npm install
npm run migrate
npm run dev
```

Steps:

1. Run "http://localhost:3000/" in brower.

2. Set compact JSON Format "TIP712 Domain", "TIP712 struct types", "TIP712 struct value"

For example, "TIP712 Domain" as:[Special Attention, `3448148188` is the chainId of Tron Nile testnet.]
```
{"name":"TrcToken Test","version":"1","chainId":"3448148188","verifyingContract":"0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"}
```
"TIP712 struct types" as:
```
{"FromPerson":[{"name":"name","type":"string"},{"name":"wallet","type":"address"},{"name":"trcTokenId","type":"trcToken"}],"ToPerson":[{"name":"name","type":"string"},{"name":"wallet","type":"address"},{"name":"trcTokenArr","type":"trcToken[]"}],"Mail":[{"name":"from","type":"FromPerson"},{"name":"to","type":"ToPerson"},{"name":"contents","type":"string"},{"name":"tAddr","type":"address[]"},{"name":"trcTokenId","type":"trcToken"},{"name":"trcTokenArr","type":"trcToken[]"}]}
```
"TIP712 struct value" as:
```
{"from":{"name":"Cow","wallet":"0xCD2A3D9F938E13CD947EC05ABC7FE734DF8DD826","trcTokenId":"1002000"},"to":{"name":"Bob","wallet":"0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB","trcTokenArr":["1002000","1002000"]},"contents":"Hello, Bob!","tAddr":["0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB","0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"],"trcTokenId":"1002000","trcTokenArr":["1002000","1002000"]}
```

3. Click "Get TIP712 Hash" [Can skip this step]

4. Click "Sign with tronWeb"

5. Click "Verify TIP712 signature", the result should be `true`

