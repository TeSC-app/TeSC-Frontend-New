import moment from 'moment';
import web3 from 'web3';

let localTescs = {};

const CREATE = 'create';
const UPDATE = 'update';
const DELETE = 'delete';

export const loadStorage = (walletAddress) => {
    // const walletAddress = web3.currentProvider.selectedAddress;
    if (!walletAddress) return [];
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

const getLocalTescs = (walletAddress) => {
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
    updateLocalStorage(account, newTesc, CREATE);
};

const updateLocalStorage = (account, tesc, op = UPDATE) => {
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
    if (foundAt < 0 && op === CREATE) {
        tescs.push(tesc);
    } else if (op === DELETE) {
        console.log('deleting ', tesc);
        tescs.splice(foundAt, 1);
    } else if (op === UPDATE) {
        tescs[foundAt] = tesc;
    } else {
        console.log('Wrong operator!');
    }
    localStorage.setItem(account, JSON.stringify(tescs));
    return tesc;
};



export const toggleFavourite = (account, tesc, cb = undefined) => {
    const { contractAddress } = tesc;
    let localTesc = getLocalTesc(account, contractAddress);
    let found = !!localTesc;
    let updatedTesc;
    if (found) {
        localTesc.isFavourite = !localTesc.isFavourite;
        updatedTesc = updateLocalStorage(account, localTesc, !localTesc.isFavourite && !localTesc.own ? DELETE : UPDATE);
    } else {
        updatedTesc = updateLocalStorage(account, { ...tesc, isFavourite: true, createdAt: moment().unix() }, CREATE);
    }
    if (cb) cb(updatedTesc);
    return updatedTesc;
};