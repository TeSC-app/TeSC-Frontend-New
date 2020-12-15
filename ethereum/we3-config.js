import Web3 from 'web3';


let web3;


if (typeof window !== 'undefined' && window.ethereum !== 'undefined') {
    /**
     * We are in the browser and metasmask is running
     */
    const enableAccounts = async () => {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
    };

    enableAccounts();
    web3 = new Web3(window.ethereum);

} else {
    /**
     * We are on the server *OR* the user is not running Metamask
     * --> create our own provider and wire it up with web3
     */

    const provider = new Web3.providers.HttpProvider(
        'https://rinkeby.infura.io/v3/ad6c5b3aa2854ff2845f842c4e308077'
    );

    web3 = new Web3(provider);
}

export default web3;
