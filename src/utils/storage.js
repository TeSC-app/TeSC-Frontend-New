import moment from 'moment';
import web3 from 'web3';

let localTescs = {};

export const loadStorage = (walletAddress) => {
    // const walletAddress = web3.currentProvider.selectedAddress;
    if (!walletAddress) return [];
    console.log('loadStorage of ', walletAddress);
    const storage = JSON.parse(localStorage.getItem(web3.utils.toChecksumAddress(walletAddress)));
    return storage ? storage : [];
};

export const loadLocalTescObjects = (walletAddress) => {
    const tescArray = loadStorage(walletAddress);
    if (tescArray.length === 0) return {};
    for (const tesc of tescArray) {
        localTescs[tesc.contractAddress] = tesc;
    }
    return localTescs;
};

export const getLocalTescs = (walletAddress) => {
    if (Object.keys(localTescs).length === 0)
        return loadLocalTescObjects(walletAddress);

    return localTescs;
};

export const getLocalTesc = (walletAddress, contractAddress) => {
    const tescArray = loadStorage(walletAddress);
    for (const tesc of tescArray) {
        if (tesc.contractAddress === contractAddress) {
            return tesc;
        }
    }
    return null;
};

export const updateTeSC = (account, localTesc) => {
    updateLocalStorage(account, localTesc);
};

export const storeNewTesc = ({ account, claim }) => {
    const { contractAddress, domain, expiry } = claim;
    const newTesc = { contractAddress, domain, expiry, isFavourite: false, own: true, verified: false, createdAt: moment().unix() };
    updateLocalStorage(account, newTesc);
};

const updateLocalStorage = (account, tesc) => {
    let tescs = loadStorage(account);
    if (!tescs) {
        tescs = [];
    }
    let foundAt = -1;
    for (let i = 0; i < tescs.length; i++) {
        if (tescs[i].contractAddress === tesc.contractAddress) {
            foundAt = i;
            break;
        }
    }
    if (foundAt < 0) {
        tescs.push(tesc);
    } else {
        console.log('foundAt', foundAt);
        console.log('newTesc', tesc);
        tescs[foundAt] = tesc;
    }
    localStorage.setItem(account, JSON.stringify(tescs));
};

export const saveArray = (tescArray, account) => {
    localStorage.setItem(account, JSON.stringify(tescArray));
};

export const toggleFavourite = (account, tesc, cb = undefined) => {
    const localTescs = getLocalTescs(account);
    const { contractAddress } = tesc;
    let found = localTescs && localTescs[contractAddress];
    if (found) {
        localTescs[contractAddress].isFavourite = !localTescs[contractAddress].isFavourite;
        if (!localTescs[contractAddress].isFavourite && !localTescs[contractAddress].own) {
            console.log('deleting ', contractAddress);
            delete localTescs[contractAddress];
        }
    } else {
        localTescs[contractAddress] = { ...tesc, isFavourite: true, createdAt: moment().unix() };
    }
    console.log('localTescs ', localTescs);

    localStorage.setItem(account, JSON.stringify(Object.values(localTescs)));
    if (cb) cb(localTescs[contractAddress]);
    return localTescs[contractAddress];
};