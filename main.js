import bs58 from "bs58";
import { Transaction, SystemProgram, Keypair, Connection, sendAndConfirmTransaction } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMintInstruction, getMinimumBalanceForRentExemptMint, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata';
import { bundlrStorage, findMetadataPda, keypairIdentity, Metaplex, } from '@metaplex-foundation/js';
import { nftStorage } from "@metaplex-foundation/js-plugin-nft-storage";
import { key, tokenPriv } from './secret.js';

const endpoint = `https://crimson-restless-snow.solana-mainnet.quiknode.pro/${YOUR_API_KEY}`;
const solanaConnection = new Connection(endpoint);

const MINT_CONFIG = {//should be changed in your cases
  numDecimals: 6,
  numberTokens: 1000000000
}

const MY_TOKEN_METADATA = {
  name: "TOKEN_NAME",
  symbol: "TOKEN_SYMBOL",
  description: "Token description",
  image: "Image link"
}

const ON_CHAIN_METADATA = {
  name: MY_TOKEN_METADATA.name,
  symbol: MY_TOKEN_METADATA.symbol,
  uri: "",
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null
};

const uploadMetadata = async (wallet, tokenMetadata) => {

  const metaplex = Metaplex.make(solanaConnection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage({
      address: 'https://devnet.bundlr.network',
      providerUrl: endpoint,
      timeout: 60000,
    }))
    .use(nftStorage());

  const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
  console.log(`nftStorage: `, uri);
  return uri;

}


const createNewMintTransaction = async (connection, payer, mintKeypair, destinationWallet, mintAuthority, freezeAuthority) => {
  const requiredBalance = await getMinimumBalanceForRentExemptMint(connection);
  const metadataPDA = await findMetadataPda(mintKeypair.publicKey);
  const tokenATA = await getAssociatedTokenAddress(mintKeypair.publicKey, destinationWallet);

  const createNewTokenTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: requiredBalance,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey, //Mint Address
      MINT_CONFIG.numDecimals, //Number of Decimals of New mint
      mintAuthority, //Mint Authority
      freezeAuthority, //Freeze Authority
      TOKEN_PROGRAM_ID),
    createAssociatedTokenAccountInstruction(
      payer.publicKey, //Payer 
      tokenATA, //Associated token account 
      payer.publicKey, //token owner
      mintKeypair.publicKey, //Mint
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      tokenATA,
      mintAuthority,
      MINT_CONFIG.numberTokens * Math.pow(10, MINT_CONFIG.numDecimals),
    ),
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: mintAuthority,
        payer: payer.publicKey,
        updateAuthority: mintAuthority,
      },
      {
        createMetadataAccountArgsV3:
        {
          data: ON_CHAIN_METADATA,
          isMutable: true,
          collectionDetails: null
        },
      }
    ),
  );

  return createNewTokenTransaction;
}

const main = async () => {
  console.log(`---STEP 1: Uploading MetaData---`);
  const userWallet = Keypair.fromSecretKey(new Uint8Array(bs58.decode(key)));
  let metadataUri = await uploadMetadata(userWallet, MY_TOKEN_METADATA);
  ON_CHAIN_METADATA.uri = metadataUri;

  console.log(`---STEP 2: Creating Mint Transaction---`);
  let mintKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(tokenPriv)));
  console.log(`New Mint Address: `, bs58.encode(mintKeypair.secretKey));
  console.log("puc", mintKeypair.publicKey.toString())

  const newMintTransaction = await createNewMintTransaction(
    solanaConnection,
    userWallet,
    mintKeypair,
    userWallet.publicKey,
    userWallet.publicKey,
    userWallet.publicKey
  );

  console.log(`---STEP 3: Executing Mint Transaction---`);
  const transactionId = await sendAndConfirmTransaction(solanaConnection, newMintTransaction, [userWallet, mintKeypair])
  console.log(`Transaction ID: `, transactionId);
  console.log(`Succesfully minted ${MINT_CONFIG.numberTokens} ${ON_CHAIN_METADATA.symbol} to ${userWallet.publicKey.toString()}.`);
  console.log(`View Transaction: https://explorer.solana.com/tx/${transactionId}`);
}

main();