# Mint-fungible-token-with-specific-token-address
Mint fungible token on solana with specific token address
- Before start let's get specific address for token([`vanity`](https://github.com/rookie0/vanity.web3))
`npm install -g vanity.web3`
`vanity address NEW 1 -c solana -n TOKEN `
This means create a solana address start with "NEW" and end with "TOKEN"
This will generate publicKey and privateKey.
You can import privateKey in phantom and export again to get valid priv key.
You can copy this privKey in secret.js
- Install modules
`npm install`
- Modify Token Datas in MINT_CONFIG, MY_TOKEN_METADATA
- run `npm start`

If it was helpful, please DONATE here.

`CadWz7VAsWJSEhpU9DKNWfVQY9tThmetnMzrz7pMRG7G`

