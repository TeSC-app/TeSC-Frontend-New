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
        throw new Error('Wallet address not found! Your wallet might not be connected to this site.');
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
    const flagsBitVectorWithSANITY = new BitSet(flagsBitVector.toString() + '1');
    let hex = flagsBitVectorWithSANITY.slice(0, Object.keys(FLAG_POSITIONS).length - 1).toString(16);
    if (hex.length < 48) {
        hex = '0'.repeat(48 - hex.length) + hex;
    }
    return '0x' + hex;
};

export const hexStringToBitSet = (hexStr) => {
    const flagsBitVectorWithoutSANITY = parseInt(hexStr).toString(2).slice(0, -1);
    return new BitSet(flagsBitVectorWithoutSANITY === '' ? 0 : flagsBitVectorWithoutSANITY);
};


export const buildDeploymentTx = async ({ web3, tescJson, domain, expiry, flags, signature }) => {
    const flagsHex = flagsTo24BytesHex(flags);
    return await new web3.eth.Contract(tescJson.abi).deploy({
        data: tescJson.bytecode,
        arguments: [domain, expiry, flagsHex, signature]
    });
};


export const estimateDeploymentCost = async (web3, tx) => {
    const gasEstimation = await tx.estimateGas({ from: web3.currentProvider.selectedAddress, gas: '2000000' });
    return gasEstimation * web3.utils.fromWei(await web3.eth.getGasPrice(), 'ether');
};


export const storeTesc = ({ account, claim }) => {
    const { contractAddress, domain, expiry } = claim;
    let tescs = JSON.parse(localStorage.getItem(account));
    if (!tescs) {
        tescs = [];
    }
    tescs.push({ contractAddress, domain, expiry, isFavourite: false });
    localStorage.setItem(account, JSON.stringify(tescs));
};

export const isValidContractAddress = (address, withReason = false) => {
    if (!withReason) {
        return (address.substring(0, 2) === '0x')
            && (address.length === 42)
            && Boolean(address.match(/^0x[0-9a-f]+$/i));
    }

    if (!address) {
        throw new Error('Contract address is empty');
    } else if (address.substring(0, 2) !== '0x') {
        throw new Error('Contract address must start with 0x');
    } else if (address.length !== 42) {
        throw new Error('Contract address must be 42 characters long (prefix 0x and 40 hexadecimal digits)');
    } else if (!Boolean(address.match(/^0x[0-9a-f]+$/i))) {
        throw new Error('Contract address contains non-hexadecimal digits');
    }
    return true;
};