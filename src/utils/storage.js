
export const loadStorage = (web3) => {
    const walletAddress = web3.currentProvider.selectedAddress;
    if (walletAddress === null) {
        return [];
    }
    console.log('loadStorage of ', walletAddress);
    return JSON.parse(localStorage.getItem(web3.utils.toChecksumAddress(walletAddress)));
};