import RLP from 'rlp-browser';
import { PrivateKey } from '@fidm/x509';
import BitSet from 'bitset';


export const FLAG_POSITIONS = {
    DOMAIN_HASHED: 0,
    ALLOW_SUBENDORSEMENT: 1,
    EXCLUSIVE: 2,
    PAYABLE: 3,
    ALLOW_SUBDOMAIN: 4,
    ALLOW_ALTERNATIVEDOMAIN: 5,
    TRUST_AFTER_EXPIRY: 6,
};

export const predictContractAddress = async (web3) => {
    const senderAddress = web3.currentProvider.selectedAddress;
    console.log("Sender address:", senderAddress);

    if (!senderAddress) {
        throw new Error('Unable to get wallet address!');
    }
    const nonce = await web3.eth.getTransactionCount(senderAddress);

    const futureAddress = "0x" + web3.utils.sha3(RLP.encode([senderAddress, nonce])).substring(26);
    console.log("Faddress:", futureAddress);

    return futureAddress;
};

export const generateSignature = async ({ address, domain, expiry, flagsHex }, privateKeyPem) => {
    const claim = `${address}.${domain}.${expiry}.${flagsHex}`;
    console.log('====> CLAIM', claim);
    const privateKey = PrivateKey.fromPEM(privateKeyPem);
    return privateKey.sign(claim, 'RSA-SHA256').toString('base64');
};


export const flagsTo24BytesHex = (flagsBitVector) => {
    // const flagsBitVectorWithSANITY = new BitSet(bitVectorToInt(flagsBitVector) + 1);
    const flagsBitVectorWithSANITY = new BitSet(flagsBitVector.toString() + '1');
    let hex = flagsBitVectorWithSANITY.slice(0, Object.keys(FLAG_POSITIONS).length - 1).toString(16);
    if (hex.length < 48) {
        hex = '0'.repeat(48 - hex.length) + hex;
    }
    return '0x' + hex;
};

export const hexStringToBitSet = (hexStr) => {
    const flagsBitVectorWithoutSANITY = parseInt(hexStr).toString(2).slice(0, -1);
    return new BitSet(flagsBitVectorWithoutSANITY === ''? 0 : flagsBitVectorWithoutSANITY);
};