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

export const loadLocalTescs = (walletAddress) => {
    const tescArray = loadStorage(walletAddress);
    if (tescArray.length === 0) return {};
    for (const tesc of tescArray) {
        const { contractAddress, ...rest } = tesc;
        localTescs[contractAddress] = rest;
    }
};

export const getLocalTescs = (walletAddress) => {
    if (Object.keys(localTescs).length === 0) loadLocalTescs(walletAddress);
    console.log('returned localTescs', localTescs);
    return localTescs;
};

export const save = (localTescs, account) => {
    const tescArray = Object.entries(localTescs).map(entry => {
        entry[1].contractAddress = entry[0];
        return entry[1];
    });
    localStorage.setItem(account, JSON.stringify(tescArray));
};

export const saveArray = (tescArray, account) => {
    localStorage.setItem(account, JSON.stringify(tescArray));
};

export const toggleFavourite = ({ account, contractAddress, domain, expiry }, cb = undefined) => {
    const localTescs = getLocalTescs(account);
    let found = localTescs[contractAddress] && Object.keys(localTescs[contractAddress]).length > 0;
    if (found) {
        localTescs[contractAddress].isFavourite = !localTescs[contractAddress].isFavourite;
        if (!localTescs[contractAddress].isFavourite && !localTescs[contractAddress].own) {
            delete localTescs[contractAddress];
        }
    } else {
        localTescs[contractAddress] = { domain, expiry, isFavourite: true, own: false, createdAt: moment().format('DD/MM/YYYY HH:mm') };
    }
    save(localTescs, account);
    if (cb) cb(localTescs);
    return localTescs;
};