import { createRequire } from 'module';
import * as bip39 from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
const require = createRequire(import.meta.url);
const { ECPairFactory } = require('ecpair');

const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

const network = bitcoin.networks.bitcoin

run()
function run() {
  const MNEMONIC = 'praise you muffin lion enable neck grocery crumble super myself license ghost';

  // Derivation pattern: "m/{purpose}'/{coin}'/{account}'/{change}/{address}"
  const accountPath = "m/84'/0'/0'";
  const addressPath = "0/1"
  const derivationPath = `${accountPath}/${addressPath}`;
  const { xpriv, xpub } = generateMasterKeys(MNEMONIC, accountPath);

  const address = generateAddressFromXpub(xpub, addressPath);
  const privateKeyWIF = generatePrivatekeyFromPath(derivationPath, MNEMONIC);

  console.log({ xpub, privateKeyWIF, xpriv, address });

  const node = ECPair.fromWIF(privateKeyWIF);
  console.log("Is private key and address match?", getAddressFromWIF(node.toWIF()) === address);

}

function getAddressFromWIF(WIF) {
  const keyPair = ECPair.fromWIF(WIF);
  const address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address;
  console.log("address generated from private key: ", address);
  return address;
}

function generateMasterKeys(mnemonic, path) {
  // 1. Generate a seed from the mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  // 2. Derive the root key from the seed
  const masterNode = bip32.fromSeed(seed, network);

  const xpriv = masterNode.derivePath(path)
  const xpub = xpriv.neutered().toBase58()

  return { xpriv: xpriv.toBase58(), xpub }
}

function generateAddressFromXpub(xpub, path) {
  const xpubNode = bip32.fromBase58(xpub, network);
  const childNode = xpubNode.derivePath(path);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: childNode.publicKey,
    network
  });

  if (!address) {
    throw new Error('Failed to generate address.');
  }

  return address;
}
function generatePrivatekeyFromPath(path, mnemonic) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed, network);
  const child = root.derivePath(path);
  if (!child.privateKey) {
    throw new Error('Private key was no found.');
  }

  return child.toWIF()
}

