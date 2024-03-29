import RLP from 'rlp-browser';
import { PrivateKey } from '@fidm/x509';
import BitSet from 'bitset';
import moment from 'moment';
import web3 from 'web3';

window.web3Utils = web3.utils;

export const FLAGS = {
    DOMAIN_HASHED: 0,
    ALLOW_SUBENDORSEMENT: 1,
    EXCLUSIVE: 2,
    PAYABLE: 3,
    ALLOW_SUBDOMAIN: 4,
    ALLOW_ALTERNATIVEDOMAIN: 5,
    TRUST_AFTER_EXPIRY: 6,
};

export const predictContractAddress = async (web3) => {
    const senderAddress = web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress);
    console.log("Sender address:", senderAddress);

    if (!senderAddress) {
        // throw new Error('Wallet address not found! Your wallet might not be connected to this site.');
        return;
    }
    const nonce = await web3.eth.getTransactionCount(senderAddress);

    const futureAddress = "0x" + web3.utils.sha3(RLP.encode([senderAddress, nonce])).substring(26);
    console.log("Faddress:", futureAddress);

    return web3.utils.toChecksumAddress(futureAddress);
};

export const generateSignature = async ({ address, domain, expiry, flagsHex }, privateKeyPem) => {
    const claim = formatClaim({
        contractAddress: address,
        domain,
        expiry,
        flags: flagsHex
    });
    console.log('====> CLAIM', claim);
    const privateKey = PrivateKey.fromPEM(privateKeyPem);
    return privateKey.sign(claim, 'RSA-SHA256').toString('base64');
};


export const flagsToBytes24Hex = (flagsBitVector) => {
    const flagsBitVectorWithSANITY = new BitSet(flagsBitVector.toString() + '1');
    let hex = '0x' + flagsBitVectorWithSANITY.slice(0, Object.keys(FLAGS).length - 1).toString(16);
    return web3.utils.padLeft(hex, 48);
};

export const padToBytesX = (hexNumber, x, prefix0x = true) => {
    let hex = (typeof (hexNumber) === 'number') ? hexNumber.toString(16) : hexNumber;
    hex = (hex.substring(0, 2) === '0x') ? hex.substring(2) : hex;
    if (hex.length < x * 2) {
        hex = '0'.repeat(x * 2 - hex.length) + hex;
    }
    return prefix0x ? '0x' + hex : hex;
};

export const hexStringToBitSet = (hexStr) => {
    const flagsBitVectorWithoutSANITY = parseInt(hexStr).toString(2).slice(0, -1);
    return new BitSet(flagsBitVectorWithoutSANITY === '' ? 0 : flagsBitVectorWithoutSANITY);
};


export const estimateDeploymentCost = async (web3, tx) => {
    const gasEstimation = await tx.estimateGas({ from: web3.utils.toChecksumAddress(web3.currentProvider.selectedAddress), gas: '3000000' });
    return gasEstimation * web3.utils.fromWei(await web3.eth.getGasPrice(), 'ether');
};


export const isValidContractAddress = (address, withReason = false) => {
    if (!withReason) {
        return (address.substring(0, 2) === '0x')
            && Boolean(address.match(/^0x[0-9a-fA-F]*$/i))  // could've used web3Utils.isHex() or web3Utils.isAddress() instead
            && (address.length === 42)
            && web3.utils.checkAddressChecksum(address);
    }

    if (!address) {
        throw new Error('Contract address is empty');
    } else if (address.substring(0, 2) !== '0x') {
        throw new Error('Contract address must start with 0x');
    } else if (!Boolean(address.match(/^0x[0-9a-fA-F]*$/i))) {
        throw new Error('Contract address contains non-hexadecimal digits');
    } else if (address.length !== 42) {
        throw new Error('Contract address must be 42 characters long (prefix 0x and 40 hexadecimal digits)');
    } else if (!web3.utils.checkAddressChecksum(address)) {
        throw new Error('The capitalization checksum test for the contract address failed');
    }
    return true;
};

export const isSha3 = (str) => {
    return str.length === 66 && web3.utils.isHex(str);
};

export const formatClaim = ({ contractAddress, domain, expiry, flags }) => {
    return `${contractAddress}.${domain}.${expiry}.${flags}`;
};

export const convertToUnix = date => {
    const mDate = moment.utc(date);
    mDate.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    return mDate.unix()
}

export const extractDomainAndTopLevelDomain = domain => {
    const domainParts = domain.split('.')
    let domainName = ''
    let topLevelDomain = ''
    if (domainParts.length > 1) {
        domainName = domainParts[domainParts.length - 2]
        topLevelDomain = domainParts[domainParts.length - 1]
    }
    const domainNameAndTopLevelDomain = domainName.concat(`.${topLevelDomain}`) !== '.' ? domainName.concat(`.${topLevelDomain}`) : domain
    return domainNameAndTopLevelDomain
}

export const extractSubdomainFromDomain = domain => {
    const domainParts = domain.split('.')
    let subDomain = ''
    if (domainParts.length > 2) {
        const subDomainParts = domainParts.slice(0, domainParts.length - 2)
        subDomain = subDomainParts.join('.')
    }
    return subDomain
} 
