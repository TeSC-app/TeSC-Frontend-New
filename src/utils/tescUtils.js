import RLP from 'rlp-browser';
import { PrivateKey } from '@fidm/x509';
import BitSet from 'bitset'

// function isFlagSet(value, flagIndex) {
//     return (value & (1 << flagIndex)) !== 0;
// }

// function convertFlags(flags_hex) {
//     const flags_dec = parseInt(flags_hex, 16);

//     const flag_keys = {
//         "0": "test1",
//         "1": "test2",
//         "2": "DOMAIN_HASHED",
//         "3": "ALLOW_SUBENDORSEMENT",
//         "4": "EXCLUSIVE",
//         "5": "PAYABLE",
//         "6": "ALLOW_SUBDOMAIN",
//         "7": "ALLOW_ALTERNATIVEDOMAIN",
//         "8": "TRUST_AFTER_EXPIRY",
//         "191": "test3"
//     };

//     const readible_flags = {};
//     for (const flag_index of flag_keys) {
//         readible_flags[flag_keys[flag_index]] = isFlagSet(flags_dec, flag_index);
//     }
//     return readible_flags;

// }

// console.log(new BitSet)


const predictContractAddress = async (web3) => {
    const senderAddress = (await web3.eth.getAccounts())[0];
    console.log("Sender address:", senderAddress);

    if(!senderAddress) {
        throw new Error('Unable to get wallet address!')
    }
    const nonce = await web3.eth.getTransactionCount(senderAddress);

    const futureAddress = "0x" + web3.utils.sha3(RLP.encode([senderAddress, nonce])).substring(26);
    console.log("Faddress:", futureAddress);

    return futureAddress;
};

export const generateSignature = async (web3, { domain, expiry, flagHex }, privateKeyPem) => {
    const contractAddress = predictContractAddress(web3);
    const claim = `${contractAddress}.${domain}.${expiry}.${flagHex}`;
    const privateKey = PrivateKey.fromPEM(privateKeyPem);
    return privateKey.sign(claim, 'RSA-SHA256').toString('base64');
};

export const flags2Hex = (flagArray) => {
    const bs = new BitSet('0');
    for (let i = 0; i < flagArray.length; i++) {
        if (flagArray[i]) {
            bs.set(i, 1)    
        }
    }
    return bs.slice(0, 191).toString(16)
}   